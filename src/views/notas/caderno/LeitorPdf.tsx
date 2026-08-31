import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentPlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono } from "../../../theme";
import Botao from "../../../components/Botao";
import { Vazio } from "../../../components/Shell";
import { apagarPdf, criarPagina, listarPaginas, listarPdfs, registrarPdf, salvarBlocosPagina, salvarNota, salvarPaginaAtualPdf } from "../../../lib/repo";
import { apagarPdfBinario, salvarPdfBinario, urlDoPdf } from "../../../lib/pdfArquivos";
import { novoBloco } from "../../../lib/caderno/tipos";
import { MATERIAS_ORDENADAS } from "../../../lib/constants";
import type { RegistroPdf } from "../../../lib/repo/pdfs";
import type { PaginaCaderno } from "../../../lib/caderno/tipos";

/** Carregado via import() dinâmico em quem monta este componente (ver
 * CadernoView.tsx) — pdfjs-dist é pesado e não pode entrar no bundle
 * inicial (mesma técnica de DadosTab/recharts em App.tsx). */
async function carregarPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

interface ItemTexto {
  texto: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/**
 * Leitor de PDF do Caderno, portado de web_notebook/pdf_viewer.html no
 * SynapsePro — mas sem a criação de cards do Anki de lá (`mw.col.new_note`),
 * que não tem equivalente aqui. Seleção de texto vira nota (reaproveitando
 * salvarNota) ou bloco de citação numa página do Caderno.
 */
export default function LeitorPdf({
  onVoltar,
  embutido = false,
  pasta = null,
  busca = "",
}: {
  onVoltar: () => void;
  /** Quando true, esconde o link "← Caderno" — usado quando este componente
   * já está dentro da pílula Páginas/PDFs do CadernoView, que cuida da
   * navegação. */
  embutido?: boolean;
  /** Filtra e marca novos PDFs importados com esta pasta (ver
   * CadernoView.tsx). */
  pasta?: string | null;
  /** Filtro por nome, vindo do campo de busca unificado do CadernoView. */
  busca?: string;
}) {
  const [pdfs, setPdfs] = useState<RegistroPdf[] | null>(null);
  const [aberto, setAberto] = useState<RegistroPdf | null>(null);
  const [importando, setImportando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function carregar() {
    listarPdfs(pasta).then(setPdfs);
  }
  useEffect(carregar, [pasta]);

  const termo = busca.trim().toLowerCase();
  const pdfsExibidos = pdfs?.filter((p) => !termo || p.nome.toLowerCase().includes(termo)) ?? null;

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setImportando(true);
    try {
      const bytes = new Uint8Array(await arquivo.arrayBuffer());
      const caminho = await salvarPdfBinario(arquivo.name, bytes);
      await registrarPdf(arquivo.name, caminho, pasta);
      carregar();
    } catch (err) {
      console.error("importar pdf", err);
    } finally {
      setImportando(false);
    }
  }

  async function apagar(p: RegistroPdf) {
    await apagarPdf(p.id);
    await apagarPdfBinario(p.caminho);
    carregar();
  }

  if (aberto) {
    return <VisualizadorPdf registro={aberto} onVoltar={() => setAberto(null)} />;
  }

  return (
    <div>
      {!embutido && (
        <button
          onClick={onVoltar}
          style={{
            ...mono,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: C.sub,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            marginBottom: 14,
          }}
        >
          <ArrowLeftIcon width={14} height={14} />
          Caderno
        </button>
      )}

      <input ref={inputRef} type="file" accept="application/pdf" onChange={importar} style={{ display: "none" }} />
      <Botao tipo="tinta" onClick={() => inputRef.current?.click()} disabled={importando} style={{ marginBottom: 16 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <DocumentPlusIcon width={16} height={16} />
          {importando ? "Importando…" : "Importar PDF"}
        </span>
      </Botao>

      {pdfsExibidos === null ? (
        <Vazio>Carregando…</Vazio>
      ) : pdfsExibidos.length === 0 ? (
        <Vazio>{termo ? `Nada encontrado para "${busca.trim()}".` : "Nenhum PDF ainda."}</Vazio>
      ) : (
        pdfsExibidos.map((p) => (
          <div
            key={p.id}
            style={{ ...cartao, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, cursor: "pointer" }}
            onClick={() => setAberto(p)}
          >
            <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                apagar(p);
              }}
              aria-label="Apagar PDF"
              style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.line}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <TrashIcon width={15} stroke={C.sub} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function VisualizadorPdf({ registro, onVoltar }: { registro: RegistroPdf; onVoltar: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camadaTextoRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const [pagina, setPagina] = useState(registro.pagina || 1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [itensTexto, setItensTexto] = useState<ItemTexto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecao, setSelecao] = useState<{ texto: string; x: number; y: number } | null>(null);
  const [salvarComo, setSalvarComo] = useState<"nota" | "caderno" | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const pdfjs = await carregarPdfjs();
        const url = await urlDoPdf(registro.caminho);
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelado) return;
        docRef.current = doc;
        setTotalPaginas(doc.numPages);
        setCarregando(false);
      } catch (e) {
        if (!cancelado) setErro(e instanceof Error ? e.message : "Falha ao abrir o PDF.");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [registro.caminho]);

  useEffect(() => {
    if (!docRef.current) return;
    let cancelado = false;
    (async () => {
      const doc = docRef.current!;
      const page = await doc.getPage(pagina);
      const viewport = page.getViewport({ scale: 1.3 });
      const canvas = canvasRef.current;
      if (!canvas || cancelado) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (cancelado) return;

      const conteudo = await page.getTextContent();
      const itens: ItemTexto[] = conteudo.items.map((it) => {
        const item = it as { str: string; transform: number[]; width: number; height: number };
        const [a, b, , , e, f] = item.transform;
        const alturaFonte = Math.hypot(a, b) || item.height || 10;
        // pdf.js usa origem no canto inferior-esquerdo; o canvas/DOM usa
        // canto superior-esquerdo — inverter Y contra a altura do viewport.
        return {
          texto: item.str,
          x: e,
          y: viewport.height - f - alturaFonte,
          largura: item.width,
          altura: alturaFonte,
        };
      });
      setItensTexto(itens);
      void salvarPaginaAtualPdf(registro.id, pagina);
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, carregando]);

  function aoSoltarSelecao() {
    const sel = window.getSelection();
    const texto = sel?.toString().trim();
    if (!texto || !sel || sel.rangeCount === 0) {
      setSelecao(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const containerRect = camadaTextoRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setSelecao({ texto, x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top });
  }

  if (erro) {
    return (
      <div>
        <Vazio>{erro}</Vazio>
        <Botao tipo="fantasma" onClick={onVoltar}>Voltar</Botao>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <button
          onClick={onVoltar}
          style={{ ...mono, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeftIcon width={14} height={14} />
          {registro.nome}
        </button>
        {totalPaginas > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} style={botaoNav}>
              <ChevronLeftIcon width={14} height={14} />
            </button>
            <span style={{ ...mono, fontSize: 12, color: C.sub }}>{pagina} / {totalPaginas}</span>
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas} style={botaoNav}>
              <ChevronRightIcon width={14} height={14} />
            </button>
          </div>
        )}
      </div>

      {carregando ? (
        <Vazio>Abrindo PDF…</Vazio>
      ) : (
        <div style={{ position: "relative", overflow: "auto", border: `1.5px solid ${C.line}`, borderRadius: 10, maxHeight: "70vh" }}>
          <canvas ref={canvasRef} style={{ display: "block" }} />
          <div
            ref={camadaTextoRef}
            onMouseUp={aoSoltarSelecao}
            style={{ position: "absolute", inset: 0, lineHeight: 1 }}
          >
            {itensTexto.map((it, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: it.x,
                  top: it.y,
                  fontSize: it.altura,
                  whiteSpace: "pre",
                  color: "transparent",
                  cursor: "text",
                  userSelect: "text",
                }}
              >
                {it.texto}
              </span>
            ))}
          </div>

          {selecao && (
            <div
              style={{
                position: "absolute",
                left: selecao.x,
                top: Math.max(0, selecao.y - 40),
                transform: "translateX(-50%)",
                display: "flex",
                gap: 6,
                background: C.card,
                border: `1.5px solid ${C.line}`,
                borderRadius: 8,
                padding: 4,
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                zIndex: 20,
              }}
            >
              <button onClick={() => setSalvarComo("nota")} style={botaoSelecao}>Salvar como nota</button>
              <button onClick={() => setSalvarComo("caderno")} style={botaoSelecao}>Inserir no caderno</button>
            </div>
          )}
        </div>
      )}

      {salvarComo && selecao && (
        <ModalSalvarSelecao
          texto={selecao.texto}
          modo={salvarComo}
          onFechar={() => {
            setSalvarComo(null);
            setSelecao(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      )}
    </div>
  );
}

const botaoNav: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: `1.5px solid ${C.line}`,
  background: C.card,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const botaoSelecao: React.CSSProperties = {
  ...mono,
  fontSize: 11,
  padding: "6px 10px",
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/** Modal simples para decidir o destino do trecho selecionado — matéria (nota)
 * ou página existente/nova (caderno). */
function ModalSalvarSelecao({
  texto,
  modo,
  onFechar,
}: {
  texto: string;
  modo: "nota" | "caderno";
  onFechar: () => void;
}) {
  const [materia, setMateria] = useState(MATERIAS_ORDENADAS[0]);
  const [paginas, setPaginas] = useState<PaginaCaderno[] | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (modo === "caderno") listarPaginas().then(setPaginas);
  }, [modo]);

  async function salvarComoNota() {
    setSalvando(true);
    try {
      await salvarNota({ materia, corpo: texto, tag: "PDF", questaoOrigemId: null });
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  async function inserirEmPagina(pag: PaginaCaderno | null) {
    setSalvando(true);
    try {
      const bloco = { ...novoBloco("citacao"), texto };
      if (pag) {
        await salvarBlocosPagina(pag.id, [...pag.blocos, bloco]);
      } else {
        const id = await criarPagina({ titulo: "Nova página", pasta: null });
        await salvarBlocosPagina(id, [bloco]);
      }
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      onClick={onFechar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...cartao, width: "min(480px, 100%)", maxHeight: "70vh", overflowY: "auto", borderRadius: "16px 16px 0 0" }}
      >
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 10 }}>
          {modo === "nota" ? "SALVAR COMO NOTA" : "INSERIR NO CADERNO"}
        </div>
        <div style={{ ...disp, fontSize: 13.5, color: C.sub, marginBottom: 14, maxHeight: 80, overflowY: "auto" }}>
          {texto.length > 200 ? `${texto.slice(0, 200)}…` : texto}
        </div>

        {modo === "nota" ? (
          <>
            <select value={materia} onChange={(e) => setMateria(e.target.value)} style={{ ...campo, marginBottom: 12 }}>
              {MATERIAS_ORDENADAS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <Botao tipo="tinta" onClick={salvarComoNota} disabled={salvando}>Salvar nota</Botao>
          </>
        ) : (
          <>
            <button
              onClick={() => inserirEmPagina(null)}
              disabled={salvando}
              style={{ ...campo, textAlign: "left", cursor: "pointer", marginBottom: 8, color: C.caneta, fontWeight: 600 }}
            >
              + Nova página
            </button>
            {paginas === null ? (
              <Vazio>Carregando…</Vazio>
            ) : (
              paginas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => inserirEmPagina(p)}
                  disabled={salvando}
                  style={{ ...campo, textAlign: "left", cursor: "pointer", marginBottom: 6 }}
                >
                  {p.titulo || "Sem título"}
                </button>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

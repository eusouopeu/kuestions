import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeftIcon, FolderPlusIcon, PlusIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { C, campo, cartao, mono } from "../../../theme";
import Botao from "../../../components/Botao";
import Segmented from "../../../components/Segmented";
import { Vazio } from "../../../components/Shell";
import {
  alternarFixadaPagina,
  apagarPagina,
  buscarPaginasCaderno,
  criarPagina,
  listarPaginas,
  listarPastasCaderno,
  listarPastasPdfs,
  obterPagina,
} from "../../../lib/repo";
import type { PaginaCaderno } from "../../../lib/caderno/tipos";
import EditorCaderno from "./EditorCaderno";

// pdfjs-dist é pesado — fora do bundle inicial (mesma técnica de DadosTab
// com recharts em App.tsx). Só quem abrir "PDFs" baixa esse chunk.
const LeitorPdf = lazy(() => import("./LeitorPdf"));

type AbaTopo = "paginas" | "pdfs";
type Tela = { nome: "lista" } | { nome: "editor"; id: number };

/**
 * Roteador do Caderno dentro da aba Notas: pílula Páginas/PDFs no topo,
 * campo de busca compartilhado entre as duas, e navegação por pastas em
 * ambas (mesmo padrão de pasta usado em repo/caderno.ts e repo/pdfs.ts).
 */
export default function CadernoView() {
  const [abaTopo, setAbaTopo] = useState<AbaTopo>("paginas");
  const [tela, setTela] = useState<Tela>({ nome: "lista" });
  const [paginas, setPaginas] = useState<PaginaCaderno[] | null>(null);
  const [paginaAberta, setPaginaAberta] = useState<PaginaCaderno | null>(null);
  const [busca, setBusca] = useState("");
  const [resultadoBusca, setResultadoBusca] = useState<PaginaCaderno[] | null>(null);
  const [criando, setCriando] = useState(false);
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null);
  const [pastasPaginas, setPastasPaginas] = useState<{ pasta: string; total: number }[]>([]);
  const [pastasPdfs, setPastasPdfs] = useState<{ pasta: string; total: number }[]>([]);

  function carregarLista() {
    setPaginas(null);
    listarPaginas(pastaAtiva).then(setPaginas);
  }

  useEffect(() => {
    if (tela.nome === "lista" && abaTopo === "paginas") carregarLista();
  }, [tela.nome, abaTopo, pastaAtiva]);

  useEffect(() => {
    listarPastasCaderno().then(setPastasPaginas);
    listarPastasPdfs().then(setPastasPdfs);
  }, [tela.nome, abaTopo]);

  useEffect(() => {
    if (tela.nome === "editor") {
      obterPagina(tela.id).then(setPaginaAberta);
    } else {
      setPaginaAberta(null);
    }
  }, [tela]);

  useEffect(() => {
    const t = busca.trim();
    if (!t || abaTopo !== "paginas") {
      setResultadoBusca(null);
      return;
    }
    const timer = setTimeout(() => {
      buscarPaginasCaderno(t).then((r) =>
        setResultadoBusca(pastaAtiva ? r.filter((p) => p.pasta === pastaAtiva) : r),
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [busca, abaTopo, pastaAtiva]);

  // Trocar de pílula (Páginas/PDFs) reseta a pasta ativa — pastas de um lado
  // não fazem sentido pro outro (são conjuntos de dados diferentes).
  function trocarAbaTopo(a: AbaTopo) {
    setAbaTopo(a);
    setPastaAtiva(null);
  }

  async function novaPagina(tituloInicial = "Nova página") {
    setCriando(true);
    try {
      const id = await criarPagina({ titulo: tituloInicial, pasta: pastaAtiva });
      setTela({ nome: "editor", id });
    } finally {
      setCriando(false);
    }
  }

  /** [[Título]]: abre a página existente com esse título, ou cria uma. */
  async function abrirOuCriarPorTitulo(titulo: string) {
    const t = titulo.trim();
    if (!t) return;
    const existente = (paginas ?? (await listarPaginas())).find(
      (p) => p.titulo.trim().toLowerCase() === t.toLowerCase(),
    );
    if (existente) {
      setTela({ nome: "editor", id: existente.id });
    } else {
      await novaPagina(t);
    }
  }

  async function apagar(id: number) {
    await apagarPagina(id);
    carregarLista();
  }

  async function alternarFixada(p: PaginaCaderno) {
    await alternarFixadaPagina(p.id, !p.fixada);
    carregarLista();
  }

  function criarPastaNova() {
    const nome = window.prompt("Nome da nova pasta:");
    const t = nome?.trim();
    if (t) setPastaAtiva(t);
  }

  if (tela.nome === "editor") {
    if (!paginaAberta) return <Vazio>Carregando…</Vazio>;
    return (
      <div>
        <button
          onClick={() => setTela({ nome: "lista" })}
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
        <EditorCaderno key={paginaAberta.id} pagina={paginaAberta} onAbrirLink={abrirOuCriarPorTitulo} />
      </div>
    );
  }

  const listaExibida = resultadoBusca ?? paginas;
  const pastas = abaTopo === "paginas" ? pastasPaginas : pastasPdfs;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Segmented
          valor={abaTopo}
          opcoes={[
            { id: "paginas" as const, label: "Páginas" },
            { id: "pdfs" as const, label: "PDFs" },
          ]}
          onChange={trocarAbaTopo}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={abaTopo === "paginas" ? "Buscar páginas…" : "Buscar PDFs…"}
          style={{ ...campo, flex: 1 }}
        />
      </div>

      {pastas.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={() => setPastaAtiva(null)} style={chipPasta(pastaAtiva === null)}>
            Todas
          </button>
          {pastas.map((p) => (
            <button key={p.pasta} onClick={() => setPastaAtiva(p.pasta)} style={chipPasta(pastaAtiva === p.pasta)}>
              {p.pasta} · {p.total}
            </button>
          ))}
        </div>
      )}

      {abaTopo === "paginas" ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Botao tipo="tinta" onClick={() => novaPagina()} disabled={criando}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <PlusIcon width={16} height={16} />
                Nova página
              </span>
            </Botao>
            <Botao tipo="fantasma" onClick={criarPastaNova}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <FolderPlusIcon width={16} height={16} />
                Pasta
              </span>
            </Botao>
          </div>

          {listaExibida === null ? (
            <Vazio>Carregando…</Vazio>
          ) : listaExibida.length === 0 ? (
            <Vazio>
              {resultadoBusca ? `Nada encontrado para "${busca.trim()}".` : "Nenhuma página ainda. Crie uma para começar a escrever."}
            </Vazio>
          ) : (
            listaExibida.map((p) => (
              <div
                key={p.id}
                style={{
                  ...cartao,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
                onClick={() => setTela({ nome: "editor", id: p.id })}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.titulo || "Sem título"}
                  </div>
                  {p.pasta && (
                    <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 2 }}>{p.pasta.toUpperCase()}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarFixada(p);
                    }}
                    aria-label={p.fixada ? "Desafixar" : "Fixar"}
                    style={botaoIcone}
                  >
                    {p.fixada ? (
                      <StarIconSolid width={15} color={C.caneta} />
                    ) : (
                      <StarIcon width={15} stroke={C.sub} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      apagar(p.id);
                    }}
                    aria-label="Apagar página"
                    style={botaoIcone}
                  >
                    <TrashIcon width={15} stroke={C.sub} />
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Botao tipo="fantasma" onClick={criarPastaNova}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <FolderPlusIcon width={16} height={16} />
                Pasta
              </span>
            </Botao>
          </div>
          <Suspense fallback={<Vazio>Carregando…</Vazio>}>
            <LeitorPdf
              onVoltar={() => setAbaTopo("paginas")}
              embutido
              pasta={pastaAtiva}
              busca={busca}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

const botaoIcone: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1.5px solid ${C.line}`,
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function chipPasta(ativa: boolean): React.CSSProperties {
  return {
    ...mono,
    fontSize: 11.5,
    padding: "5px 10px",
    borderRadius: 999,
    border: `1.5px solid ${ativa ? C.caneta : C.line}`,
    background: ativa ? C.canetaSoft : C.card,
    color: ativa ? C.caneta : C.sub,
    cursor: "pointer",
  };
}

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { C, cartao, disp, mono } from "../theme";
import Shell, { Vazio } from "../components/Shell";
import Segmented from "../components/Segmented";
import Botao from "../components/Botao";
import NotaCard from "../components/NotaCard";
import {
  apagarConceito,
  contarNotasPendentesPorMateria,
  listarConceitos,
  listarNotasPorTag,
  listarPastas,
  listarTagsComContagem,
} from "../lib/repo";
import { exportarArquivo, exportarArquivoBinario } from "../lib/exportar";
import { gerarArquivosFlashcards } from "../lib/flashcards";
import RevisaoNotas from "./notas/RevisaoNotas";
import MapasView from "./notas/mapas/MapasView";
import CadernoView from "./notas/caderno/CadernoView";
import TarefasView from "./notas/TarefasView";
import { slugify } from "../lib/texto";
import type { ConceitoSalvo } from "../lib/types";
import { getModoNotas, setModoNotas, type ModoNotas } from "../lib/notasModo";

/** Opções do Segmented de topo da aba — PDFs fica dentro do Caderno, não
 * como segmento próprio, para não apertar o Segmented no celular. */
const OPCOES_MODO: { id: ModoNotas; label: string }[] = [
  { id: "conceitos", label: "Conceitos" },
  { id: "caderno", label: "Caderno" },
  { id: "mapas", label: "Mapas" },
  { id: "tarefas", label: "Tarefas" },
];

/** Banco de notas: pastas por matéria → lista, cada nota por inteiro (ver
 * NotaCard) — não há mais uma tela de detalhe separada: visualizar, editar,
 * ver a questão de origem e apagar acontecem tudo dentro do próprio cartão
 * da nota, na lista. */
export default function NotasTab({
  ativa,
  onQuestoes,
}: {
  ativa: boolean;
  onQuestoes: () => void;
}) {
  const [pastas, setPastas] = useState<{ materia: string; total: number }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pasta, setPasta] = useState<string | null>(null);

  // Modo de visão da aba inteira: Conceitos é o que a aba sempre fez (pastas
  // por matéria / nuvem de tags, abaixo); Caderno, Mapas e Tarefas são as
  // áreas novas (ver notas/caderno/CadernoView.tsx, notas/mapas/MapasView.tsx,
  // notas/TarefasView.tsx). Persistido para não voltar a Conceitos a cada
  // troca de aba (ver lib/notasModo.ts).
  const [modo, setModo] = useState<ModoNotas>("conceitos");
  useEffect(() => {
    getModoNotas().then(setModo);
  }, []);
  function trocarModo(m: ModoNotas) {
    setModo(m);
    void setModoNotas(m);
  }

  // Nuvem de tags: outra forma de navegar as notas, cruzando matérias (a
  // mesma tag pode aparecer em notas de matérias diferentes) — alternativa à
  // navegação por pasta, só na tela de topo (pasta === null, busca inativa).
  const [modoTop, setModoTop] = useState<"pastas" | "tags">("pastas");
  const [tags, setTags] = useState<{ tag: string; total: number }[]>([]);
  const [carregandoTags, setCarregandoTags] = useState(false);
  const [tagAberta, setTagAberta] = useState<string | null>(null);
  const [itensTag, setItensTag] = useState<ConceitoSalvo[] | null>(null);
  // Revisão ativa por repetição espaçada das notas salvas (ver
  // registrarRevisaoNota em repo.ts) — `null` = fora do modo revisão;
  // `{ materia: null }` = revisão cruzando todas as matérias.
  const [revisando, setRevisando] = useState<{ materia: string | null } | null>(null);
  const [pendentesPorMateria, setPendentesPorMateria] = useState<
    { materia: string; total: number; pendentes: number }[]
  >([]);
  const [itens, setItens] = useState<ConceitoSalvo[]>([]);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);
  const [csvExportado, setCsvExportado] = useState(false);
  const [exportandoApkg, setExportandoApkg] = useState(false);
  const [apkgExportado, setApkgExportado] = useState(false);

  // Seleção múltipla dentro de uma pasta, para apagar/exportar um subconjunto
  // sem precisar ir nota por nota.
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [confirmandoApagarSelecionadas, setConfirmandoApagarSelecionadas] = useState(false);
  const [apagandoSelecionadas, setApagandoSelecionadas] = useState(false);

  const carregarPastas = useCallback(() => {
    setCarregando(true);
    Promise.all([listarPastas(), contarNotasPendentesPorMateria()])
      .then(([p, pend]) => {
        setPastas(p);
        setPendentesPorMateria(pend);
      })
      .catch(() => {
        setPastas([]);
        setPendentesPorMateria([]);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Dispara na montagem inicial e toda vez que o usuário reabre esta aba —
  // como as abas agora ficam montadas (ver App.tsx), sem isto uma nota salva
  // em Questões não apareceria aqui até um refresh manual.
  useEffect(() => {
    if (ativa) carregarPastas();
  }, [ativa, carregarPastas]);

  const carregarItens = useCallback(() => {
    if (!pasta) return;
    listarConceitos(pasta, "data").then(setItens).catch(() => setItens([]));
  }, [pasta]);

  useEffect(carregarItens, [carregarItens]);

  // Nuvem de tags: carrega só quando o modo está ativo (evita uma consulta
  // extra em toda visita à aba para quem nunca usa essa vista).
  useEffect(() => {
    if (!ativa || pasta || modoTop !== "tags") return;
    setCarregandoTags(true);
    listarTagsComContagem()
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setCarregandoTags(false));
  }, [ativa, pasta, modoTop]);

  function abrirTag(tag: string) {
    setTagAberta(tag);
    setItensTag(null);
    listarNotasPorTag(tag)
      .then(setItensTag)
      .catch(() => setItensTag([]));
  }

  // Sai do modo de seleção sempre que a pasta muda — uma seleção antiga não
  // deve sobreviver a isso.
  useEffect(() => {
    setSelecionando(false);
    setSelecionados(new Set());
    setConfirmandoApagarSelecionadas(false);
  }, [pasta]);

  /**
   * Exporta só o CORPO de cada nota (não o título — ver lib/flashcards.ts): é
   * classificado em Cloze (marca-texto ou lista enumerada) ou Básico
   * (frente/verso por "=", ou fallback frente-só) e sai em até dois arquivos
   * CSV, um por tipo de nota do Anki — misturar os dois formatos num único
   * CSV exigiria de qualquer forma duas importações manuais no Anki.
   */
  async function exportarCSV(itensParaExportar: ConceitoSalvo[], nomeBase: string) {
    if (!itensParaExportar.length || exportando) return;
    setExportando(true);
    setErroExport(null);
    setCsvExportado(false);
    try {
      const { cloze, basico } = gerarArquivosFlashcards(itensParaExportar);
      const slug = slugify(nomeBase);
      if (basico) await exportarArquivo(`flashcards-basico-${slug}.csv`, basico);
      if (cloze) await exportarArquivo(`flashcards-cloze-${slug}.csv`, cloze);
      setCsvExportado(true);
      setTimeout(() => setCsvExportado(false), 2500);
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  /**
   * Exporta um único .apkg — o formato de import nativo do Anki (ver
   * lib/apkg.ts) — em vez de dois CSVs: cloze e básico misturados no mesmo
   * arquivo, cada nota já com o notetype certo, uma importação só.
   */
  async function exportarApkg(itensParaExportar: ConceitoSalvo[], nomeBase: string) {
    if (!itensParaExportar.length || exportandoApkg) return;
    setExportandoApkg(true);
    setErroExport(null);
    setApkgExportado(false);
    try {
      const { gerarApkg } = await import("../lib/apkg");
      const bytes = await gerarApkg(itensParaExportar, nomeBase);
      const slug = slugify(nomeBase);
      await exportarArquivoBinario(`kuestions-${slug}.apkg`, bytes, "application/octet-stream");
      setApkgExportado(true);
      setTimeout(() => setApkgExportado(false), 2500);
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar .apkg.");
    } finally {
      setExportandoApkg(false);
    }
  }

  function alternarSelecao(id: number) {
    setSelecionados((s) => {
      const novo = new Set(s);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function apagarSelecionadas() {
    setApagandoSelecionadas(true);
    try {
      for (const id of selecionados) {
        try {
          await apagarConceito(id);
        } catch (e) {
          console.error("apagar nota selecionada", e);
        }
      }
      setConfirmandoApagarSelecionadas(false);
      setSelecionando(false);
      setSelecionados(new Set());
      carregarItens();
      carregarPastas();
    } finally {
      setApagandoSelecionadas(false);
    }
  }

  if (modo === "caderno" || modo === "mapas" || modo === "tarefas") {
    return (
      <Shell titulo="Notas">
        <div style={{ marginBottom: 14 }}>
          <Segmented valor={modo} opcoes={OPCOES_MODO} onChange={trocarModo} />
        </div>
        {modo === "caderno" ? <CadernoView /> : modo === "mapas" ? <MapasView /> : <TarefasView />}
      </Shell>
    );
  }

  /* ---------- Revisão ativa (repetição espaçada) ---------- */
  if (revisando) {
    return (
      <Shell titulo="Revisão">
        <RevisaoNotas
          materia={revisando.materia}
          onSair={() => {
            setRevisando(null);
            carregarPastas();
          }}
        />
      </Shell>
    );
  }

  /* ---------- Notas de uma tag (nuvem de tags) ---------- */
  if (tagAberta) {
    return (
      <Shell titulo={tagAberta}>
        <button
          onClick={() => {
            setTagAberta(null);
            setItensTag(null);
          }}
          style={{
            ...mono,
            display: "block",
            marginBottom: 14,
            fontSize: 12,
            background: "none",
            border: "none",
            color: C.sub,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          ← Nuvem de tags
        </button>

        {itensTag === null ? (
          <Vazio>Carregando…</Vazio>
        ) : itensTag.length === 0 ? (
          <Vazio>Nenhuma nota com esta tag.</Vazio>
        ) : (
          itensTag.map((c) => (
            <NotaCard
              key={c.id}
              conceito={c}
              mostrarMateria
              selecionando={false}
              marcada={false}
              onToggleSelecao={() => {}}
              onAtualizado={(atualizado) => {
                setItensTag((is) => (is ? is.map((i) => (i.id === atualizado.id ? atualizado : i)) : is));
              }}
              onApagado={() => {
                setItensTag((is) => (is ? is.filter((i) => i.id !== c.id) : is));
              }}
            />
          ))
        )}
      </Shell>
    );
  }

  /* ---------- Lista de uma pasta ---------- */
  if (pasta) {
    const todasSelecionadas = itens.length > 0 && selecionados.size === itens.length;
    const pendentesPasta = pendentesPorMateria.find((p) => p.materia === pasta)?.pendentes ?? 0;
    return (
      <Shell
        titulo={
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BotaoIcone
              onClick={() => setPasta(null)}
              aria-label="Voltar para todas as pastas"
              title="Todas as pastas"
            >
              <ArrowLeftIcon width={18} height={18} stroke={C.ink} strokeWidth={1.8} />
            </BotaoIcone>
            {pasta}
          </span>
        }
      >
        {itens.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {selecionando ? (
              <div
                style={{
                  ...cartao,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() =>
                    setSelecionados(todasSelecionadas ? new Set() : new Set(itens.map((i) => i.id)))
                  }
                  style={{
                    ...mono,
                    fontSize: 11.5,
                    background: "none",
                    border: "none",
                    color: C.caneta,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {todasSelecionadas ? "Desmarcar todas" : "Selecionar todas"}
                </button>
                <span style={{ ...mono, fontSize: 11.5, color: C.sub }}>
                  {selecionados.size} selecionada{selecionados.size === 1 ? "" : "s"}
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => {
                      setSelecionando(false);
                      setSelecionados(new Set());
                    }}
                    style={{
                      ...mono,
                      fontSize: 11.5,
                      background: "none",
                      border: "none",
                      color: C.sub,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                {pendentesPasta > 0 && (
                  <BotaoIcone
                    onClick={() => setRevisando({ materia: pasta })}
                    aria-label={`Revisar pendentes desta pasta · ${pendentesPasta}`}
                    title={`Revisar pendentes desta pasta · ${pendentesPasta}`}
                    tom="tinta"
                    contador={pendentesPasta}
                  >
                    <ArrowPathIcon width={17} height={17} stroke="#fff" strokeWidth={1.8} />
                  </BotaoIcone>
                )}
                <BotaoIcone
                  onClick={() => setSelecionando(true)}
                  aria-label="Selecionar notas"
                  title="Selecionar"
                >
                  <CheckCircleIcon width={18} height={18} stroke={C.ink} strokeWidth={1.8} />
                </BotaoIcone>
                <Botao
                  tipo="fantasma"
                  onClick={() => exportarCSV(itens, pasta)}
                  disabled={exportando}
                  style={csvExportado ? { borderColor: C.ok, color: C.ok, flex: 1 } : { flex: 1 }}
                >
                  {exportando ? "Exportando…" : csvExportado ? "✓ Exportado" : `CSV · ${itens.length}`}
                </Botao>
                <Botao
                  tipo="fantasma"
                  onClick={() => exportarApkg(itens, pasta)}
                  disabled={exportandoApkg}
                  style={apkgExportado ? { borderColor: C.ok, color: C.ok, flex: 1 } : { flex: 1 }}
                >
                  {exportandoApkg ? "Exportando…" : apkgExportado ? "✓ Exportado" : `.apkg · ${itens.length}`}
                </Botao>
              </div>
            )}
            {erroExport && (
              <div style={{ ...mono, fontSize: 11.5, color: C.erro, marginTop: 6 }}>
                {erroExport}
              </div>
            )}
          </div>
        )}

        {selecionando && selecionados.size > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Botao
              tipo="fantasma"
              onClick={() => exportarCSV(itens.filter((i) => selecionados.has(i.id)), pasta)}
              disabled={exportando}
              style={{ flex: 1 }}
            >
              Exportar seleção ({selecionados.size})
            </Botao>
            <Botao
              onClick={() => setConfirmandoApagarSelecionadas(true)}
              style={{ flex: 1, background: C.erro, borderColor: C.erro }}
            >
              Apagar seleção
            </Botao>
          </div>
        )}

        {confirmandoApagarSelecionadas && (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Apagar {selecionados.size} nota{selecionados.size === 1 ? "" : "s"} selecionada
              {selecionados.size === 1 ? "" : "s"}? Não há como desfazer.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmandoApagarSelecionadas(false)}
                disabled={apagandoSelecionadas}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={apagarSelecionadas}
                disabled={apagandoSelecionadas}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                {apagandoSelecionadas ? "Apagando…" : "Apagar"}
              </Botao>
            </div>
          </div>
        )}

        {itens.length === 0 ? (
          <Vazio>Esta pasta está vazia.</Vazio>
        ) : (
          itens.map((c) => (
            <NotaCard
              key={c.id}
              conceito={c}
              selecionando={selecionando}
              marcada={selecionados.has(c.id)}
              onToggleSelecao={() => alternarSelecao(c.id)}
              onAtualizado={(atualizado) => {
                setItens((is) => is.map((i) => (i.id === atualizado.id ? atualizado : i)));
              }}
              onApagado={() => {
                carregarItens();
                carregarPastas();
              }}
            />
          ))
        )}
      </Shell>
    );
  }

  /* ---------- Pastas ---------- */
  const totalPendentes = pendentesPorMateria.reduce((a, p) => a + p.pendentes, 0);

  return (
    <Shell titulo="Notas">
      <div style={{ marginBottom: 14 }}>
        <Segmented valor={modo} opcoes={OPCOES_MODO} onChange={trocarModo} />
      </div>

      {totalPendentes > 0 && (
        <Botao
          tipo="tinta"
          onClick={() => setRevisando({ materia: null })}
          style={{ marginBottom: 14 }}
        >
          Revisar notas pendentes · {totalPendentes}
        </Botao>
      )}

      {carregando ? (
        <Vazio>Carregando…</Vazio>
      ) : pastas.length === 0 ? (
        <Vazio>
          <p style={{ margin: "0 0 14px" }}>
            Nenhuma nota salva ainda.
            <br />
            Ao responder uma questão, selecione um trecho de texto para salvá-lo aqui.
          </p>
          <Botao tipo="tinta" onClick={onQuestoes} style={{ maxWidth: 220, margin: "0 auto" }}>
            Ir para Blocos
          </Botao>
        </Vazio>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <Segmented
              valor={modoTop}
              opcoes={[
                { id: "pastas" as const, label: "Pastas" },
                { id: "tags" as const, label: "Nuvem de tags" },
              ]}
              onChange={setModoTop}
            />
          </div>

          {modoTop === "pastas" ? (
            pastas.map((p) => (
              <button
                key={p.materia}
                onClick={() => setPasta(p.materia)}
                style={{
                  ...cartao,
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  padding: "14px",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FolderIcon width={20} height={20} stroke={C.caneta} strokeWidth={1.8} />
                  <span style={{ ...disp, fontSize: 15, fontWeight: 600 }}>{p.materia}</span>
                </span>
                <span style={{ ...mono, fontSize: 12, color: C.sub }}>{p.total}</span>
              </button>
            ))
          ) : carregandoTags ? (
            <Vazio>Carregando…</Vazio>
          ) : tags.length === 0 ? (
            <Vazio>Nenhuma tag ainda.</Vazio>
          ) : (
            <NuvemDeTags tags={tags} onAbrir={abrirTag} />
          )}
        </>
      )}
    </Shell>
  );
}

/** Botão quadrado só com ícone — cabeçalho da pasta (voltar) e ações rápidas
 * (revisar pendentes, selecionar) ao lado dos botões de exportação, todos na
 * mesma linha. `contador`, quando informado, desenha um selo numérico no
 * canto — só usado em "revisar pendentes", para não perder a contagem que a
 * versão em texto mostrava. */
function BotaoIcone({
  children,
  onClick,
  tom = "fantasma",
  contador,
  ...resto
}: {
  children: ReactNode;
  onClick: () => void;
  tom?: "fantasma" | "tinta";
  contador?: number;
  "aria-label": string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: 8,
        border: `1.5px solid ${tom === "tinta" ? C.caneta : C.line}`,
        background: tom === "tinta" ? C.caneta : C.card,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      {...resto}
    >
      {children}
      {!!contador && (
        <span
          style={{
            ...mono,
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 16,
            height: 16,
            padding: "0 3px",
            borderRadius: 8,
            background: C.erro,
            color: "#fff",
            fontSize: 9.5,
            fontWeight: 700,
            lineHeight: "16px",
            textAlign: "center",
          }}
        >
          {contador}
        </span>
      )}
    </button>
  );
}

/** Nuvem de tags: outra forma de navegar as notas, cruzando matérias — o
 * tamanho de cada tag é proporcional a quantas notas a usam (min 12px, max
 * 26px). Tocar abre a lista de notas com aquela tag (ver abrirTag). */
function NuvemDeTags({
  tags,
  onAbrir,
}: {
  tags: { tag: string; total: number }[];
  onAbrir: (tag: string) => void;
}) {
  const totais = tags.map((t) => t.total);
  const max = Math.max(...totais);
  const min = Math.min(...totais);

  function tamanho(total: number): number {
    if (max === min) return 15;
    return Math.round(12 + ((total - min) / (max - min)) * 14);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {tags.map((t) => (
        <button
          key={t.tag}
          onClick={() => onAbrir(t.tag)}
          title={`${t.total} nota${t.total === 1 ? "" : "s"}`}
          style={{
            ...mono,
            fontSize: tamanho(t.total),
            fontWeight: t.total >= (min + max) / 2 ? 700 : 400,
            padding: "5px 10px",
            borderRadius: 8,
            border: `1.5px solid ${C.line}`,
            background: C.card,
            color: C.caneta,
            cursor: "pointer",
          }}
        >
          {t.tag}
        </button>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { FolderIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Shell, { Vazio } from "../components/Shell";
import Segmented from "../components/Segmented";
import Botao from "../components/Botao";
import Chip from "../components/Chip";
import {
  apagarConceito,
  atualizarNota,
  listarConceitos,
  listarPastas,
} from "../lib/repo";
import { exportarArquivo, paraCSV } from "../lib/exportar";
import { contarItensLista, slugify } from "../lib/texto";
import type { ConceitoSalvo } from "../lib/types";

type Ordem = "data" | "alfabetica";

function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** Banco de notas: pastas por matéria → lista → detalhe editável. */
export default function NotasTab({ ativa }: { ativa: boolean }) {
  const [pastas, setPastas] = useState<{ materia: string; total: number }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pasta, setPasta] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("data");
  const [itens, setItens] = useState<ConceitoSalvo[]>([]);
  const [aberto, setAberto] = useState<ConceitoSalvo | null>(null);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);

  const carregarPastas = useCallback(() => {
    setCarregando(true);
    listarPastas()
      .then(setPastas)
      .catch(() => setPastas([]))
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
    listarConceitos(pasta, ordem).then(setItens).catch(() => setItens([]));
  }, [pasta, ordem]);

  useEffect(carregarItens, [carregarItens]);

  async function exportarCSV() {
    if (!pasta || !itens.length || exportando) return;
    setExportando(true);
    setErroExport(null);
    try {
      const linhas = itens.map((n) => {
        const nItens = contarItensLista(n.corpo);
        const titulo = nItens > 0 ? `${n.titulo} (${nItens})` : n.titulo;
        return [titulo, n.corpo, n.tag];
      });
      await exportarArquivo(`flashcards-${slugify(pasta)}.csv`, paraCSV(linhas));
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  /* ---------- Detalhe ---------- */
  if (aberto) {
    return (
      <Shell kicker="NOTAS" titulo={aberto.titulo}>
        <Detalhe
          conceito={aberto}
          onVoltar={() => setAberto(null)}
          onSalvo={(c) => {
            setAberto(c);
            carregarItens();
          }}
          onApagado={() => {
            setAberto(null);
            carregarItens();
            carregarPastas();
          }}
        />
      </Shell>
    );
  }

  /* ---------- Lista de uma pasta ---------- */
  if (pasta) {
    return (
      <Shell kicker={`NOTAS · ${itens.length} NOTA${itens.length === 1 ? "" : "S"}`} titulo={pasta}>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Ordenar</label>
          <Segmented
            valor={ordem}
            opcoes={[
              { id: "data" as Ordem, label: "Mais recentes" },
              { id: "alfabetica" as Ordem, label: "A–Z" },
            ]}
            onChange={setOrdem}
          />
        </div>

        {itens.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Botao tipo="fantasma" onClick={exportarCSV} disabled={exportando}>
              {exportando ? "Exportando…" : `Exportar flashcards (CSV) · ${itens.length}`}
            </Botao>
            {erroExport && (
              <div style={{ ...mono, fontSize: 11.5, color: C.erro, marginTop: 6 }}>
                {erroExport}
              </div>
            )}
          </div>
        )}

        {itens.length === 0 ? (
          <Vazio>Esta pasta está vazia.</Vazio>
        ) : (
          itens.map((c) => (
            <button
              key={c.id}
              onClick={() => setAberto(c)}
              style={{
                ...cartao,
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "baseline",
                }}
              >
                <span style={{ ...disp, fontSize: 15, fontWeight: 600 }}>{c.titulo}</span>
                <span style={{ ...mono, fontSize: 10.5, color: C.sub, flexShrink: 0 }}>
                  {dataCurta(c.ts)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: C.sub,
                  marginTop: 4,
                  lineHeight: 1.45,
                  // Trecho do corpo: 2 linhas, o resto no detalhe.
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {c.corpo || "Sem conteúdo."}
              </div>
              {c.tag && (
                <div style={{ marginTop: 6 }}>
                  <Chip>{c.tag}</Chip>
                </div>
              )}
            </button>
          ))
        )}

        <button
          onClick={() => setPasta(null)}
          style={{
            ...mono,
            marginTop: 18,
            fontSize: 12,
            background: "none",
            border: "none",
            color: C.sub,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ← Todas as pastas
        </button>
      </Shell>
    );
  }

  /* ---------- Pastas ---------- */
  return (
    <Shell kicker="BANCO DE NOTAS" titulo="Notas">
      {carregando ? (
        <Vazio>Carregando…</Vazio>
      ) : pastas.length === 0 ? (
        <Vazio>
          Nenhuma nota salva ainda.
          <br />
          Ao responder uma questão, selecione um trecho de texto para salvá-lo aqui.
        </Vazio>
      ) : (
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
      )}
    </Shell>
  );
}

/* ---------- Detalhe / edição ---------- */

function Detalhe({
  conceito,
  onVoltar,
  onSalvo,
  onApagado,
}: {
  conceito: ConceitoSalvo;
  onVoltar: () => void;
  onSalvo: (c: ConceitoSalvo) => void;
  onApagado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(conceito.titulo);
  const [corpo, setCorpo] = useState(conceito.corpo);
  const [tag, setTag] = useState(conceito.tag);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const t = titulo.trim();
    if (!t) {
      setErro("O título não pode ficar vazio.");
      return;
    }
    setErro(null);
    try {
      const tagFinal = tag.trim() || "geral";
      await atualizarNota(conceito.id, t, corpo.trim(), tagFinal);
      onSalvo({ ...conceito, titulo: t, corpo: corpo.trim(), tag: tagFinal });
      setEditando(false);
    } catch {
      setErro("Falha ao salvar.");
    }
  }

  if (editando) {
    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Título</label>
          <input style={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Corpo</label>
          <textarea
            style={{ ...campo, minHeight: 160, resize: "vertical", lineHeight: 1.5 }}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Tag</label>
          <input style={{ ...campo, ...mono, fontSize: 13 }} value={tag} onChange={(e) => setTag(e.target.value)} />
        </div>
        {erro && (
          <div style={{ ...mono, fontSize: 12, color: C.erro, marginBottom: 10 }}>{erro}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Botao tipo="tinta" onClick={salvar}>
            Salvar alterações
          </Botao>
          <Botao
            tipo="fantasma"
            onClick={() => {
              setTitulo(conceito.titulo);
              setCorpo(conceito.corpo);
              setTag(conceito.tag);
              setErro(null);
              setEditando(false);
            }}
          >
            Cancelar
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...cartao, marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
          {conceito.materia.toUpperCase()} · {dataCurta(conceito.ts)}
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
          {conceito.corpo || "Sem conteúdo. Toque em Editar para escrever."}
        </p>
        {conceito.tag && <Chip>{conceito.tag}</Chip>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Botao tipo="fantasma" onClick={() => setEditando(true)}>
          Editar
        </Botao>

        {confirmando ? (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Apagar “{conceito.titulo}” desta pasta? Não há como desfazer.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmando(false)}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={async () => {
                  try {
                    await apagarConceito(conceito.id);
                    onApagado();
                  } catch {
                    setErro("Falha ao apagar.");
                    setConfirmando(false);
                  }
                }}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                Apagar
              </Botao>
            </div>
          </div>
        ) : (
          <Botao tipo="fantasma" onClick={() => setConfirmando(true)} style={{ color: C.erro }}>
            Apagar nota
          </Botao>
        )}

        {erro && <div style={{ ...mono, fontSize: 12, color: C.erro }}>{erro}</div>}
      </div>

      <button
        onClick={onVoltar}
        style={{
          ...mono,
          marginTop: 18,
          fontSize: 12,
          background: "none",
          border: "none",
          color: C.sub,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        ← Voltar à lista
      </button>
    </div>
  );
}

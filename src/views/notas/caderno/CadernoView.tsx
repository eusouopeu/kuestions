import { useEffect, useState } from "react";
import { ArrowLeftIcon, PlusIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { C, campo, cartao, mono } from "../../../theme";
import Botao from "../../../components/Botao";
import { Vazio } from "../../../components/Shell";
import {
  alternarFixadaPagina,
  apagarPagina,
  buscarPaginasCaderno,
  criarPagina,
  listarPaginas,
  obterPagina,
} from "../../../lib/repo";
import type { PaginaCaderno } from "../../../lib/caderno/tipos";
import EditorCaderno from "./EditorCaderno";

type Tela = { nome: "lista" } | { nome: "editor"; id: number };

/**
 * Roteador do Caderno dentro da aba Notas: lista de páginas (fixadas +
 * busca) → editor de blocos (EditorCaderno). Mesma estrutura de MapasView —
 * cada página é uma linha em `caderno_paginas` (ver repo/caderno.ts), não um
 * arquivo, então entra em busca global e backup como qualquer outro dado.
 */
export default function CadernoView() {
  const [tela, setTela] = useState<Tela>({ nome: "lista" });
  const [paginas, setPaginas] = useState<PaginaCaderno[] | null>(null);
  const [paginaAberta, setPaginaAberta] = useState<PaginaCaderno | null>(null);
  const [busca, setBusca] = useState("");
  const [resultadoBusca, setResultadoBusca] = useState<PaginaCaderno[] | null>(null);
  const [criando, setCriando] = useState(false);

  function carregarLista() {
    setPaginas(null);
    listarPaginas().then(setPaginas);
  }

  useEffect(() => {
    if (tela.nome === "lista") carregarLista();
  }, [tela.nome]);

  useEffect(() => {
    if (tela.nome === "editor") {
      obterPagina(tela.id).then(setPaginaAberta);
    } else {
      setPaginaAberta(null);
    }
  }, [tela]);

  useEffect(() => {
    const t = busca.trim();
    if (!t) {
      setResultadoBusca(null);
      return;
    }
    const timer = setTimeout(() => {
      buscarPaginasCaderno(t).then(setResultadoBusca);
    }, 250);
    return () => clearTimeout(timer);
  }, [busca]);

  async function novaPagina(tituloInicial = "Nova página") {
    setCriando(true);
    try {
      const id = await criarPagina({ titulo: tituloInicial, pasta: null });
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

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no caderno…"
          style={{ ...campo, flex: 1 }}
        />
      </div>

      <Botao tipo="tinta" onClick={() => novaPagina()} disabled={criando} style={{ marginBottom: 16 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <PlusIcon width={16} height={16} />
          Nova página
        </span>
      </Botao>

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

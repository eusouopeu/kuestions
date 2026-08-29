import { useEffect, useState } from "react";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { C, cartao, mono } from "../../../theme";
import Botao from "../../../components/Botao";
import { Vazio } from "../../../components/Shell";
import { apagarMapa, criarMapa, listarMapas, obterMapa } from "../../../lib/repo";
import type { Mapa } from "../../../lib/mapas/tipos";
import MapaMental from "./MapaMental";
import EstudoMapa from "./EstudoMapa";

type Tela = { nome: "lista" } | { nome: "editor"; id: number } | { nome: "estudo"; id: number; soIds: number[] | null };

/**
 * Roteador de Mapas dentro da aba Notas (ver NotasTab.tsx): lista de mapas
 * salvos → editor (MapaMental) → estudo (EstudoMapa). Cada mapa é uma linha
 * própria na tabela `mapas` (ver repo/mapas.ts), não um arquivo — por isso
 * não há import/export de arquivo aqui: mapas entram no backup e na busca
 * global como qualquer outro dado do app.
 */
export default function MapasView() {
  const [tela, setTela] = useState<Tela>({ nome: "lista" });
  const [mapas, setMapas] = useState<Mapa[] | null>(null);
  const [mapaAberto, setMapaAberto] = useState<Mapa | null>(null);
  const [criando, setCriando] = useState(false);

  function carregarLista() {
    setMapas(null);
    listarMapas().then(setMapas);
  }

  useEffect(() => {
    if (tela.nome === "lista") carregarLista();
  }, [tela.nome]);

  useEffect(() => {
    if (tela.nome === "editor" || tela.nome === "estudo") {
      obterMapa(tela.id).then(setMapaAberto);
    } else {
      setMapaAberto(null);
    }
  }, [tela]);

  async function novoMapa() {
    setCriando(true);
    try {
      const id = await criarMapa({
        nome: "Novo mapa",
        materia: null,
        nos: [{ id: 1, texto: "Tópico central", x: 400, y: 20, pai: null, cor: "caneta", tamanho: "grande" }],
      });
      setTela({ nome: "editor", id });
    } finally {
      setCriando(false);
    }
  }

  async function apagar(id: number) {
    await apagarMapa(id);
    carregarLista();
  }

  if (tela.nome === "editor" || tela.nome === "estudo") {
    if (!mapaAberto) return <Vazio>Carregando…</Vazio>;
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
            marginBottom: 10,
          }}
        >
          <ArrowLeftIcon width={14} height={14} />
          {mapaAberto.nome}
        </button>

        {tela.nome === "editor" ? (
          <MapaMental
            key={mapaAberto.id}
            mapaId={mapaAberto.id}
            nosIniciais={mapaAberto.nos}
            onEstudar={(soIds) => setTela({ nome: "estudo", id: mapaAberto.id, soIds })}
          />
        ) : (
          <EstudoMapa
            mapaId={mapaAberto.id}
            nos={mapaAberto.nos}
            soIds={tela.soIds}
            onSair={() => setTela({ nome: "editor", id: mapaAberto.id })}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <Botao tipo="tinta" onClick={novoMapa} disabled={criando} style={{ marginBottom: 16 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <PlusIcon width={16} height={16} />
          Novo mapa
        </span>
      </Botao>

      {mapas === null ? (
        <Vazio>Carregando…</Vazio>
      ) : mapas.length === 0 ? (
        <Vazio>Nenhum mapa mental ainda. Crie um para organizar visualmente um assunto.</Vazio>
      ) : (
        mapas.map((m) => (
          <div
            key={m.id}
            style={{
              ...cartao,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
              cursor: "pointer",
            }}
            onClick={() => setTela({ nome: "editor", id: m.id })}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.nome}</div>
              <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                {m.nos.length} nó{m.nos.length === 1 ? "" : "s"}
                {m.materia ? ` · ${m.materia.toUpperCase()}` : ""}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                apagar(m.id);
              }}
              aria-label="Apagar mapa"
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1.5px solid ${C.line}`,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrashIcon width={15} height={15} stroke={C.sub} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

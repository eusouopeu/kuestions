import { useEffect, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, mono } from "../../theme";
import { Vazio } from "../../components/Shell";
import {
  alternarTarefa,
  apagarTarefa,
  criarTarefa,
  listarTarefas,
  type Tarefa,
} from "../../lib/repo";

/**
 * Lista de tarefas simples (ver repo/tarefas.ts), portada de
 * web_notebook/todo.html no SynapsePro. Item manual, marcado à mão — não
 * confundir com as metas semanais automáticas em views/BlocosTab.tsx (ver
 * lib/metas.ts): meta é um contador que o app já atualiza sozinho conforme
 * o uso; tarefa é algo que o usuário decidiu fazer e marca ele mesmo.
 */
export default function TarefasView() {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null);
  const [novaTarefa, setNovaTarefa] = useState("");
  const [criando, setCriando] = useState(false);

  function carregar() {
    listarTarefas().then(setTarefas);
  }

  useEffect(carregar, []);

  async function adicionar() {
    const texto = novaTarefa.trim();
    if (!texto) return;
    setCriando(true);
    try {
      await criarTarefa(texto);
      setNovaTarefa("");
      carregar();
    } finally {
      setCriando(false);
    }
  }

  async function alternar(t: Tarefa) {
    // Otimista: a lista de pendentes/feitas reordena na hora, sem esperar o
    // round-trip do SQLite — a mesma tabela é pequena e local, então o risco
    // de divergir é baixo, e esperar deixaria o toque parecendo sem resposta.
    setTarefas((atual) =>
      atual ? atual.map((x) => (x.id === t.id ? { ...x, feita: !x.feita } : x)) : atual,
    );
    await alternarTarefa(t.id, !t.feita);
    carregar();
  }

  async function apagar(id: number) {
    setTarefas((atual) => (atual ? atual.filter((x) => x.id !== id) : atual));
    await apagarTarefa(id);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={novaTarefa}
          onChange={(e) => setNovaTarefa(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") adicionar();
          }}
          placeholder="Nova tarefa…"
          style={{ ...campo, flex: 1 }}
        />
        <button
          onClick={adicionar}
          disabled={criando || !novaTarefa.trim()}
          aria-label="Adicionar tarefa"
          style={{
            flexShrink: 0,
            width: 44,
            borderRadius: 8,
            border: `1.5px solid ${C.caneta}`,
            background: C.caneta,
            color: "#fff",
            cursor: novaTarefa.trim() ? "pointer" : "default",
            opacity: novaTarefa.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlusIcon width={18} height={18} />
        </button>
      </div>

      {tarefas === null ? (
        <Vazio>Carregando…</Vazio>
      ) : tarefas.length === 0 ? (
        <Vazio>Nenhuma tarefa ainda.</Vazio>
      ) : (
        tarefas.map((t) => (
          <div
            key={t.id}
            style={{
              ...cartao,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              marginBottom: 6,
            }}
          >
            <input
              type="checkbox"
              checked={t.feita}
              onChange={() => alternar(t)}
              style={{ width: 17, height: 17, flexShrink: 0, accentColor: C.caneta, cursor: "pointer" }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 14.5,
                color: t.feita ? C.sub : C.ink,
                textDecoration: t.feita ? "line-through" : "none",
              }}
            >
              {t.texto}
            </span>
            {t.tag && (
              <span style={{ ...mono, fontSize: 10, color: C.sub, flexShrink: 0 }}>{t.tag.toUpperCase()}</span>
            )}
            <button
              onClick={() => apagar(t.id)}
              aria-label="Apagar tarefa"
              style={{
                flexShrink: 0,
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: C.sub,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { C, cartao, disp, mono } from "../../../theme";
import Botao from "../../../components/Botao";
import Segmented from "../../../components/Segmented";
import { Vazio } from "../../../components/Shell";
import type { NoMapa } from "../../../lib/mapas/tipos";
import {
  construirFilaDFS,
  embaralhar,
  responder,
  talvezReciclarErradas,
  type EstadoFilaEstudo,
  type Penalidade,
} from "../../../lib/mapas/estudo";
import { registrarRevisaoMapa } from "../../../lib/repo";

/**
 * Modo estudo (revisão ativa) do mapa — a parte que mais vale a pena portar
 * do SynapsePro: esconde o texto do nó-alvo, mostra o pai como contexto,
 * revela e autoavalia. Fila e penalidade vêm de lib/mapas/estudo.ts (puro,
 * testado); este componente só apresenta o estado que elas produzem.
 */
export default function EstudoMapa({
  mapaId,
  nos,
  soIds,
  onSair,
}: {
  mapaId: number;
  nos: NoMapa[];
  /** Restringe o estudo a um sub-ramo — null = mapa inteiro. */
  soIds: number[] | null;
  onSair: () => void;
}) {
  const [ordem, setOrdem] = useState<"sequencial" | "aleatoria">("sequencial");
  const [penalidade, setPenalidade] = useState<Penalidade>("logo");
  const [iniciado, setIniciado] = useState(false);
  const [estado, setEstado] = useState<EstadoFilaEstudo | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);

  const porId = useMemo(() => new Map(nos.map((n) => [n.id, n])), [nos]);
  const filtro = soIds ? new Set(soIds) : null;
  const totalDisponivel = useMemo(() => construirFilaDFS(nos, filtro).length, [nos, filtro]);

  function iniciar() {
    let fila = construirFilaDFS(nos, filtro);
    if (ordem === "aleatoria") fila = embaralhar(fila);
    setEstado({ fila, filaErradas: [] });
    setTotal(fila.length);
    setAcertos(0);
    setRevelado(false);
    setIniciado(true);
  }

  if (!iniciado) {
    return (
      <div>
        {totalDisponivel === 0 ? (
          <Vazio>Este mapa não tem nós suficientes para estudar.</Vazio>
        ) : (
          <div style={{ ...cartao, marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 10 }}>
              {totalDisponivel} NÓ{totalDisponivel === 1 ? "" : "S"} NESTA SESSÃO
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ ...mono, fontSize: 11, color: C.sub, marginBottom: 6 }}>ORDEM</div>
              <Segmented
                valor={ordem}
                opcoes={[
                  { id: "sequencial", label: "Sequencial" },
                  { id: "aleatoria", label: "Aleatória" },
                ]}
                onChange={setOrdem}
              />
            </div>
            <div>
              <div style={{ ...mono, fontSize: 11, color: C.sub, marginBottom: 6 }}>SE ERRAR</div>
              <Segmented
                valor={penalidade}
                opcoes={[
                  { id: "logo", label: "Repete logo" },
                  { id: "depois", label: "Repete no fim" },
                  { id: "nenhuma", label: "Só descarta" },
                ]}
                onChange={setPenalidade}
              />
            </div>
          </div>
        )}
        <Botao tipo="tinta" onClick={iniciar} disabled={totalDisponivel === 0} style={{ marginBottom: 8 }}>
          Começar
        </Botao>
        <Botao tipo="fantasma" onClick={onSair}>
          Voltar ao mapa
        </Botao>
      </div>
    );
  }

  if (estado && estado.fila.length === 0 && estado.filaErradas.length === 0) {
    const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 34 }}>🎉</div>
        <div style={{ ...disp, fontSize: 20, fontWeight: 700, margin: "10px 0 4px" }}>Sessão concluída</div>
        <div style={{ ...mono, fontSize: 13, color: C.sub, marginBottom: 20 }}>
          {acertos} de {total} lembrados de primeira ({pct}%)
        </div>
        <Botao
          tipo="tinta"
          onClick={() => {
            void registrarRevisaoMapa(mapaId, pct >= 70);
            onSair();
          }}
        >
          Concluir revisão
        </Botao>
      </div>
    );
  }

  // A reciclagem de erradas ("repete no fim") acontece já dentro de avaliar
  // (abaixo) — aqui só lê o estado atual, sem mutar durante o render.
  const idAtual = estado!.fila[0];
  const noAtual = idAtual != null ? porId.get(idAtual) : null;
  if (!noAtual) return <Vazio>Carregando…</Vazio>;
  const noPai = noAtual.pai != null ? porId.get(noAtual.pai) : null;
  const restantes = estado!.fila.length + estado!.filaErradas.length;

  function avaliar(acertou: boolean) {
    if (acertou) setAcertos((a) => a + 1);
    setEstado((e) => {
      if (!e) return e;
      const proximo = responder(e, acertou, penalidade);
      return talvezReciclarErradas(proximo, ordem);
    });
    setRevelado(false);
  }

  return (
    <div>
      <div style={{ ...mono, fontSize: 11, color: C.sub, marginBottom: 14, textAlign: "center" }}>
        {restantes} restante{restantes === 1 ? "" : "s"}
      </div>

      {noPai && (
        <div style={{ textAlign: "center", ...mono, fontSize: 12, color: C.sub, marginBottom: 6 }}>
          {noPai.texto || "(sem texto)"}
        </div>
      )}

      <div
        style={{
          ...cartao,
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px 16px",
          marginBottom: 14,
        }}
      >
        {revelado ? (
          <div style={{ ...disp, fontSize: 19, fontWeight: 700 }}>{noAtual.texto || "(sem texto)"}</div>
        ) : (
          <div>
            <div style={{ fontSize: 28, color: C.sub }}>?</div>
            {noAtual.dica && (
              <div style={{ ...mono, fontSize: 12, color: C.sub, marginTop: 8 }}>💡 {noAtual.dica}</div>
            )}
          </div>
        )}
      </div>

      {!revelado ? (
        <Botao tipo="tinta" onClick={() => setRevelado(true)}>
          Revelar
        </Botao>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <Botao tipo="fantasma" onClick={() => avaliar(false)} style={{ borderColor: C.erro, color: C.erro }}>
            Não lembrei
          </Botao>
          <Botao tipo="tinta" onClick={() => avaliar(true)}>
            Lembrei
          </Botao>
        </div>
      )}

      <Botao tipo="fantasma" onClick={onSair} style={{ marginTop: 10 }}>
        Sair do estudo
      </Botao>
    </div>
  );
}

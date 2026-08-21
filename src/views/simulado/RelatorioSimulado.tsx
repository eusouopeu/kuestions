import { C, cartao, disp, mono } from "../../theme";
import { estimarNotaProvavel, type Fatia } from "../../lib/repo";
import { pesoDe, type PesosEdital } from "../../lib/edital";

/** Fator sobre o tempo médio a partir do qual uma questão conta como "lenta".
 * 2× é o ponto em que o gasto deixa de ser variação normal e passa a indicar
 * insegurança (quando ela foi acertada) ou chute demorado (quando não). */
const FATOR_LENTA = 2;

export interface ItemRelatorio {
  area: string;
  acertou: boolean;
  /** "" = deixada em branco. */
  resposta: string;
  tempoMs: number;
  enunciado: string;
}

function duracao(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}min ${s % 60}s` : `${s}s`;
}

function corPct(pct: number): string {
  if (pct >= 80) return C.ok;
  if (pct >= 60) return C.caneta;
  return C.erro;
}

/**
 * Relatório pós-prova do simulado. Até aqui o simulado devolvia só o placar,
 * embora medisse o tempo de cada questão e soubesse o peso de cada área no
 * edital — três informações que, cruzadas, dizem o que o placar sozinho não
 * diz:
 *
 *   - ACERTO POR ÁREA vs. PESO: 60% numa matéria de peso 5 custa mais nota do
 *     que 40% numa de peso 1;
 *   - NOTA PROVÁVEL: o mesmo cálculo ponderado da aba Dados (ver
 *     estimarNotaProvavel), aplicado só a esta prova;
 *   - QUESTÕES LENTAS: acertar gastando 2× o tempo médio é fluência baixa, um
 *     problema diferente de errar — e o único que aparece como "acerto" no
 *     placar.
 */
export default function RelatorioSimulado({
  itens,
  segundosUsados,
  pesos,
}: {
  itens: ItemRelatorio[];
  /** Tempo efetivamente gasto na prova (não o tempo total disponível). */
  segundosUsados: number;
  pesos: PesosEdital;
}) {
  if (!itens.length) return null;

  const comTempo = itens.filter((i) => i.tempoMs > 0);
  const tempoMedio = comTempo.length
    ? comTempo.reduce((a, i) => a + i.tempoMs, 0) / comTempo.length
    : 0;
  const lentas = comTempo
    .filter((i) => tempoMedio > 0 && i.tempoMs >= tempoMedio * FATOR_LENTA)
    .sort((a, b) => b.tempoMs - a.tempoMs)
    .slice(0, 5);

  const porArea = new Map<string, { total: number; acertos: number }>();
  for (const i of itens) {
    const atual = porArea.get(i.area) ?? { total: 0, acertos: 0 };
    atual.total++;
    if (i.acertou) atual.acertos++;
    porArea.set(i.area, atual);
  }
  const fatias: Fatia[] = [...porArea.entries()]
    .map(([chave, v]) => ({
      chave,
      total: v.total,
      acertos: v.acertos,
      pct: Math.round((v.acertos / v.total) * 100),
    }))
    // Maior peso primeiro: é onde a diferença de acerto custa mais nota.
    .sort((a, b) => pesoDe(pesos, b.chave) - pesoDe(pesos, a.chave) || a.pct - b.pct);

  // Amostra mínima 1: um simulado tem poucas questões por área, e aqui a
  // pergunta é "como foi NESTA prova", não "qual meu domínio histórico".
  const nota = estimarNotaProvavel(fatias, pesos, 1);
  const emBranco = itens.filter((i) => !i.resposta).length;

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
        RELATÓRIO DA PROVA
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {[
          { rot: "Nota ponderada", val: nota ? `${nota.notaEstimada}%` : "—", cor: nota ? corPct(nota.notaEstimada) : C.ink },
          { rot: "Tempo por questão", val: tempoMedio ? duracao(tempoMedio) : "—", cor: C.ink },
          { rot: "Em branco", val: String(emBranco), cor: emBranco ? C.erro : C.ok },
        ].map((k) => (
          <div key={k.rot} style={{ ...cartao, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ ...disp, fontSize: 19, fontWeight: 800, color: k.cor, letterSpacing: -0.5 }}>
              {k.val}
            </div>
            <div style={{ ...mono, fontSize: 9, color: C.sub, marginTop: 2, lineHeight: 1.3 }}>
              {k.rot.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cartao, padding: "14px 14px 10px", marginTop: 10 }}>
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 10 }}>
          ACERTO POR ÁREA · PESO NO EDITAL
        </div>
        {fatias.map((f) => {
          const peso = pesoDe(pesos, f.chave);
          return (
            <div key={f.chave} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 12.5,
                  marginBottom: 4,
                }}
              >
                <span>
                  {f.chave}{" "}
                  <span style={{ ...mono, fontSize: 10.5, color: C.sub }}>(peso {peso})</span>
                </span>
                <span style={{ ...mono, color: corPct(f.pct), fontWeight: 600, flexShrink: 0 }}>
                  {f.acertos}/{f.total} · {f.pct}%
                </span>
              </div>
              {/* Barra com a espessura proporcional ao peso: o que pesa mais
                  no edital ocupa mais espaço visual, não só mais número. */}
              <div
                style={{
                  height: 4 + peso * 2,
                  borderRadius: 4,
                  background: C.line,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: `${f.pct}%`, height: "100%", background: corPct(f.pct) }} />
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.45, marginTop: 6 }}>
          Prova respondida em {duracao(segundosUsados * 1000)}. A nota ponderada aplica o peso de
          cada área ao seu acerto nela — configure os pesos em Ajustes.
        </div>
      </div>

      {lentas.length > 0 && (
        <div style={{ ...cartao, padding: "14px 14px 10px", marginTop: 10 }}>
          <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 4 }}>
            QUESTÕES MAIS LENTAS
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.45, marginBottom: 10 }}>
            Acima de {FATOR_LENTA}× o seu tempo médio. Acertar aqui é fluência baixa, não falta de
            domínio — na prova real, é onde o relógio some.
          </div>
          {lentas.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "7px 0",
                borderTop: `1px solid ${C.line}`,
                fontSize: 12.5,
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {l.enunciado}
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: 11.5,
                  flexShrink: 0,
                  color: l.acertou ? C.ok : C.erro,
                  fontWeight: 600,
                }}
              >
                {duracao(l.tempoMs)} · {l.acertou ? "acertou" : "errou"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

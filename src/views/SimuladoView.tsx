import { useEffect, useRef, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import Opcao, { type Reveal } from "./../components/Opcao";
import Chip from "../components/Chip";
import { Vazio } from "../components/Shell";
import {
  AREAS_BANCO,
  contarDisponiveis,
  questaoBancoParaQuestao,
  selecionarQuestoes,
  type QuestaoBanco,
} from "../lib/banco";
import { gravarResposta, idsBancoRespondidos } from "../lib/repo";
import type { Questao } from "../lib/types";

const LETRAS = ["A", "B", "C", "D", "E"];
const TOPICO_SIMULADO = "Simulado cronometrado";
const MINUTOS_PRESETS = [15, 30, 45, 60, 90, 120];

/** Fisher-Yates — mesma lógica de lib/banco.ts (não exportada de lá). */
function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Distribui `quantidade` proporcionalmente entre `areas`, respeitando o
 * disponível de cada uma — maior parte fracionária recebe o resto da divisão,
 * até o alvo (min(quantidade, soma dos disponíveis)) ser atingido.
 */
function alocarQuantidades(
  areas: string[],
  quantidade: number,
  disponiveis: Record<string, number>,
): Record<string, number> {
  const totalDisp = areas.reduce((a, ar) => a + (disponiveis[ar] ?? 0), 0);
  const alvo = Math.min(quantidade, totalDisp);
  const alocado: Record<string, number> = Object.fromEntries(areas.map((a) => [a, 0]));
  if (alvo <= 0) return alocado;

  const bruta = areas.map((a) => ({ area: a, exata: (alvo * (disponiveis[a] ?? 0)) / totalDisp }));
  let somaFloor = 0;
  for (const b of bruta) {
    const f = Math.min(Math.floor(b.exata), disponiveis[b.area] ?? 0);
    alocado[b.area] = f;
    somaFloor += f;
  }
  let restante = alvo - somaFloor;
  const ordenados = [...bruta].sort((a, b) => (b.exata % 1) - (a.exata % 1));
  for (const b of ordenados) {
    if (restante <= 0) break;
    if (alocado[b.area] < (disponiveis[b.area] ?? 0)) {
      alocado[b.area]++;
      restante--;
    }
  }
  return alocado;
}

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Pergunta {
  area: string;
  questao: Questao;
}

type Tela = "config" | "drill" | "resultado";

/**
 * Simulado cronometrado: mistura questões REAIS do banco (ver lib/banco.ts)
 * de várias áreas sob um tempo limite, sem o rigor de aprovação ≥90% do
 * método Kumon — só o placar final. Diferente dos outros drills do app, as
 * respostas ficam ocultas (sem revelar gabarito por questão) até o fim, como
 * numa prova de verdade; por isso não usa QuestaoCard (que sempre revela
 * imediatamente) nem chama a API (nenhum comentário/explicação é gerado —
 * bastam enunciado, alternativas e gabarito reais).
 */
export default function SimuladoView() {
  const [tela, setTela] = useState<Tela>("config");
  const [areasSelecionadas, setAreasSelecionadas] = useState<Set<string>>(new Set());
  const [quantidade, setQuantidade] = useState(20);
  const [minutos, setMinutos] = useState(60);
  const [vistas, setVistas] = useState<Set<string>>(new Set());

  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<(string | null)[]>([]);
  const [tachadasPorQuestao, setTachadasPorQuestao] = useState<string[][]>([]);
  const [idx, setIdx] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [expandida, setExpandida] = useState<number | null>(null);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tela === "config") idsBancoRespondidos().then(setVistas).catch(() => setVistas(new Set()));
  }, [tela]);

  const disponivelPorArea = Object.fromEntries(
    AREAS_BANCO.map((a) => [a, contarDisponiveis(a, { modo: "todos" })]),
  );
  const disponivelTotal = [...areasSelecionadas].reduce((a, ar) => a + (disponivelPorArea[ar] ?? 0), 0);

  useEffect(() => {
    if (disponivelTotal > 0) setQuantidade((q) => Math.min(q, disponivelTotal));
  }, [disponivelTotal]);

  function alternarArea(area: string) {
    setAreasSelecionadas((s) => {
      const novo = new Set(s);
      if (novo.has(area)) novo.delete(area);
      else novo.add(area);
      return novo;
    });
  }

  function iniciar() {
    const areas = [...areasSelecionadas];
    if (!areas.length || disponivelTotal <= 0) return;
    const alocacao = alocarQuantidades(areas, quantidade, disponivelPorArea);

    const sorteadas: Pergunta[] = [];
    for (const area of areas) {
      const n = alocacao[area] ?? 0;
      if (n <= 0) continue;
      const qs: QuestaoBanco[] = selecionarQuestoes(area, { modo: "todos" }, n, vistas);
      for (const q of qs) sorteadas.push({ area, questao: questaoBancoParaQuestao(q) });
    }

    const misturadas = embaralhar(sorteadas);
    setPerguntas(misturadas);
    setRespostas(misturadas.map(() => null));
    setTachadasPorQuestao(misturadas.map(() => []));
    setIdx(0);
    setSegundosRestantes(minutos * 60);
    setConfirmandoEncerrar(false);
    setExpandida(null);
    setTela("drill");
  }

  async function finalizar() {
    if (finalizando) return;
    setFinalizando(true);
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    let n = 0;
    for (let i = 0; i < perguntas.length; i++) {
      const { area, questao } = perguntas[i];
      const resposta = respostas[i] ?? "";
      const acertou = resposta !== "" && resposta === questao.gabarito;
      if (acertou) n++;
      try {
        await gravarResposta({
          blocoId: null,
          materia: area,
          topico: TOPICO_SIMULADO,
          nivel: null,
          questao,
          resposta,
          acertou,
        });
      } catch (e) {
        console.error("gravar resposta simulado", e);
      }
    }
    setAcertos(n);
    setFinalizando(false);
    setTela("resultado");
  }

  // Cronômetro regressivo — só roda durante o drill; some ao sair dele.
  useEffect(() => {
    if (tela !== "drill") return;
    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [tela]);

  // Tempo esgotado: finaliza automaticamente, gravando o que não foi
  // respondido como resposta em branco.
  useEffect(() => {
    if (tela === "drill" && segundosRestantes === 0 && !finalizando) {
      finalizar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosRestantes, tela]);

  /* ---------- CONFIG ---------- */
  if (tela === "config") {
    return (
      <div>
        <div style={{ ...cartao, padding: "12px 14px", marginBottom: 20, fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>
          Mistura questões reais de prova de uma ou mais áreas sob tempo limite, sem chamar a API.
          As respostas só são reveladas ao final — como numa prova de verdade — e o simulado não
          exige 90% de acerto: só registra o placar.
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Áreas ({areasSelecionadas.size} selecionada{areasSelecionadas.size === 1 ? "" : "s"})</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {AREAS_BANCO.map((a) => {
              const ativa = areasSelecionadas.has(a);
              const disp_ = disponivelPorArea[a] ?? 0;
              return (
                <button
                  key={a}
                  onClick={() => alternarArea(a)}
                  disabled={disp_ === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: disp_ === 0 ? "default" : "pointer",
                    opacity: disp_ === 0 ? 0.4 : 1,
                    border: `1.5px solid ${ativa ? C.caneta : C.line}`,
                    background: ativa ? C.canetaSoft : C.card,
                  }}
                >
                  <span style={{ ...disp, fontSize: 14, fontWeight: ativa ? 600 : 400, color: ativa ? C.caneta : C.ink }}>
                    {a}
                  </span>
                  <span style={{ ...mono, fontSize: 11, color: C.sub, flexShrink: 0 }}>{disp_}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Quantidade de questões</label>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
            <button
              onClick={() => setQuantidade((q) => Math.max(1, q - 5))}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
              style={stepperBotaoStyle(quantidade <= 1)}
            >
              −
            </button>
            <div
              style={{
                ...campo,
                ...disp,
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Math.min(quantidade, disponivelTotal || quantidade)}
            </div>
            <button
              onClick={() => setQuantidade((q) => Math.min(disponivelTotal || 1, q + 5))}
              disabled={quantidade >= disponivelTotal}
              aria-label="Aumentar quantidade"
              style={stepperBotaoStyle(quantidade >= disponivelTotal)}
            >
              +
            </button>
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.sub, marginTop: 5 }}>
            {disponivelTotal} {disponivelTotal === 1 ? "questão disponível" : "questões disponíveis"}{" "}
            nas áreas selecionadas.
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={rotulo}>Tempo</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MINUTOS_PRESETS.map((m) => {
              const ativo = minutos === m;
              return (
                <button
                  key={m}
                  onClick={() => setMinutos(m)}
                  style={{
                    ...mono,
                    flex: "1 1 60px",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "10px 4px",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `1.5px solid ${ativo ? C.realce : C.line}`,
                    background: ativo ? C.realce : C.card,
                    color: ativo ? "#fff" : C.ink,
                  }}
                >
                  {m}min
                </button>
              );
            })}
          </div>
        </div>

        <Botao onClick={iniciar} tipo="tinta" disabled={areasSelecionadas.size === 0 || disponivelTotal === 0}>
          Iniciar simulado{disponivelTotal ? ` (${Math.min(quantidade, disponivelTotal)} questões, ${minutos}min)` : ""}
        </Botao>
      </div>
    );
  }

  /* ---------- DRILL ---------- */
  if (tela === "drill") {
    const pergunta = perguntas[idx];
    const resposta = respostas[idx];
    const tachadas = tachadasPorQuestao[idx] ?? [];
    const ultima = idx === perguntas.length - 1;
    const respondidas = respostas.filter((r) => r != null && r !== "").length;
    const pouco = segundosRestantes <= 60;

    if (!pergunta) return <Vazio>Nenhuma questão sorteada.</Vazio>;

    function marcarResposta(letra: string) {
      setRespostas((rs) => rs.map((r, k) => (k === idx ? letra : r)));
    }
    function tachar(letra: string) {
      setTachadasPorQuestao((ts) =>
        ts.map((t, k) => (k === idx ? (t.includes(letra) ? t : [...t, letra]) : t)),
      );
      setRespostas((rs) => rs.map((r, k) => (k === idx && r === letra ? null : r)));
    }
    function destachar(letra: string) {
      setTachadasPorQuestao((ts) => ts.map((t, k) => (k === idx ? t.filter((x) => x !== letra) : t)));
    }

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "10px 0 14px",
          }}
        >
          <div style={{ ...mono, fontSize: 11, color: C.sub }}>
            {idx + 1}/{perguntas.length} · {respondidas} respondida{respondidas === 1 ? "" : "s"}
          </div>
          <div
            style={{
              ...mono,
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 15,
              fontWeight: 700,
              color: pouco ? C.erro : C.ink,
            }}
          >
            <ClockIcon width={16} height={16} stroke={pouco ? C.erro : C.sub} strokeWidth={2} />
            {formatarTempo(segundosRestantes)}
          </div>
          <button
            onClick={() => setConfirmandoEncerrar(true)}
            style={{
              ...mono,
              fontSize: 11,
              background: "none",
              border: `1.5px solid ${C.line}`,
              borderRadius: 6,
              padding: "5px 8px",
              color: C.sub,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Encerrar
          </button>
        </div>

        <div style={{ height: 5, background: C.line, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
          <div
            style={{
              height: "100%",
              width: `${((idx + 1) / perguntas.length) * 100}%`,
              background: C.caneta,
              borderRadius: 3,
              transition: "width 0.25s ease",
            }}
          />
        </div>

        <div style={{ ...cartao }}>
          <div style={{ marginBottom: 10 }}>
            <Chip tom="neutro">{pergunta.area}</Chip>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 16px" }}>{pergunta.questao.enunciado}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(pergunta.questao.alternativas ?? []).map((alt, i) => {
              const l = LETRAS[i];
              return (
                <Opcao
                  key={l}
                  texto={alt}
                  tachada={tachadas.includes(l)}
                  marcada={resposta === l}
                  reveal={null as Reveal}
                  onSelect={() => marcarResposta(l)}
                  onTachar={() => tachar(l)}
                  onDestachar={() => destachar(l)}
                />
              );
            })}
          </div>

          <div
            style={{
              ...mono,
              fontSize: 10.5,
              color: C.sub,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Toque para marcar · deslize ← para riscar · deslize → para desfazer
          </div>

          <Botao onClick={() => (ultima ? setConfirmandoEncerrar(true) : setIdx(idx + 1))} style={{ marginTop: 16 }}>
            {ultima ? "Finalizar simulado" : "Próxima questão"}
          </Botao>
        </div>

        {confirmandoEncerrar && (
          <div
            style={{
              marginTop: 18,
              background: C.canetaSoft,
              border: `1.5px solid ${C.caneta}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              {ultima || respondidas === perguntas.length
                ? "Finalizar o simulado e ver o resultado?"
                : `Ainda ${perguntas.length - respondidas === 1 ? "falta 1 questão" : `faltam ${perguntas.length - respondidas} questões`} sem resposta — elas contam como erradas. Encerrar mesmo assim?`}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmandoEncerrar(false)}
                disabled={finalizando}
                style={{ background: C.card }}
              >
                Voltar
              </Botao>
              <Botao onClick={finalizar} disabled={finalizando} style={{ background: C.realce, borderColor: C.realce }}>
                {finalizando ? "Gravando…" : "Finalizar"}
              </Botao>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- RESULTADO ---------- */
  const erradas = perguntas
    .map((p, i) => ({ ...p, resposta: respostas[i] ?? "" }))
    .filter((p) => p.resposta !== p.questao.gabarito);

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
        <div style={{ ...mono, fontSize: 12, color: C.sub, letterSpacing: 1 }}>
          RESULTADO DO SIMULADO
        </div>
        <div
          style={{
            ...disp,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -2,
            color: acertos / (perguntas.length || 1) >= 0.7 ? C.ok : C.ink,
          }}
        >
          {acertos}
          <span style={{ fontSize: 28, color: C.sub, fontWeight: 600 }}>/{perguntas.length}</span>
        </div>
        <div style={{ ...mono, fontSize: 12, color: C.sub, marginTop: 4 }}>
          {perguntas.length
            ? `${Math.round((acertos / perguntas.length) * 100)}% de acerto`
            : ""}
        </div>
      </div>

      {erradas.length > 0 && (
        <div style={{ marginTop: 20, marginBottom: 18 }}>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
            REVISÃO — {erradas.length} ERRADA{erradas.length === 1 ? "" : "S"} OU EM BRANCO
          </div>
          {erradas.map((e, i) => {
            const aberta = expandida === i;
            return (
              <div key={i} style={{ ...cartao, padding: "12px 14px", marginBottom: 8 }}>
                <button
                  onClick={() => setExpandida(aberta ? null : i)}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: aberta ? undefined : 2,
                      WebkitBoxOrient: "vertical",
                      overflow: aberta ? "visible" : "hidden",
                    }}
                  >
                    {e.questao.enunciado}
                  </span>
                </button>
                {aberta && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.line}` }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                      {(e.questao.alternativas ?? []).map((alt, k) => {
                        const l = LETRAS[k];
                        const ehGabarito = l === e.questao.gabarito;
                        const ehSua = l === e.resposta;
                        return (
                          <div
                            key={l}
                            style={{
                              fontSize: 13,
                              lineHeight: 1.4,
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: ehGabarito ? C.okSoft : ehSua ? C.erroSoft : "transparent",
                              color: ehGabarito ? C.ok : ehSua ? C.erro : C.ink,
                            }}
                          >
                            {alt}
                            {ehGabarito ? " ✓" : ehSua ? " ✗ (sua resposta)" : ""}
                          </div>
                        );
                      })}
                      {!e.resposta && (
                        <div style={{ ...mono, fontSize: 11, color: C.sub }}>Você não respondeu esta questão.</div>
                      )}
                    </div>
                    <Chip tom="neutro">{e.area}</Chip>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Botao tipo="tinta" onClick={() => setTela("config")} style={{ marginTop: 8 }}>
        Novo simulado
      </Botao>
    </div>
  );
}

function stepperBotaoStyle(desabilitado: boolean) {
  return {
    ...disp,
    width: 48,
    fontSize: 22,
    fontWeight: 700,
    borderRadius: 8,
    border: `1.5px solid ${C.line}`,
    background: C.card,
    color: C.ink,
    cursor: desabilitado ? "default" : "pointer",
    opacity: desabilitado ? 0.4 : 1,
  } as const;
}

import { useEffect, useRef, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import Opcao, { type Reveal } from "./../components/Opcao";
import Chip from "../components/Chip";
import { Vazio } from "../components/Shell";
import {
  areasBanco,
  contarDisponiveis,
  garantirBanco,
  questaoBancoParaQuestao,
  selecionarQuestoes,
  type QuestaoBanco,
  NIVEL_BANCO,
} from "../lib/banco";
import {
  estimarNotaProvavel,
  gravarRespostasEmLote,
  gravarSimulado,
  idsBancoRespondidos,
  mesclarExplicacoesBanco,
  type Fatia,
} from "../lib/repo";
import RelatorioSimulado from "./simulado/RelatorioSimulado";
import { getPesosEdital, pesoDe, PRESETS_PESO_EDITAL, type PesosEdital } from "../lib/edital";
import { gerarExplicacaoParcial, letrasExplicaveis, mensagemDeErro } from "../lib/anthropic";
import type { Questao } from "../lib/types";

const LETRAS = ["A", "B", "C", "D", "E"];
const TOPICO_SIMULADO = "Simulado cronometrado";
const MIN_MINUTOS = 5;
const MAX_MINUTOS = 240;
const PASSO_MINUTOS = 5;

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
 * Distribui `quantidade` entre `areas` proporcionalmente ao peso de cada uma
 * no edital (lib/edital.ts) — usado só pelo botão "Aplicar distribuição" para
 * sugerir uma quantidade por matéria; o usuário pode ajustar cada matéria
 * manualmente depois com os steppers da própria lista. Ainda respeita a
 * capacidade de cada área (nunca aloca mais que o disponível): quando uma
 * área bate no teto, o excedente é redistribuído entre as demais pelo mesmo
 * critério de peso, em rodadas sucessivas até esgotar `quantidade` ou não
 * haver mais área com capacidade — por isso o `while` abaixo.
 */
function alocarPorPeso(
  areas: string[],
  quantidade: number,
  disponiveis: Record<string, number>,
  pesos: PesosEdital,
): Record<string, number> {
  const cap = Object.fromEntries(areas.map((a) => [a, disponiveis[a] ?? 0]));
  const alocado: Record<string, number> = Object.fromEntries(areas.map((a) => [a, 0]));
  let restante = Math.min(quantidade, areas.reduce((s, a) => s + cap[a], 0));
  let ativos = areas.filter((a) => cap[a] > 0);

  while (restante > 0 && ativos.length > 0) {
    const totalPeso = ativos.reduce((s, a) => s + Math.max(pesoDe(pesos, a), 0.0001), 0);
    const bruta = ativos.map((a) => ({
      area: a,
      exata: (restante * Math.max(pesoDe(pesos, a), 0.0001)) / totalPeso,
    }));

    let algumAlocado = false;
    for (const b of bruta) {
      const capacidade = cap[b.area] - alocado[b.area];
      const quota = Math.min(Math.floor(b.exata), capacidade);
      if (quota > 0) {
        alocado[b.area] += quota;
        restante -= quota;
        algumAlocado = true;
      }
    }
    if (restante > 0) {
      const ordenados = [...bruta].sort((a, b) => (b.exata % 1) - (a.exata % 1));
      for (const b of ordenados) {
        if (restante <= 0) break;
        if (alocado[b.area] < cap[b.area]) {
          alocado[b.area]++;
          restante--;
          algumAlocado = true;
        }
      }
    }
    ativos = ativos.filter((a) => alocado[a] < cap[a]);
    if (!algumAlocado) break; // guarda contra loop infinito com pesos degenerados
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
 * de várias áreas sob um tempo limite, sem o rigor de aprovação ≥80% do
 * método Kumon — só o placar final. Diferente dos outros drills do app, as
 * respostas ficam ocultas (sem revelar gabarito por questão) até o fim, como
 * numa prova de verdade; por isso não usa QuestaoCard (que sempre revela
 * imediatamente) nem chama a API (nenhum comentário/explicação é gerado —
 * bastam enunciado, alternativas e gabarito reais).
 */
export default function SimuladoView() {
  const [tela, setTela] = useState<Tela>("config");
  // O JSON do banco (~1,5 MB) é carregado sob demanda (ver garantirBanco em
  // lib/banco.ts) só quando esta view monta — não faz parte do bundle
  // inicial do app.
  const [bancoPronto, setBancoPronto] = useState(false);
  useEffect(() => {
    garantirBanco().then(() => setBancoPronto(true));
  }, []);
  // Quantidade de questões por área, decidida matéria a matéria (0 = área
  // fora do simulado) — em vez de um total único redistribuído sozinho pelo
  // app. "Aplicar distribuição" ainda preenche isto automaticamente a partir
  // do preset/peso escolhido abaixo, mas o usuário pode ajustar qualquer
  // matéria depois com o próprio stepper da linha.
  const [qtdPorArea, setQtdPorArea] = useState<Record<string, number>>({});
  const [minutos, setMinutos] = useState(60);
  const [vistas, setVistas] = useState<Set<string>>(new Set());
  const [pesoPreset, setPesoPreset] = useState(PRESETS_PESO_EDITAL[0].id);
  const [pesoPersonalizado, setPesoPersonalizado] = useState(false);
  const [pesosEdital, setPesosEdital] = useState<PesosEdital>({});
  const [alvoDistribuicao, setAlvoDistribuicao] = useState(20);

  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<(string | null)[]>([]);
  const [tachadasPorQuestao, setTachadasPorQuestao] = useState<string[][]>([]);
  const [idx, setIdx] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [expandida, setExpandida] = useState<number | null>(null);
  // Explicação sob demanda de uma errada expandida na revisão — o Simulado
  // nunca chama a API na hora da prova, então toda explicação aqui é sob
  // demanda (ver gerarExplicacaoParcial em anthropic.ts). Um item aberto por
  // vez, então um único conjunto de seleção serve para qualquer um.
  const [selecionadasExplicar, setSelecionadasExplicar] = useState<Set<string>>(new Set());
  const [gerandoExplicacao, setGerandoExplicacao] = useState(false);
  const [erroExplicacao, setErroExplicacao] = useState<string | null>(null);

  useEffect(() => {
    setSelecionadasExplicar(new Set());
    setGerandoExplicacao(false);
    setErroExplicacao(null);
  }, [expandida]);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tempo gasto em CADA questão (ms), acumulado enquanto ela está na tela —
  // o usuário pode voltar a uma questão já vista, então é soma, não um único
  // início/fim. Base do relatório pós-prova (ver RelatorioSimulado) e do
  // `tempo_ms` gravado em questoes_respondidas.
  const temposRef = useRef<number[]>([]);
  const entradaQuestaoRef = useRef<number>(Date.now());
  const [tempos, setTempos] = useState<number[]>([]);
  const [segundosUsados, setSegundosUsados] = useState(0);

  /** Fecha a contagem da questão em que o usuário estava e reinicia o
   * cronômetro para a próxima. Chamado na troca de questão e ao finalizar. */
  function fecharTempoDaQuestao(indice: number) {
    const agora = Date.now();
    const gasto = agora - entradaQuestaoRef.current;
    entradaQuestaoRef.current = agora;
    if (indice >= 0 && gasto > 0) {
      temposRef.current[indice] = (temposRef.current[indice] ?? 0) + gasto;
    }
  }

  useEffect(() => {
    if (tela === "config") idsBancoRespondidos().then(setVistas).catch(() => setVistas(new Set()));
  }, [tela]);

  useEffect(() => {
    if (tela === "config") getPesosEdital().then(setPesosEdital).catch(() => setPesosEdital({}));
  }, [tela]);

  const disponivelPorArea = Object.fromEntries(
    areasBanco().map((a) => [a, contarDisponiveis(a, { modo: "todos" })]),
  );
  const areasSelecionadas = areasBanco().filter((a) => (qtdPorArea[a] ?? 0) > 0);
  const quantidadeTotal = areasSelecionadas.reduce((s, a) => s + (qtdPorArea[a] ?? 0), 0);

  const presetSelecionado =
    PRESETS_PESO_EDITAL.find((p) => p.id === pesoPreset) ?? PRESETS_PESO_EDITAL[0];
  const pesosEfetivos = pesoPersonalizado ? pesosEdital : presetSelecionado.pesos;

  function alterarQtdArea(area: string, delta: number) {
    setQtdPorArea((q) => {
      const max = disponivelPorArea[area] ?? 0;
      const atual = q[area] ?? 0;
      return { ...q, [area]: Math.max(0, Math.min(max, atual + delta)) };
    });
  }

  function alterarMinutos(delta: number) {
    setMinutos((m) => Math.max(MIN_MINUTOS, Math.min(MAX_MINUTOS, m + delta)));
  }

  /** Preenche `qtdPorArea` a partir do preset/peso personalizado selecionado
   * — ponto de partida rápido que o usuário ainda pode ajustar matéria a
   * matéria antes de iniciar. */
  function aplicarDistribuicao() {
    const areasComDisponivel = areasBanco().filter((a) => (disponivelPorArea[a] ?? 0) > 0);
    if (!areasComDisponivel.length) return;
    setQtdPorArea(alocarPorPeso(areasComDisponivel, alvoDistribuicao, disponivelPorArea, pesosEfetivos));
  }

  function iniciar() {
    const areas = areasSelecionadas;
    if (!areas.length) return;

    const sorteadas: Pergunta[] = [];
    for (const area of areas) {
      const n = Math.min(qtdPorArea[area] ?? 0, disponivelPorArea[area] ?? 0);
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
    temposRef.current = misturadas.map(() => 0);
    entradaQuestaoRef.current = Date.now();
    setTempos([]);
    setSegundosUsados(0);
    setConfirmandoEncerrar(false);
    setExpandida(null);
    setTela("drill");
  }

  async function finalizar() {
    if (finalizando) return;
    setFinalizando(true);
    fecharTempoDaQuestao(idx);
    setTempos([...temposRef.current]);
    setSegundosUsados(minutos * 60 - segundosRestantes);
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    let n = 0;
    const itens = perguntas.map(({ area, questao }, i) => {
      const resposta = respostas[i] ?? "";
      const acertou = resposta !== "" && resposta === questao.gabarito;
      if (acertou) n++;
      return {
        blocoId: null,
        materia: area,
        topico: TOPICO_SIMULADO,
        // Simulado é feito de questões de prova real: nível 5 (ver
        // NIVEL_BANCO em lib/banco.ts).
        nivel: NIVEL_BANCO,
        questao,
        resposta,
        acertou,
        tempoMs: temposRef.current[i] ?? null,
      };
    });
    try {
      await gravarRespostasEmLote(itens);
    } catch (e) {
      console.error("gravar respostas simulado", e);
    }

    // Mesmo cálculo de RelatorioSimulado (nota ponderada pelo peso do
    // edital), persistido aqui para alimentar a evolução em Dados — ver
    // repo/simulados.ts.
    const porArea = new Map<string, { total: number; acertos: number }>();
    for (const it of itens) {
      const atual = porArea.get(it.materia) ?? { total: 0, acertos: 0 };
      atual.total++;
      if (it.acertou) atual.acertos++;
      porArea.set(it.materia, atual);
    }
    const fatias: Fatia[] = [...porArea.entries()].map(([chave, v]) => ({
      chave,
      total: v.total,
      acertos: v.acertos,
      pct: Math.round((v.acertos / v.total) * 100),
    }));
    const nota = estimarNotaProvavel(fatias, pesosEfetivos, 1);
    try {
      await gravarSimulado({
        notaEstimada: nota?.notaEstimada ?? null,
        totalQuestoes: itens.length,
        acertos: n,
        emBranco: itens.filter((it) => !it.resposta).length,
        tempoTotalMs: temposRef.current.reduce((s, t) => s + t, 0),
      });
    } catch (e) {
      console.error("gravar histórico do simulado", e);
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

  if (!bancoPronto) {
    return <Vazio>Carregando banco de questões…</Vazio>;
  }

  /* ---------- CONFIG ---------- */
  if (tela === "config") {
    return (
      <div>
        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>
            Áreas e questões por matéria ({areasSelecionadas.length} selecionada
            {areasSelecionadas.length === 1 ? "" : "s"} · {quantidadeTotal}{" "}
            {quantidadeTotal === 1 ? "questão" : "questões"})
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {areasBanco().map((a) => {
              const max = disponivelPorArea[a] ?? 0;
              const qtd = qtdPorArea[a] ?? 0;
              const ativa = qtd > 0;
              return (
                <div
                  key={a}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 8px 8px 12px",
                    borderRadius: 8,
                    opacity: max === 0 ? 0.4 : 1,
                    border: `1.5px solid ${ativa ? C.caneta : C.line}`,
                    background: ativa ? C.canetaSoft : C.card,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        ...disp,
                        fontSize: 14,
                        fontWeight: ativa ? 600 : 400,
                        color: ativa ? C.caneta : C.ink,
                      }}
                    >
                      {a}
                    </div>
                    <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                      {max} disponíve{max === 1 ? "l" : "is"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => alterarQtdArea(a, -1)}
                      disabled={qtd <= 0}
                      aria-label={`Diminuir questões de ${a}`}
                      style={areaStepperBotaoStyle(qtd <= 0)}
                    >
                      −
                    </button>
                    <div style={{ ...mono, width: 26, textAlign: "center", fontSize: 14, fontWeight: 700 }}>
                      {qtd}
                    </div>
                    <button
                      onClick={() => alterarQtdArea(a, 1)}
                      disabled={qtd >= max}
                      aria-label={`Aumentar questões de ${a}`}
                      style={areaStepperBotaoStyle(qtd >= max)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...cartao, padding: "12px 14px", marginBottom: 18 }}>
          <label style={rotulo}>Distribuir automaticamente</label>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8, margin: "6px 0 10px" }}>
            <button
              onClick={() => setAlvoDistribuicao((v) => Math.max(1, v - 5))}
              aria-label="Diminuir alvo da distribuição"
              style={stepperBotaoStyle(false)}
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
              {alvoDistribuicao}
            </div>
            <button
              onClick={() => setAlvoDistribuicao((v) => v + 5)}
              aria-label="Aumentar alvo da distribuição"
              style={stepperBotaoStyle(false)}
            >
              +
            </button>
          </div>
          <Botao tipo="fantasma" onClick={aplicarDistribuicao} style={{ background: C.card }}>
            Aplicar
          </Botao>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Peso das matérias</label>
          <select
            style={campo}
            value={pesoPreset}
            onChange={(e) => setPesoPreset(e.target.value)}
            disabled={pesoPersonalizado}
          >
            {PRESETS_PESO_EDITAL.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13.5 }}>Peso personalizado</div>
            </div>
            <button
              role="switch"
              aria-checked={pesoPersonalizado}
              onClick={() => setPesoPersonalizado((v) => !v)}
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                border: "none",
                padding: 3,
                flexShrink: 0,
                display: "flex",
                justifyContent: pesoPersonalizado ? "flex-end" : "flex-start",
                background: pesoPersonalizado ? C.caneta : C.line,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.card }} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={rotulo}>Tempo</label>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
            <button
              onClick={() => alterarMinutos(-PASSO_MINUTOS)}
              disabled={minutos <= MIN_MINUTOS}
              aria-label="Diminuir tempo"
              style={stepperBotaoStyle(minutos <= MIN_MINUTOS)}
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
              {minutos}min
            </div>
            <button
              onClick={() => alterarMinutos(PASSO_MINUTOS)}
              disabled={minutos >= MAX_MINUTOS}
              aria-label="Aumentar tempo"
              style={stepperBotaoStyle(minutos >= MAX_MINUTOS)}
            >
              +
            </button>
          </div>
        </div>

        <Botao onClick={iniciar} tipo="tinta" disabled={areasSelecionadas.length === 0}>
          Iniciar simulado{quantidadeTotal ? ` (${quantidadeTotal} questões, ${minutos}min)` : ""}
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

          {/* O banco real tem os dois formatos (ver questaoBancoParaQuestao
              em lib/banco.ts): Certo/Errado desenha os dois botões grandes,
              como no drill; múltipla escolha lista A–E. */}
          {pergunta.questao.formato === "ce" ? (
            <div style={{ display: "flex", gap: 10 }}>
              {([["E", "ERRADO"], ["C", "CERTO"]] as const).map(([l, rot]) => (
                <Opcao
                  key={l}
                  texto={rot}
                  big
                  style={{ flex: 1 }}
                  tachada={tachadas.includes(l)}
                  marcada={resposta === l}
                  reveal={null as Reveal}
                  onSelect={() => marcarResposta(l)}
                  onTachar={() => tachar(l)}
                  onDestachar={() => destachar(l)}
                />
              ))}
            </div>
          ) : (
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
          )}

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

          <Botao
            onClick={() => {
              if (ultima) {
                setConfirmandoEncerrar(true);
                return;
              }
              fecharTempoDaQuestao(idx);
              setIdx(idx + 1);
            }}
            style={{ marginTop: 16 }}
          >
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
    .map((p, i) => ({ ...p, resposta: respostas[i] ?? "", idxOriginal: i }))
    .filter((p) => p.resposta !== p.questao.gabarito);

  function alternarSelecaoExplicar(l: string) {
    setSelecionadasExplicar((s) => {
      const novo = new Set(s);
      if (novo.has(l)) novo.delete(l);
      else novo.add(l);
      return novo;
    });
  }

  /** O Simulado nunca liga a explicação na hora da prova (nem sequer revela
   * o gabarito até o fim) — toda explicação aqui é sob demanda, na revisão.
   * Persiste só no cache do banco (banco_id): o Simulado não cria um bloco
   * de verdade, então não há uma linha em `questoes_respondidas` por
   * pergunta para atualizar (ver gravarRespostasEmLote), mas a próxima vez
   * que esta mesma questão real aparecer — noutro simulado ou bloco do
   * banco — já vem explicada. */
  async function explicarSelecionadasRevisao(idxOriginal: number, questao: Questao) {
    if (!selecionadasExplicar.size || gerandoExplicacao) return;
    setGerandoExplicacao(true);
    setErroExplicacao(null);
    const letras = [...selecionadasExplicar];
    try {
      const { comentario, explicacoes_erradas } = await gerarExplicacaoParcial(questao, letras);
      setPerguntas((ps) =>
        ps.map((p, i) =>
          i === idxOriginal
            ? {
                ...p,
                questao: {
                  ...p.questao,
                  comentario: comentario ?? p.questao.comentario,
                  explicacoes_erradas: { ...p.questao.explicacoes_erradas, ...explicacoes_erradas },
                },
              }
            : p,
        ),
      );
      setSelecionadasExplicar(new Set());
      if (questao.bancoId) {
        mesclarExplicacoesBanco(questao.bancoId, comentario, explicacoes_erradas).catch((e) =>
          console.error("persistir explicação sob demanda (banco)", e),
        );
      }
    } catch (e) {
      setErroExplicacao(mensagemDeErro(e));
    } finally {
      setGerandoExplicacao(false);
    }
  }

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

      <RelatorioSimulado
        itens={perguntas.map(({ area, questao }, i) => ({
          area,
          acertou: respostas[i] !== null && respostas[i] === questao.gabarito,
          resposta: respostas[i] ?? "",
          tempoMs: tempos[i] ?? 0,
          enunciado: questao.enunciado,
        }))}
        segundosUsados={segundosUsados}
        pesos={pesosEfetivos}
      />

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
                      {(e.questao.alternativas ?? ["C) Certo", "E) Errado"]).map((alt, k) => {
                        const l = e.questao.formato === "ce" ? ["C", "E"][k] : LETRAS[k];
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

                    {/* Explicação sob demanda — o Simulado nunca gera
                        explicação sozinho, então toda alternativa começa
                        sem explicação; o usuário escolhe o que quer
                        entender. */}
                    <div style={{ marginBottom: 10 }}>
                      {letrasExplicaveis(e.questao).map((l) => {
                        const ehGabarito = l === e.questao.gabarito;
                        const texto = ehGabarito
                          ? e.questao.comentario
                          : e.questao.explicacoes_erradas?.[l];
                        if (texto) {
                          return (
                            <div
                              key={l}
                              style={{ display: "flex", gap: 8, padding: "6px 0", borderTop: `1px solid ${C.line}` }}
                            >
                              <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: ehGabarito ? C.ok : C.sub, minWidth: 16 }}>
                                {l}
                              </span>
                              <span style={{ fontSize: 13, lineHeight: 1.4, flex: 1 }}>{texto}</span>
                            </div>
                          );
                        }
                        const marcada = selecionadasExplicar.has(l);
                        return (
                          <label
                            key={l}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 0",
                              borderTop: `1px solid ${C.line}`,
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={marcada}
                              onChange={() => alternarSelecaoExplicar(l)}
                              style={{ flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
                            />
                            <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.sub, minWidth: 16 }}>
                              {l}
                            </span>
                            <span style={{ fontSize: 12, color: C.sub, flex: 1, fontStyle: "italic" }}>
                              {ehGabarito ? "Por que está certa" : "Ainda não explicada"}
                            </span>
                          </label>
                        );
                      })}

                      {selecionadasExplicar.size > 0 && (
                        <Botao
                          tipo="fantasma"
                          onClick={() => explicarSelecionadasRevisao(e.idxOriginal, e.questao)}
                          disabled={gerandoExplicacao}
                          style={{ marginTop: 8 }}
                        >
                          {gerandoExplicacao
                            ? "Gerando explicação…"
                            : `Explicar ${selecionadasExplicar.size} selecionada${selecionadasExplicar.size === 1 ? "" : "s"}`}
                        </Botao>
                      )}
                      {erroExplicacao && (
                        <div style={{ ...mono, fontSize: 11, color: C.erro, marginTop: 6 }}>{erroExplicacao}</div>
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

/** Stepper menor, para o −/+ de cada linha de área (cabe ao lado do rótulo
 * sem alargar demais cada linha da lista). */
function areaStepperBotaoStyle(desabilitado: boolean) {
  return {
    ...disp,
    width: 28,
    height: 28,
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 6,
    border: `1.5px solid ${C.line}`,
    background: C.card,
    color: C.ink,
    cursor: desabilitado ? "default" : "pointer",
    opacity: desabilitado ? 0.4 : 1,
    lineHeight: "26px",
    padding: 0,
  } as const;
}

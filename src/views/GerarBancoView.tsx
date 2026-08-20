import { useEffect, useRef, useState } from "react";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import EsqueletoQuestao from "../components/EsqueletoQuestao";
import Rail from "../components/Rail";
import Segmented from "../components/Segmented";
import QuestaoCard, { type Confianca } from "../components/QuestaoCard";
import { Vazio } from "../components/Shell";
import {
  anosDeArea,
  AREAS_BANCO,
  assuntosDeArea,
  blocosDeArea,
  contarDisponiveis,
  contarIneditas,
  descricaoFiltroBanco,
  instituicoesDeArea,
  pesosPorAssunto,
  pontuarAssuntos,
  questaoBancoParaQuestao,
  selecionarQuestoes,
  type FiltroBanco,
} from "../lib/banco";
import { gerarExplicacoes, SemCredencialError } from "../lib/anthropic";
import { temCredencial } from "../lib/secure";
import { getComExplicacoesIA } from "../lib/preferenciasGeracao";
import {
  buscarExplicacoesBanco,
  criarBloco,
  fecharBloco,
  gravarResposta,
  idsBancoRespondidos,
  pontosPorConceito,
  salvarExplicacoesBanco,
} from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import type { Questao, StatusSub } from "../lib/types";

type Tela = "config" | "drill" | "resultado";
type Modo = "aula" | "bloco" | "todos";

/** Questões geradas em bastidores em lotes de 4 (chamada única à API para
 * escrever comentário + explicações de cada alternativa errada), com a mesma
 * cascata de pré-carregamento de GerarView — o usuário raramente espera. */
const LOTE = 4;

/**
 * 4ª forma de montar um bloco na aba Questões: em vez de gerar questões
 * inéditas via IA, sorteia questões REAIS de um banco de provas anexado
 * (enunciado/alternativas/gabarito nunca são alterados) e só usa a API para
 * escrever comentário e explicação de cada alternativa errada — e mesmo isso
 * é opcional (ver `comExplicacoes`). Funciona mesmo sem chave de API
 * configurada (ou offline): a questão real em si já tem valor sozinha, só o
 * comentário/explicações ficam indisponíveis até serem geradas (na criação
 * ou sob demanda depois de responder, ver QuestaoCard).
 */
export default function GerarBancoView({ onAjustes }: { onAjustes: () => void }) {
  const [tela, setTela] = useState<Tela>("config");
  const [temChave, setTemChave] = useState(true);
  const [area, setArea] = useState<string>(AREAS_BANCO[0] ?? "");
  const [modo, setModo] = useState<Modo>("todos");
  const [assunto, setAssunto] = useState<string>("");
  const [bloco, setBloco] = useState<string>("");
  // "" = todas as bancas; 0 = todos os anos — mesma convenção de área/matéria
  // "todas" já usada no resto do app.
  const [instituicao, setInstituicao] = useState<string>("");
  const [ano, setAno] = useState<number>(0);
  const [quantidade, setQuantidade] = useState<number>(12);
  // Gerar comentário/explicações já na montagem do bloco, ou deixar para
  // sob demanda depois de responder — mesma ideia de GerarView. Preferência
  // única em Ajustes (ver lib/preferenciasGeracao.ts).
  const [comExplicacoes, setComExplicacoes] = useState(true);

  useEffect(() => {
    getComExplicacoesIA().then(setComExplicacoes);
  }, []);

  const [lotes, setLotes] = useState<(Questao[] | null)[]>([]);
  const [statusLote, setStatusLote] = useState<StatusSub[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [blocoId, setBlocoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoAbandono, setConfirmandoAbandono] = useState(false);
  const [abandonando, setAbandonando] = useState(false);
  const [respondidaAtual, setRespondidaAtual] = useState(false);
  // ids do banco fixo já respondidos em qualquer bloco anterior — usado para
  // priorizar questões inéditas (ver lib/banco.ts) e avisar quando o estoque
  // de inéditas do filtro atual está acabando.
  const [vistas, setVistas] = useState<Set<string>>(new Set());

  // Guarda a lista completa sorteada nesta rodada, para reenviar um lote que
  // falhou sem precisar sortear tudo de novo.
  const selecionadasRef = useRef<Questao[]>([]);

  useEffect(() => {
    setModo("todos");
    setAssunto("");
    setBloco("");
    setInstituicao("");
    setAno(0);
  }, [area]);

  useEffect(() => {
    setRespondidaAtual(false);
  }, [qIdx]);

  useEffect(() => {
    if (tela === "config") {
      temCredencial().then(setTemChave);
      idsBancoRespondidos().then(setVistas).catch(() => setVistas(new Set()));
    }
  }, [tela]);

  if (!AREAS_BANCO.length) {
    return <Vazio>Banco de questões vazio ou não encontrado.</Vazio>;
  }

  const proveniencia = {
    ...(instituicao ? { instituicao } : {}),
    ...(ano ? { ano } : {}),
  };
  const filtro: FiltroBanco =
    modo === "aula" && assunto
      ? { modo: "aula", assunto, ...proveniencia }
      : modo === "bloco" && bloco
        ? { modo: "bloco", bloco, ...proveniencia }
        : { modo: "todos", ...proveniencia };

  const disponiveis = contarDisponiveis(area, filtro);
  const ineditas = contarIneditas(area, filtro, vistas);

  useEffect(() => {
    if (disponiveis > 0) setQuantidade((q) => Math.min(q, disponiveis));
  }, [disponiveis]);

  /**
   * Antes de chamar a API, consulta o cache local (banco_id → comentário já
   * gerado, ver lib/repo.ts) — relevante porque o banco tem só ~1100
   * questões e, esgotado o estoque de inéditas de uma área, a mesma questão
   * real volta a ser sorteada e não precisa gerar a mesma explicação de novo.
   * Uma explicação já em cache aparece de graça mesmo com o toggle
   * `comExplicacoes` desligado — só a geração de uma explicação NOVA é que
   * respeita o toggle. Questões que saem sem explicação (cache ausente e
   * toggle desligado, ou sem chave de API) ficam com comentario/
   * explicacoes_erradas vazios — QuestaoCard oferece pedir a explicação sob
   * demanda depois de respondida.
   */
  async function dispararLote(i: number, todas: Questao[], nLotes: number) {
    const fatia = todas.slice(i * LOTE, i * LOTE + LOTE);
    if (!fatia.length) return;
    setStatusLote((st) => st.map((v, k) => (k === i ? "carregando" : v)));
    setErro(null);
    try {
      const idsComCache = fatia.map((q) => q.bancoId).filter((id): id is string => !!id);
      const cache = await buscarExplicacoesBanco(idsComCache);

      const semCache = fatia.filter((q) => !q.bancoId || !cache.has(q.bancoId));
      let geradas: Questao[] = [];
      if (comExplicacoes) {
        try {
          geradas = semCache.length ? await gerarExplicacoes(semCache) : [];
        } catch (e) {
          // Sem chave de API: a 4ª forma de montar bloco não depende dela
          // para funcionar (as questões já são reais, vêm prontas do banco)
          // — só o comentário/explicações ficam sem gerar, em vez de travar
          // o bloco inteiro com um erro.
          if (!(e instanceof SemCredencialError)) throw e;
        }
      }
      const geradasPorId = new Map(geradas.map((q) => [q.bancoId, q]));

      const qs = fatia.map((q) => {
        const doCache = q.bancoId ? cache.get(q.bancoId) : undefined;
        if (doCache) return { ...q, ...doCache };
        return (q.bancoId && geradasPorId.get(q.bancoId)) || q;
      });

      const novasParaCache = geradas
        .filter((q): q is Questao & { bancoId: string } => !!q.bancoId)
        .map((q) => ({
          bancoId: q.bancoId,
          comentario: q.comentario,
          explicacoes_erradas: q.explicacoes_erradas,
        }));
      if (novasParaCache.length) salvarExplicacoesBanco(novasParaCache).catch((e) => console.error("cache explicações", e));

      setLotes((l) => l.map((v, k) => (k === i ? qs : v)));
      setStatusLote((st) => st.map((v, k) => (k === i ? "ok" : v)));
      if (i < nLotes - 1) dispararLote(i + 1, todas, nLotes);
    } catch (e: unknown) {
      setStatusLote((st) => st.map((v, k) => (k === i ? "erro" : v)));
      setErro(e instanceof Error ? e.message : "Falha ao gerar explicações.");
    }
  }

  async function iniciar() {
    const n = Math.min(quantidade, disponiveis);
    if (n <= 0) return;

    // Direciona a amostragem para os assuntos mais fracos (ver
    // pontuarAssuntos/pesosPorAssunto em lib/banco.ts) sempre que o filtro
    // cobre mais de um assunto ("Todos os assuntos"/"Bloco de aulas") — não
    // restringe a quantidade disponível, só reordena a prioridade do sorteio.
    let pesos: Map<string, number> | undefined;
    try {
      const linhas = await pontosPorConceito(area);
      pesos = pesosPorAssunto(pontuarAssuntos(area, linhas));
    } catch (e) {
      console.error("direcionar assunto por pontuação", e);
    }

    const selecionadas = selecionarQuestoes(area, filtro, n, vistas, pesos).map(questaoBancoParaQuestao);
    const nLotes = Math.ceil(selecionadas.length / LOTE);

    setLotes(Array.from({ length: nLotes }, () => null));
    setStatusLote(Array.from({ length: nLotes }, () => "idle"));
    setQIdx(0);
    setTotalQuestoes(selecionadas.length);
    setAcertos(0);
    setErro(null);
    setConfirmandoAbandono(false);
    setTela("drill");

    const topico = descricaoFiltroBanco(area, filtro);
    try {
      setBlocoId(
        await criarBloco(
          { materia: area, materiaCustom: "", topico, tipos: [], formato: "mc", nivel: 0 },
          selecionadas.length,
        ),
      );
    } catch (e) {
      console.error("criar bloco do banco", e);
      setBlocoId(null);
    }

    selecionadasRef.current = selecionadas;
    dispararLote(0, selecionadas, nLotes);
  }

  const loteAtual = Math.floor(qIdx / LOTE);
  const questao = lotes[loteAtual]?.[qIdx % LOTE] ?? null;
  const ultimaDoBloco = qIdx === totalQuestoes - 1;
  const topicoAtual = descricaoFiltroBanco(area, filtro);

  async function responder(
    letra: string,
    acertou: boolean,
    tempoMs: number,
    confianca: Confianca | null,
  ): Promise<number | null> {
    if (acertou) setAcertos((a) => a + 1);
    setRespondidaAtual(true);
    if (!questao) return null;
    return gravarResposta({
      blocoId,
      materia: area,
      topico: topicoAtual,
      nivel: null,
      questao,
      resposta: letra,
      acertou,
      tempoMs,
      confianca,
    });
  }

  async function proxima() {
    if (ultimaDoBloco) {
      if (blocoId != null) {
        try {
          await fecharBloco(blocoId, [acertos], acertos / totalQuestoes >= 0.9);
        } catch (e) {
          console.error("fechar bloco do banco", e);
        }
      }
      setTela("resultado");
      return;
    }
    setQIdx(qIdx + 1);
  }

  function questoesNaoRespondidas(): Questao[] {
    const pendentes: Questao[] = [];
    if (questao && !respondidaAtual) pendentes.push(questao);
    for (let idx = qIdx + 1; idx < totalQuestoes; idx++) {
      const l = Math.floor(idx / LOTE);
      const q = lotes[l]?.[idx % LOTE];
      if (q) pendentes.push(q);
    }
    return pendentes;
  }

  async function abandonarBloco() {
    setAbandonando(true);
    try {
      for (const q of questoesNaoRespondidas()) {
        try {
          await gravarResposta({
            blocoId,
            materia: area,
            topico: topicoAtual,
            nivel: null,
            questao: q,
            resposta: "",
            acertou: false,
          });
        } catch (e) {
          console.error("gravar não respondida (banco)", e);
        }
      }
      if (blocoId != null) {
        try {
          await fecharBloco(blocoId, [acertos], false);
        } catch (e) {
          console.error("fechar bloco do banco abandonado", e);
        }
      }
    } finally {
      setAbandonando(false);
      setTela("config");
    }
  }

  /* ---------- CONFIG ---------- */
  if (tela === "config") {
    return (
      <div>
        {!temChave && (
          <div
            style={{
              ...cartao,
              background: C.canetaSoft,
              borderColor: C.caneta,
              marginBottom: 18,
            }}
          >
            <div style={{ ...mono, fontSize: 11, color: C.caneta, letterSpacing: 0.8, marginBottom: 6 }}>
              SEM CHAVE DE API CONFIGURADA
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: "0 0 12px" }}>
              Sem problema: o enunciado, as alternativas e o gabarito vêm prontos do banco real e
              funcionam normalmente, inclusive offline. Só o comentário e a explicação de cada
              alternativa errada — escritos pela IA — ficam indisponíveis até você configurar uma
              chave em Ajustes.
            </p>
            <Botao tipo="fantasma" onClick={onAjustes} style={{ maxWidth: 260, background: C.card }}>
              Configurar chave em Ajustes
            </Botao>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Área</label>
          <select style={campo} value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS_BANCO.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Assunto</label>
          <Segmented
            valor={modo}
            opcoes={[
              { id: "aula" as Modo, label: "Aula específica" },
              { id: "bloco" as Modo, label: "Bloco de aulas" },
              { id: "todos" as Modo, label: "Todos os assuntos" },
            ]}
            onChange={setModo}
          />
          {modo === "aula" && (
            <select
              style={{ ...campo, marginTop: 8 }}
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            >
              <option value="">Selecione uma aula…</option>
              {assuntosDeArea(area).map((a) => (
                <option key={a.assunto} value={a.assunto}>
                  {a.assunto} ({a.total})
                </option>
              ))}
            </select>
          )}
          {modo === "bloco" && (
            <select
              style={{ ...campo, marginTop: 8 }}
              value={bloco}
              onChange={(e) => setBloco(e.target.value)}
            >
              <option value="">Selecione um bloco…</option>
              {blocosDeArea(area).map((b) => (
                <option key={b.bloco} value={b.bloco}>
                  {b.bloco} ({b.total})
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={rotulo}>Banca (opcional)</label>
            <select style={campo} value={instituicao} onChange={(e) => setInstituicao(e.target.value)}>
              <option value="">Todas as bancas</option>
              {instituicoesDeArea(area).map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label style={rotulo}>Ano (opcional)</label>
            <select style={campo} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              <option value={0}>Todos os anos</option>
              {anosDeArea(area).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={rotulo}>Quantidade de questões</label>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
            <button
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
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
              {Math.min(quantidade, disponiveis || quantidade)}
            </div>
            <button
              onClick={() => setQuantidade((q) => Math.min(disponiveis || 1, q + 1))}
              disabled={quantidade >= disponiveis}
              aria-label="Aumentar quantidade"
              style={stepperBotaoStyle(quantidade >= disponiveis)}
            >
              +
            </button>
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.sub, marginTop: 5 }}>
            {disponiveis} questão{disponiveis === 1 ? "" : "es"} disponíve
            {disponiveis === 1 ? "l" : "is"} neste filtro
            {disponiveis > 0 && (
              <>
                {" · "}
                <span style={{ color: ineditas > 0 ? C.ok : C.caneta }}>
                  {ineditas} inédita{ineditas === 1 ? "" : "s"}
                </span>
              </>
            )}
            .
          </div>
          {disponiveis > 0 && ineditas === 0 && (
            <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
              Você já respondeu todas as questões deste filtro — o bloco vai repetir questões já
              vistas, sorteadas de novo.
            </div>
          )}
        </div>

        <Botao onClick={iniciar} tipo="tinta" disabled={disponiveis === 0}>
          Gerar bloco do banco{disponiveis ? ` (${Math.min(quantidade, disponiveis)} questões)` : ""}
        </Botao>
      </div>
    );
  }

  /* ---------- DRILL ---------- */
  if (tela === "drill") {
    const st = statusLote[loteAtual];
    return (
      <div>
        <Rail
          atual={qIdx}
          total={totalQuestoes}
          onSair={() => setConfirmandoAbandono(true)}
        />

        {st === "erro" && (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 10, fontSize: 14, lineHeight: 1.5 }}>
              {erro ?? "Falha ao gerar explicações."}
            </div>
            <Botao
              onClick={() => dispararLote(loteAtual, selecionadasRef.current, statusLote.length)}
              tipo="tinta"
              style={{ maxWidth: 240, margin: "0 auto" }}
            >
              Tentar de novo
            </Botao>
          </div>
        )}

        {(st === "carregando" || st === "idle") && <EsqueletoQuestao />}

        {st === "ok" && questao && (
          <QuestaoCard
            key={qIdx}
            questao={questao}
            materia={area}
            tagAssunto={gerarTagAssunto(topicoAtual)}
            origem="banco"
            labelProxima={ultimaDoBloco ? "Ver resultado" : "Próxima questão"}
            onResponder={responder}
            onProxima={proxima}
          />
        )}

        {confirmandoAbandono ? (
          <div
            style={{
              marginTop: 18,
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Abandonar este bloco? As questões já respondidas ficam gravadas; as que faltam vão
              para "Refazer erradas" como não respondidas.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmandoAbandono(false)}
                disabled={abandonando}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={abandonarBloco}
                disabled={abandonando}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                {abandonando ? "Salvando…" : "Abandonar"}
              </Botao>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /* ---------- RESULTADO ---------- */
  const passou = totalQuestoes > 0 && acertos / totalQuestoes >= 0.9;
  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
        <div style={{ ...mono, fontSize: 12, color: C.sub, letterSpacing: 1 }}>
          RESULTADO DO BLOCO
        </div>
        <div
          style={{
            ...disp,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -2,
            color: passou ? C.ok : C.ink,
          }}
        >
          {acertos}
          <span style={{ fontSize: 28, color: C.sub, fontWeight: 600 }}>/{totalQuestoes}</span>
        </div>
      </div>

      <Botao tipo="tinta" onClick={() => setTela("config")} style={{ marginTop: 16 }}>
        Gerar outro bloco do banco
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

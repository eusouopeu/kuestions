import { useEffect, useRef, useState } from "react";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import Rail from "../components/Rail";
import Segmented from "../components/Segmented";
import QuestaoCard from "../components/QuestaoCard";
import { Vazio } from "../components/Shell";
import {
  AREAS_BANCO,
  assuntosDeArea,
  blocosDeArea,
  contarDisponiveis,
  descricaoFiltroBanco,
  questaoBancoParaQuestao,
  selecionarQuestoes,
  type FiltroBanco,
} from "../lib/banco";
import { gerarExplicacoes } from "../lib/anthropic";
import { criarBloco, fecharBloco, gravarResposta } from "../lib/repo";
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
 * escrever comentário e explicação de cada alternativa errada.
 */
export default function GerarBancoView() {
  const [tela, setTela] = useState<Tela>("config");
  const [area, setArea] = useState<string>(AREAS_BANCO[0] ?? "");
  const [modo, setModo] = useState<Modo>("todos");
  const [assunto, setAssunto] = useState<string>("");
  const [bloco, setBloco] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(12);

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

  // Guarda a lista completa sorteada nesta rodada, para reenviar um lote que
  // falhou sem precisar sortear tudo de novo.
  const selecionadasRef = useRef<Questao[]>([]);

  useEffect(() => {
    setModo("todos");
    setAssunto("");
    setBloco("");
  }, [area]);

  useEffect(() => {
    setRespondidaAtual(false);
  }, [qIdx]);

  if (!AREAS_BANCO.length) {
    return <Vazio>Banco de questões vazio ou não encontrado.</Vazio>;
  }

  const filtro: FiltroBanco =
    modo === "aula" && assunto
      ? { modo: "aula", assunto }
      : modo === "bloco" && bloco
        ? { modo: "bloco", bloco }
        : { modo: "todos" };

  const disponiveis = contarDisponiveis(area, filtro);

  function dispararLote(i: number, todas: Questao[], nLotes: number) {
    const fatia = todas.slice(i * LOTE, i * LOTE + LOTE);
    if (!fatia.length) return;
    setStatusLote((st) => st.map((v, k) => (k === i ? "carregando" : v)));
    setErro(null);
    gerarExplicacoes(fatia)
      .then((qs) => {
        setLotes((l) => l.map((v, k) => (k === i ? qs : v)));
        setStatusLote((st) => st.map((v, k) => (k === i ? "ok" : v)));
        if (i < nLotes - 1) dispararLote(i + 1, todas, nLotes);
      })
      .catch((e: unknown) => {
        setStatusLote((st) => st.map((v, k) => (k === i ? "erro" : v)));
        setErro(e instanceof Error ? e.message : "Falha ao gerar explicações.");
      });
  }

  async function iniciar() {
    const n = Math.min(quantidade, disponiveis);
    if (n <= 0) return;
    const selecionadas = selecionarQuestoes(area, filtro, n).map(questaoBancoParaQuestao);
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

  async function responder(letra: string, acertou: boolean): Promise<number | null> {
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

        <div style={{ marginBottom: 20 }}>
          <label style={rotulo}>Quantidade de questões</label>
          <input
            type="number"
            style={campo}
            min={1}
            max={disponiveis || 1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
          />
          <div style={{ ...mono, fontSize: 11, color: C.sub, marginTop: 5 }}>
            {disponiveis} questão{disponiveis === 1 ? "" : "es"} disponíve
            {disponiveis === 1 ? "l" : "is"} neste filtro
            {quantidade > disponiveis && disponiveis > 0
              ? ` — o bloco sairá com ${disponiveis}, todas as que existem`
              : ""}
            .
          </div>
        </div>

        <div style={{ ...cartao, padding: "12px 14px", marginBottom: 20, fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>
          Estas são questões reais de prova, extraídas de um banco anexado. Enunciado, alternativas
          e gabarito não são alterados — só o comentário e a explicação de cada alternativa errada
          são gerados pela IA.
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
        <Rail atual={qIdx} total={totalQuestoes} />

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

        {(st === "carregando" || st === "idle") && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.sub }}>
            <div style={{ ...mono, fontSize: 13 }}>Gerando explicações…</div>
            <div
              style={{
                marginTop: 10,
                height: 3,
                background: C.line,
                borderRadius: 2,
                overflow: "hidden",
                maxWidth: 220,
                margin: "12px auto 0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "40%",
                  background: C.caneta,
                  borderRadius: 2,
                  animation: "desliza 1.1s ease-in-out infinite alternate",
                }}
              />
            </div>
          </div>
        )}

        {st === "ok" && questao && (
          <QuestaoCard
            key={qIdx}
            questao={questao}
            materia={area}
            tagAssunto={gerarTagAssunto(topicoAtual)}
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
        ) : (
          <button
            onClick={() => setConfirmandoAbandono(true)}
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
            Abandonar bloco
          </button>
        )}
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

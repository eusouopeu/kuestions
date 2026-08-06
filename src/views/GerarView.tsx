import { useEffect, useRef, useState } from "react";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import Rail from "../components/Rail";
import Segmented from "../components/Segmented";
import QuestaoCard from "../components/QuestaoCard";
import { Vazio } from "../components/Shell";
import {
  MATERIAS,
  MIN_APROVACAO,
  NIVEIS,
  NIVEL_DESCRICOES,
  N_SUBS,
  Q_POR_BLOCO,
  Q_POR_SUB,
  TIPOS,
  FORMATOS,
} from "../lib/constants";
import { gerarSubBloco, SemCredencialError } from "../lib/anthropic";
import { criarBloco, fecharBloco, gravarResposta, listarBlocos } from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import {
  blocosDeMateria,
  descricaoBloco,
  rotuloBloco,
  rotuloTopico,
  TOPICOS_POR_MATERIA,
} from "../lib/topicos";
import type { Bloco, Config, Questao, StatusSub } from "../lib/types";
import type { TipoId } from "../lib/constants";

type Tela = "config" | "drill" | "resultado";
type ModoTopico = "aula" | "bloco" | "todos";

/**
 * Fluxo de geração do artefato, adaptado para 4×3 questões e persistência em
 * SQLite. Mantém o pré-carregamento em cascata: assim que o 1º lote chega, o
 * 2º já começa a ser gerado, então o usuário raramente espera entre lotes. A
 * divisão em 4 lotes de 3 é só um detalhe de latência — não representa mais
 * progressão de dificuldade (a "carga conceitual" A→D foi removida: as
 * questões dos sub-blocos não saíam perceptivelmente diferentes).
 */
export default function GerarView({ onDados }: { onDados: () => void }) {
  const [tela, setTela] = useState<Tela>("config");
  const [cfg, setCfg] = useState<Config>({
    materia: MATERIAS[0],
    materiaCustom: "",
    topico: "",
    tipos: ["abstrato"],
    formato: "misto",
    nivel: 3,
  });

  const [subs, setSubs] = useState<(Questao[] | null)[]>([null, null, null, null]);
  const [statusSub, setStatusSub] = useState<StatusSub[]>(["idle", "idle", "idle", "idle"]);
  const [qIdx, setQIdx] = useState(0);
  const [acertos, setAcertos] = useState<number[]>([0, 0, 0, 0]);
  const [blocoId, setBlocoId] = useState<number | null>(null);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [hist, setHist] = useState<Bloco[]>([]);
  const [confirmandoAbandono, setConfirmandoAbandono] = useState(false);
  const [abandonando, setAbandonando] = useState(false);
  // A questão em `qIdx` já foi registrada (respondida ou reportada como
  // errada)? Distingue, no abandono, o que já foi gravado do que ainda falta.
  const [respondidaAtual, setRespondidaAtual] = useState(false);

  const [modoTopico, setModoTopico] = useState<ModoTopico>("todos");

  // dispararSub roda fora do render e precisa ler o estado mais recente.
  const subsRef = useRef(subs);
  subsRef.current = subs;

  useEffect(() => {
    if (tela === "config") listarBlocos(null, 5).then(setHist).catch(() => setHist([]));
  }, [tela]);

  useEffect(() => {
    setRespondidaAtual(false);
  }, [qIdx]);

  /** Alterna um tipo na seleção. Nunca deixa a lista vazia — desmarcar o
   * último selecionado não faz nada, para sempre haver ao menos 1 tipo. */
  function alternarTipo(id: TipoId) {
    setCfg((atual) => {
      const ja = atual.tipos.includes(id);
      if (ja && atual.tipos.length === 1) return atual;
      const tipos = ja ? atual.tipos.filter((t) => t !== id) : [...atual.tipos, id];
      return { ...atual, tipos };
    });
  }

  const materiaFinal =
    cfg.materia === "__outra" ? cfg.materiaCustom.trim() || "Matéria personalizada" : cfg.materia;
  const c = { ...cfg, materia: materiaFinal };

  /** Conceitos já usados nos lotes anteriores, para não repetir padrões. */
  function padroesDe(atuais: (Questao[] | null)[], ate: number): string[] {
    const p: string[] = [];
    for (let i = 0; i < ate; i++) {
      const s = atuais[i];
      if (s) {
        const cs = [...new Set(s.flatMap((q) => q.conceitos))].slice(0, 4);
        if (cs.length) p.push(`Lote ${i + 1}: ${cs.join(", ")}`);
      }
    }
    return p;
  }

  /** Gabaritos de Certo/Errado já gerados nos sub-blocos anteriores deste
   * bloco — repassado ao prompt para corrigir o viés do modelo em favor de
   * "Certo" (ver instrucaoEquilibrioGabarito em lib/anthropic.ts). */
  function gabaritosCEDe(atuais: (Questao[] | null)[], ate: number): string[] {
    const g: string[] = [];
    for (let i = 0; i < ate; i++) {
      const s = atuais[i];
      if (s) for (const q of s) if (q.formato === "ce") g.push(q.gabarito);
    }
    return g;
  }

  function dispararSub(i: number, conf: Config & { materia: string }) {
    setStatusSub((st) => st.map((v, k) => (k === i ? "carregando" : v)));
    setErroApi(null);
    gerarSubBloco(conf, i, padroesDe(subsRef.current, i), gabaritosCEDe(subsRef.current, i))
      .then((qs) => {
        setSubs((s) => s.map((v, k) => (k === i ? qs : v)));
        setStatusSub((st) => st.map((v, k) => (k === i ? "ok" : v)));
        if (i < N_SUBS - 1) dispararSub(i + 1, conf); // pré-carrega o próximo
      })
      .catch((e: unknown) => {
        setStatusSub((st) => st.map((v, k) => (k === i ? "erro" : v)));
        setErroApi(e instanceof Error ? e.message : "Falha na geração.");
      });
  }

  async function iniciarBloco() {
    setSubs([null, null, null, null]);
    setStatusSub(["idle", "idle", "idle", "idle"]);
    setQIdx(0);
    setAcertos([0, 0, 0, 0]);
    setErroApi(null);
    setConfirmandoAbandono(false);
    setTela("drill");
    try {
      setBlocoId(await criarBloco(c, Q_POR_BLOCO));
    } catch (e) {
      console.error("criar bloco", e);
      setBlocoId(null); // o drill segue; só o vínculo com o bloco se perde
    }
    dispararSub(0, c);
  }

  const subAtual = Math.floor(qIdx / Q_POR_SUB);
  const questao = subs[subAtual]?.[qIdx % Q_POR_SUB] ?? null;
  const ultimaDoBloco = qIdx === Q_POR_BLOCO - 1;

  async function responder(letra: string, acertou: boolean): Promise<number | null> {
    if (acertou) setAcertos((a) => a.map((v, k) => (k === subAtual ? v + 1 : v)));
    setRespondidaAtual(true);
    if (!questao) return null;
    // Toda questão respondida é gravada, certa ou errada: é a base da revisão
    // de erradas e de todos os gráficos da aba Dados.
    return gravarResposta({
      blocoId,
      materia: c.materia,
      topico: c.topico,
      nivel: c.nivel,
      questao,
      resposta: letra,
      acertou,
    });
  }

  async function proxima() {
    if (ultimaDoBloco) {
      const total = acertos.reduce((a, b) => a + b, 0);
      if (blocoId != null) {
        try {
          await fecharBloco(blocoId, acertos, total >= MIN_APROVACAO);
        } catch (e) {
          console.error("fechar bloco", e);
        }
      }
      setTela("resultado");
      return;
    }
    setQIdx(qIdx + 1);
  }

  /** Questões já geradas mas que nunca chegaram a ser respondidas (a atual,
   * se ainda não revelada, mais todas as de lotes já carregados à frente) —
   * gravadas como erradas em vez de descartadas, para caírem em "Refazer
   * erradas" na próxima visita. */
  function questoesNaoRespondidas(): Questao[] {
    const pendentes: Questao[] = [];
    if (questao && !respondidaAtual) pendentes.push(questao);
    for (let idx = qIdx + 1; idx < Q_POR_BLOCO; idx++) {
      const s = Math.floor(idx / Q_POR_SUB);
      const q = subs[s]?.[idx % Q_POR_SUB];
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
            materia: c.materia,
            topico: c.topico,
            nivel: c.nivel,
            questao: q,
            resposta: "",
            acertou: false,
          });
        } catch (e) {
          console.error("gravar não respondida", e);
        }
      }
      if (blocoId != null) {
        try {
          await fecharBloco(blocoId, acertos, false);
        } catch (e) {
          console.error("fechar bloco abandonado", e);
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
          <label style={rotulo}>Matéria</label>
          <select
            style={campo}
            value={cfg.materia}
            onChange={(e) => {
              setModoTopico("todos");
              setCfg({ ...cfg, materia: e.target.value, topico: "" });
            }}
          >
            {MATERIAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="__outra">Outra…</option>
          </select>
          {cfg.materia === "__outra" && (
            <input
              style={{ ...campo, marginTop: 8 }}
              placeholder="Digite a matéria"
              value={cfg.materiaCustom}
              onChange={(e) => setCfg({ ...cfg, materiaCustom: e.target.value })}
            />
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Tópico específico (opcional)</label>
          {TOPICOS_POR_MATERIA[cfg.materia] ? (
            <>
              <Segmented
                valor={modoTopico}
                opcoes={[
                  { id: "aula" as ModoTopico, label: "Aula específica" },
                  { id: "bloco" as ModoTopico, label: "Bloco de aulas" },
                  { id: "todos" as ModoTopico, label: "Todos os tópicos" },
                ]}
                onChange={(m) => {
                  setModoTopico(m);
                  setCfg({ ...cfg, topico: "" });
                }}
              />
              {modoTopico === "aula" && (
                <select
                  style={{ ...campo, marginTop: 8 }}
                  value={cfg.topico}
                  onChange={(e) => setCfg({ ...cfg, topico: e.target.value })}
                >
                  <option value="">Selecione uma aula…</option>
                  {TOPICOS_POR_MATERIA[cfg.materia].map((t) => (
                    <option key={t.codigo} value={rotuloTopico(t)}>
                      {rotuloTopico(t)}
                    </option>
                  ))}
                </select>
              )}
              {modoTopico === "bloco" && (
                <select
                  style={{ ...campo, marginTop: 8 }}
                  value={cfg.topico}
                  onChange={(e) => setCfg({ ...cfg, topico: e.target.value })}
                >
                  <option value="">Selecione um bloco…</option>
                  {blocosDeMateria(cfg.materia).map((b) => (
                    <option key={b.bloco} value={descricaoBloco(b)}>
                      {rotuloBloco(b)}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <input
              style={campo}
              placeholder="ex.: lançamento tributário, imunidades…"
              value={cfg.topico}
              onChange={(e) => setCfg({ ...cfg, topico: e.target.value })}
            />
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Tipo de cobrança</label>
          <div style={{ fontSize: 12.5, color: C.sub, margin: "-4px 0 8px" }}>
            {cfg.tipos.length > 1
              ? "Sorteado por questão entre os selecionados, dentro do mesmo lote."
              : "Selecione mais de um para sortear entre eles a cada questão."}
          </div>
          {TIPOS.map((t) => {
            const ativo = cfg.tipos.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => alternarTipo(t.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 6,
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `1.5px solid ${ativo ? C.caneta : C.line}`,
                  background: ativo ? C.canetaSoft : C.card,
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    borderRadius: 4,
                    border: `1.5px solid ${ativo ? C.caneta : C.line}`,
                    background: ativo ? C.caneta : "transparent",
                    color: "#fff",
                    fontSize: 11,
                    lineHeight: "13px",
                    textAlign: "center",
                  }}
                >
                  {ativo ? "✓" : ""}
                </div>
                <div>
                  <div
                    style={{
                      ...disp,
                      fontWeight: 600,
                      fontSize: 14,
                      color: ativo ? C.caneta : C.ink,
                    }}
                  >
                    {t.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label style={rotulo}>Formato</label>
            <div style={{ display: "flex", gap: 6 }}>
              {FORMATOS.map((f) => {
                const ativo = cfg.formato === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setCfg({ ...cfg, formato: f.id })}
                    style={{
                      ...mono,
                      flex: 1,
                      fontSize: 12,
                      padding: "10px 4px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `1.5px solid ${ativo ? C.caneta : C.line}`,
                      background: ativo ? C.caneta : C.card,
                      color: ativo ? "#fff" : C.ink,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label style={rotulo}>Dificuldade</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const ativo = cfg.nivel === n;
                return (
                  <button
                    key={n}
                    onClick={() => setCfg({ ...cfg, nivel: n })}
                    style={{
                      ...mono,
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 600,
                      padding: "10px 0",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `1.5px solid ${ativo ? C.realce : C.line}`,
                      background: ativo ? C.realce : C.card,
                      color: ativo ? "#fff" : C.ink,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div style={{ ...mono, fontSize: 11, color: C.sub, marginTop: 5 }}>
              {NIVEIS[cfg.nivel - 1]}
            </div>
          </div>
        </div>

        <div style={{ ...cartao, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
            NÍVEL {cfg.nivel} — {NIVEIS[cfg.nivel - 1].toUpperCase()}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>
            {NIVEL_DESCRICOES[cfg.nivel - 1]}
          </div>
        </div>

        <Botao onClick={iniciarBloco} tipo="tinta">
          Gerar bloco de {Q_POR_BLOCO} questões
        </Botao>

        {hist.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
              ÚLTIMOS BLOCOS
            </div>
            {hist.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.line}`,
                  fontSize: 13,
                }}
              >
                <span>
                  {b.materia} · {b.nivel > 0 ? `N${b.nivel}` : "banco"}
                </span>
                <span style={{ ...mono, color: b.aprovado ? C.ok : C.ink }}>
                  {b.total_acertos}/{b.total_questoes}
                </span>
              </div>
            ))}
            <Botao tipo="fantasma" style={{ marginTop: 12, fontSize: 13, padding: 9 }} onClick={onDados}>
              Ver desempenho completo
            </Botao>
          </div>
        )}
      </div>
    );
  }

  /* ---------- DRILL ---------- */
  if (tela === "drill") {
    const st = statusSub[subAtual];
    return (
      <div>
        <Rail atual={qIdx} total={Q_POR_BLOCO} />

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
              {erroApi ?? "Falha na geração."}
            </div>
            <Botao
              onClick={() => dispararSub(subAtual, c)}
              tipo="tinta"
              style={{ maxWidth: 240, margin: "0 auto" }}
            >
              Tentar de novo
            </Botao>
          </div>
        )}

        {(st === "carregando" || st === "idle") && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.sub }}>
            <div style={{ ...mono, fontSize: 13 }}>Gerando mais questões…</div>
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
            materia={c.materia}
            tagAssunto={gerarTagAssunto(c.topico || c.materia)}
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
              Abandonar este bloco? As questões já respondidas ficam gravadas; as que faltam
              (inclusive as já geradas e ainda não vistas) vão para "Refazer erradas" como
              não respondidas, em vez de se perderem.
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
  const total = acertos.reduce((a, b) => a + b, 0);
  const passou = total >= MIN_APROVACAO;
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
          {total}
          <span style={{ fontSize: 28, color: C.sub, fontWeight: 600 }}>/{Q_POR_BLOCO}</span>
        </div>
      </div>

      <div
        style={{
          background: passou ? C.okSoft : C.canetaSoft,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 18,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {passou
          ? `≥ 90% de acerto: progressão liberada. No próximo bloco desta matéria, suba a dificuldade para o nível ${Math.min(cfg.nivel + 1, 5)}.`
          : "Abaixo de 90%: pelo método Kumon, repita um novo bloco na mesma configuração (as questões serão variações inéditas dos mesmos padrões)."}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Botao tipo="tinta" onClick={iniciarBloco}>
          Novo bloco · mesma configuração
        </Botao>
        <Botao tipo="fantasma" onClick={() => setTela("config")}>
          Ajustar configuração
        </Botao>
        <Botao tipo="fantasma" onClick={onDados}>
          Ver desempenho
        </Botao>
      </div>
    </div>
  );
}

/** Mensagem dedicada quando falta credencial — evita um erro genérico. */
export function AvisoSemChave({ onAjustes }: { onAjustes: () => void }) {
  return (
    <Vazio>
      <p style={{ margin: "0 0 14px" }}>
        Para gerar questões é preciso configurar uma chave de API da Anthropic.
      </p>
      <Botao tipo="tinta" onClick={onAjustes} style={{ maxWidth: 240, margin: "0 auto" }}>
        Abrir Ajustes
      </Botao>
    </Vazio>
  );
}

export { SemCredencialError };

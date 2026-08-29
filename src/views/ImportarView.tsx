import { useRef, useState } from "react";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import Segmented from "../components/Segmented";
import QuestaoCard from "../components/QuestaoCard";
import { Vazio } from "../components/Shell";
import {
  LIMIAR_APROVACAO,
  MATERIAS,
  MATERIAS_ORDENADAS,
  TIPOS,
  type TipoId,
} from "../lib/constants";
import { extrairQuestoesDeArquivos, mensagemDeErro, normalizarQuestao, type ArquivoImportacao } from "../lib/anthropic";
import { criarBloco, fecharBloco, gravarResposta } from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import type { Questao } from "../lib/types";

type Modo = "json" | "manual" | "arquivo";

const TIPOS_ARQUIVO_ACEITOS = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

/** Lê um File como base64 puro (sem o prefixo "data:...;base64,"). */
function arquivoParaBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = String(leitor.result ?? "");
      resolve(resultado.slice(resultado.indexOf(",") + 1));
    };
    leitor.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    leitor.readAsDataURL(f);
  });
}
type Fase = "montar" | "drill" | "resultado";

const LETRAS = ["A", "B", "C", "D", "E"];

interface Draft {
  enunciado: string;
  formato: "ce" | "mc";
  /** 5 posições, texto puro sem o prefixo "A) " — o prefixo é aplicado ao montar. */
  alternativas: string[];
  gabarito: string;
  comentario: string;
  explicacoes: Record<string, string>;
  conceitos: string;
  dispositivo: string;
  tipoCobranca: TipoId | "";
}

/** JSON de exemplo do placeholder, reutilizado pelo botão "Usar exemplo". */
const JSON_EXEMPLO = `[
  {
    "enunciado": "...",
    "formato": "mc",
    "alternativas": ["A) ...","B) ...","C) ...","D) ...","E) ..."],
    "gabarito": "B",
    "comentario": "...",
    "explicacoes_erradas": {"A":"...","C":"...","D":"...","E":"..."},
    "conceitos": ["..."],
    "dispositivo": null
  }
]`;

function draftVazio(): Draft {
  return {
    enunciado: "",
    formato: "mc",
    alternativas: ["", "", "", "", ""],
    gabarito: "A",
    comentario: "",
    explicacoes: {},
    conceitos: "",
    dispositivo: "",
    tipoCobranca: "",
  };
}

/**
 * Exige que as alternativas preenchidas formem um prefixo contíguo a partir de
 * A (sem buracos no meio) — é o que garante que a letra embutida no texto
 * (`A) …`, `B) …`) bata com a letra que `normalizarQuestao` espera na posição
 * i do array. Devolve null se não houver ao menos 2 preenchidas ou se houver
 * um buraco.
 */
function alternativasSemBuraco(alts: string[]): string[] | null {
  const t = alts.map((a) => a.trim());
  let ultimo = -1;
  for (let i = t.length - 1; i >= 0; i--) {
    if (t[i]) {
      ultimo = i;
      break;
    }
  }
  if (ultimo < 1) return null;
  const prefixo = t.slice(0, ultimo + 1);
  return prefixo.some((a) => !a) ? null : prefixo;
}

function montarRawDoDraft(d: Draft): Record<string, unknown> | null {
  if (!d.enunciado.trim()) return null;
  let alternativas: string[] | null = null;
  let gabarito = d.gabarito.trim().toUpperCase();

  if (d.formato === "mc") {
    const semBuraco = alternativasSemBuraco(d.alternativas);
    if (!semBuraco) return null;
    alternativas = semBuraco.map((t, i) => `${LETRAS[i]}) ${t}`);
  } else {
    gabarito = gabarito === "E" ? "E" : "C";
  }

  return {
    enunciado: d.enunciado.trim(),
    formato: d.formato,
    alternativas,
    gabarito,
    conceitos: d.conceitos.split(",").map((s) => s.trim()).filter(Boolean),
    comentario: d.comentario.trim(),
    explicacoes_erradas: d.explicacoes,
    dispositivo: d.dispositivo.trim() || null,
    tipo_cobranca: d.tipoCobranca || undefined,
  };
}

/** Limpa cercas de código (```json … ```) que o usuário possa colar por hábito. */
function limparCercas(s: string): string {
  return s.replace(/^```json\s*|^```\s*|```\s*$/gim, "").trim();
}

/** Inverso de montarRawDoDraft — reconstrói o Draft a partir de uma Questao
 * já normalizada, para reabrir um item da fila no formulário manual (editar
 * em vez de só remover e redigitar do zero). Perde só o prefixo "A) " das
 * alternativas, que é reaplicado ao salvar de novo. */
function questaoParaDraft(q: Questao): Draft {
  const alternativas = ["", "", "", "", ""];
  (q.alternativas ?? []).forEach((alt, i) => {
    alternativas[i] = alt.replace(/^[A-E]\)\s*/, "");
  });
  return {
    enunciado: q.enunciado,
    formato: q.formato,
    alternativas,
    gabarito: q.gabarito,
    comentario: q.comentario,
    explicacoes: q.explicacoes_erradas ?? {},
    conceitos: q.conceitos.join(", "),
    dispositivo: q.dispositivo ?? "",
    tipoCobranca: q.tipo_cobranca ?? "",
  };
}

/**
 * Importar questões prontas — sem chamar a API. Duas formas de montar o
 * conjunto (JSON colado/carregado, ou um formulário manual, questão por
 * questão), que convergem no mesmo `normalizarQuestao` usado pela geração e
 * no mesmo QuestaoCard para o drill — a única diferença é a origem das
 * questões.
 */
export default function ImportarView() {
  const [fase, setFase] = useState<Fase>("montar");
  const [modo, setModo] = useState<Modo>("json");

  const [materia, setMateria] = useState<string>(MATERIAS[0]);
  const [materiaCustom, setMateriaCustom] = useState("");
  const [topico, setTopico] = useState("");

  const [jsonTexto, setJsonTexto] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Foto/PDF: extrai questões de uma prova fotografada ou escaneada numa
  // chamada à API (ver extrairQuestoesDeArquivos em lib/anthropic.ts) — a
  // alternativa a montar o JSON manualmente ou digitar questão por questão.
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [extraindo, setExtraindo] = useState(false);
  const fileArquivoRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Draft>(draftVazio());
  const [erroDraft, setErroDraft] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const [fila, setFila] = useState<Questao[]>([]);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [avisoValidacao, setAvisoValidacao] = useState<string | null>(null);

  const [blocoId, setBlocoId] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [acertos, setAcertos] = useState(0);

  const materiaFinal =
    materia === "__outra" ? materiaCustom.trim() || "Matéria personalizada" : materia;

  function validarJSON() {
    setErroGeral(null);
    setAvisoValidacao(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(limparCercas(jsonTexto));
    } catch (e) {
      setErroGeral(`JSON inválido: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const bruto = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { questoes?: unknown })?.questoes)
        ? (parsed as { questoes: unknown[] }).questoes
        : null;
    if (!bruto) {
      setErroGeral('O JSON precisa ser um array de questões, ou um objeto {"questoes": [...]}.');
      return;
    }
    const normalizadas = bruto
      .map((r) => normalizarQuestao(r, "misto"))
      .filter((q): q is Questao => q !== null);
    if (!normalizadas.length) {
      setErroGeral("Nenhuma questão válida encontrada — confira enunciado, formato e gabarito de cada item.");
      return;
    }
    if (normalizadas.length < bruto.length) {
      setAvisoValidacao(
        `${bruto.length - normalizadas.length} de ${bruto.length} item(ns) foram descartados por faltar campo obrigatório ou gabarito inválido.`,
      );
    }
    setFila(normalizadas);
  }

  function carregarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = () => setJsonTexto(String(leitor.result ?? ""));
    leitor.onerror = () => setErroGeral("Falha ao ler o arquivo.");
    leitor.readAsText(f);
    e.target.value = ""; // permite recarregar o mesmo arquivo depois de editado
  }

  function carregarArquivosParaExtrair(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? []).filter((f) => TIPOS_ARQUIVO_ACEITOS.includes(f.type));
    setArquivos((a) => [...a, ...novos]);
    e.target.value = "";
  }

  function removerArquivo(i: number) {
    setArquivos((a) => a.filter((_, k) => k !== i));
  }

  /** Converte cada arquivo em base64 e chama a API numa única requisição —
   * várias páginas da mesma prova entram juntas, o modelo já as trata como
   * um material só (ver extrairQuestoesDeArquivos). Sucesso ENFILEIRA as
   * questões extraídas às já existentes, em vez de substituir: dá para
   * juntar fotos de páginas tiradas em momentos diferentes. */
  async function extrairDeArquivos() {
    if (!arquivos.length || extraindo) return;
    setExtraindo(true);
    setErroGeral(null);
    setAvisoValidacao(null);
    try {
      const convertidos: ArquivoImportacao[] = await Promise.all(
        arquivos.map(async (f) => ({
          mediaType: f.type as ArquivoImportacao["mediaType"],
          base64: await arquivoParaBase64(f),
        })),
      );
      const extraidas = await extrairQuestoesDeArquivos(convertidos);
      setFila((fl) => [...fl, ...extraidas]);
      setArquivos([]);
      setAvisoValidacao(
        `${extraidas.length} questão${extraidas.length === 1 ? "" : "ões"} extraída${extraidas.length === 1 ? "" : "s"} — confira o gabarito de cada uma antes de responder valendo, especialmente se o material não trazia uma folha de respostas.`,
      );
    } catch (e) {
      setErroGeral(mensagemDeErro(e));
    } finally {
      setExtraindo(false);
    }
  }

  function adicionarDraft() {
    const raw = montarRawDoDraft(draft);
    if (!raw) {
      setErroDraft(
        draft.formato === "mc"
          ? "Preencha o enunciado e ao menos 2 alternativas em sequência a partir de A (sem pular nenhuma)."
          : "Preencha o enunciado.",
      );
      return;
    }
    const q = normalizarQuestao(raw, "misto");
    if (!q) {
      setErroDraft("O gabarito precisa corresponder a uma alternativa preenchida.");
      return;
    }
    setFila((f) => [...f, q]);
    setDraft(draftVazio());
    setErroDraft(null);
    setPreview(false);
  }

  function removerDaFila(i: number) {
    setFila((f) => f.filter((_, k) => k !== i));
  }

  function moverNaFila(i: number, direcao: -1 | 1) {
    setFila((f) => {
      const j = i + direcao;
      if (j < 0 || j >= f.length) return f;
      const nova = [...f];
      [nova[i], nova[j]] = [nova[j], nova[i]];
      return nova;
    });
  }

  /** Reabre um item já enfileirado no formulário manual para corrigi-lo, em
   * vez de só permitir apagar e redigitar do zero. */
  function editarDaFila(i: number) {
    setDraft(questaoParaDraft(fila[i]));
    setModo("manual");
    setPreview(false);
    setErroDraft(null);
    removerDaFila(i);
  }

  async function iniciar() {
    if (!fila.length) return;
    setErroGeral(null);
    try {
      const id = await criarBloco(
        { materia: materiaFinal, materiaCustom: "", topico, tipos: [], formato: "misto", nivel: 3 },
        fila.length,
      );
      setBlocoId(id);
      setIdx(0);
      setAcertos(0);
      setFase("drill");
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Falha ao iniciar o bloco importado.");
    }
  }

  function reiniciarFluxo() {
    setFase("montar");
    setFila([]);
    setJsonTexto("");
    setDraft(draftVazio());
    setArquivos([]);
    setErroGeral(null);
    setAvisoValidacao(null);
    setBlocoId(null);
    setPreview(false);
  }

  /* ---------- DRILL ---------- */
  if (fase === "drill") {
    const questaoAtual = fila[idx] ?? null;
    const ultima = idx === fila.length - 1;

    async function responder(letra: string, acertou: boolean, tempoMs: number): Promise<number | null> {
      if (acertou) setAcertos((a) => a + 1);
      if (!questaoAtual) return null;
      return gravarResposta({
        blocoId,
        materia: materiaFinal,
        topico,
        nivel: null,
        questao: questaoAtual,
        resposta: letra,
        acertou,
        tempoMs,
      });
    }

    async function proxima() {
      if (ultima) {
        if (blocoId != null) {
          try {
            await fecharBloco(blocoId, [acertos], acertos / fila.length >= LIMIAR_APROVACAO);
          } catch (e) {
            console.error("fechar bloco importado", e);
          }
        }
        setFase("resultado");
        return;
      }
      setIdx(idx + 1);
    }

    if (!questaoAtual) return <Vazio>Nada para responder.</Vazio>;

    return (
      <div>
        <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 14 }}>
          Importado {idx + 1}/{fila.length} · {materiaFinal}
        </div>
        <QuestaoCard
          key={idx}
          questao={questaoAtual}
          materia={materiaFinal}
          tagAssunto={gerarTagAssunto(topico || materiaFinal)}
          assunto={topico || materiaFinal}
          origem="importada"
          labelProxima={ultima ? "Ver resultado" : "Próxima questão"}
          onResponder={responder}
          onProxima={proxima}
        />
      </div>
    );
  }

  /* ---------- RESULTADO ---------- */
  if (fase === "resultado") {
    const passou = acertos / fila.length >= LIMIAR_APROVACAO;
    return (
      <div>
        <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
          <div style={{ ...mono, fontSize: 12, color: C.sub, letterSpacing: 1 }}>
            RESULTADO DA IMPORTAÇÃO
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
            <span style={{ fontSize: 28, color: C.sub, fontWeight: 600 }}>/{fila.length}</span>
          </div>
        </div>
        <Botao tipo="tinta" onClick={reiniciarFluxo} style={{ marginTop: 16 }}>
          Importar outro bloco
        </Botao>
      </div>
    );
  }

  /* ---------- MONTAR ---------- */
  const altsValidasDraft = draft.formato === "mc" ? alternativasSemBuraco(draft.alternativas) : null;
  const letrasAtuaisDraft =
    draft.formato === "ce" ? ["C", "E"] : altsValidasDraft ? altsValidasDraft.map((_, i) => LETRAS[i]) : [];
  const letrasErradasDraft = letrasAtuaisDraft.filter((l) => l !== draft.gabarito.toUpperCase());
  const rawPreview = montarRawDoDraft(draft);
  const questaoPreview = rawPreview ? normalizarQuestao(rawPreview, "misto") : null;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={rotulo}>Matéria</label>
        <select style={campo} value={materia} onChange={(e) => setMateria(e.target.value)}>
          {MATERIAS_ORDENADAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value="__outra">Outra…</option>
        </select>
        {materia === "__outra" && (
          <input
            style={{ ...campo, marginTop: 8 }}
            placeholder="Digite a matéria"
            value={materiaCustom}
            onChange={(e) => setMateriaCustom(e.target.value)}
          />
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={rotulo}>Tópico específico (opcional)</label>
        <input
          style={campo}
          placeholder="usado para a tag das notas salvas a partir destas questões"
          value={topico}
          onChange={(e) => setTopico(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Segmented
          valor={modo}
          opcoes={[
            { id: "json" as Modo, label: "JSON" },
            { id: "manual" as Modo, label: "Manual" },
            { id: "arquivo" as Modo, label: "Foto/PDF" },
          ]}
          onChange={(m) => {
            setModo(m);
            setPreview(false);
          }}
        />
      </div>

      {modo === "arquivo" ? (
        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Foto(s) ou PDF da prova</label>
          <input
            ref={fileArquivoRef}
            type="file"
            accept={TIPOS_ARQUIVO_ACEITOS.join(",")}
            multiple
            onChange={carregarArquivosParaExtrair}
            style={{ display: "none" }}
          />
          <Botao tipo="fantasma" onClick={() => fileArquivoRef.current?.click()}>
            Escolher arquivos
          </Botao>

          {arquivos.length > 0 && (
            <div style={{ ...cartao, padding: "10px 12px", marginTop: 10 }}>
              {arquivos.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "5px 0",
                    borderTop: i > 0 ? `1px solid ${C.line}` : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </span>
                  <button
                    onClick={() => removerArquivo(i)}
                    aria-label="Remover"
                    disabled={extraindo}
                    style={{
                      ...mono,
                      fontSize: 12,
                      color: C.erro,
                      background: "none",
                      border: "none",
                      cursor: extraindo ? "default" : "pointer",
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <Botao
            tipo="tinta"
            onClick={extrairDeArquivos}
            disabled={!arquivos.length || extraindo}
            style={{ marginTop: 10 }}
          >
            {extraindo ? "Extraindo questões…" : `Extrair questões (${arquivos.length})`}
          </Botao>

          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>
            Uma chamada à API lê a imagem/PDF e transcreve as questões. Se o material não trouxer
            gabarito, o modelo decide a resposta correta sozinho — confira antes de responder
            valendo. Enunciado, alternativas e conceitos vêm sempre transcritos, nunca inventados.
          </div>
        </div>
      ) : modo === "json" ? (
        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Colar ou carregar um arquivo .json</label>
          <textarea
            style={{ ...campo, ...mono, fontSize: 12.5, minHeight: 160, resize: "vertical", lineHeight: 1.5 }}
            placeholder={JSON_EXEMPLO}
            value={jsonTexto}
            onChange={(e) => setJsonTexto(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={carregarArquivo}
              style={{ display: "none" }}
            />
            <Botao tipo="fantasma" onClick={() => fileRef.current?.click()} style={{ flex: 1 }}>
              Carregar arquivo
            </Botao>
            <Botao tipo="tinta" onClick={validarJSON} disabled={!jsonTexto.trim()} style={{ flex: 1 }}>
              Validar JSON
            </Botao>
          </div>
          {!jsonTexto.trim() && (
            <button
              onClick={() => setJsonTexto(JSON_EXEMPLO)}
              style={{
                ...mono,
                marginTop: 8,
                fontSize: 11.5,
                background: "none",
                border: "none",
                color: C.caneta,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Usar exemplo
            </button>
          )}
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>
            Formato: "ce" (gabarito "C"/"E") ou "mc" (5 alternativas "A) …"–"E) …", gabarito
            "A"–"E"). Só <code style={{ ...mono, fontSize: 11 }}>enunciado</code>,{" "}
            <code style={{ ...mono, fontSize: 11 }}>formato</code> e{" "}
            <code style={{ ...mono, fontSize: 11 }}>gabarito</code> são obrigatórios.
          </div>
        </div>
      ) : (
        <div style={{ ...cartao, padding: "14px 14px 16px", marginBottom: 18 }}>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 12 }}>
            NOVA QUESTÃO
          </div>

          <label style={rotulo}>Enunciado</label>
          <textarea
            style={{ ...campo, minHeight: 80, resize: "vertical", lineHeight: 1.5, marginBottom: 12 }}
            value={draft.enunciado}
            onChange={(e) => setDraft({ ...draft, enunciado: e.target.value })}
          />

          <label style={rotulo}>Formato</label>
          <div style={{ marginBottom: 12 }}>
            <Segmented
              valor={draft.formato}
              opcoes={[
                { id: "ce" as const, label: "Certo / Errado" },
                { id: "mc" as const, label: "Múltipla escolha" },
              ]}
              onChange={(f) => setDraft({ ...draft, formato: f, gabarito: f === "ce" ? "C" : "A" })}
            />
          </div>

          {draft.formato === "mc" ? (
            <div style={{ marginBottom: 12 }}>
              <label style={rotulo}>Alternativas (preencha em sequência a partir de A)</label>
              {LETRAS.map((l, i) => (
                <input
                  key={l}
                  style={{ ...campo, marginBottom: 6 }}
                  placeholder={`Alternativa ${l}`}
                  value={draft.alternativas[i]}
                  onChange={(e) => {
                    const alt = [...draft.alternativas];
                    alt[i] = e.target.value;
                    setDraft({ ...draft, alternativas: alt });
                  }}
                />
              ))}
            </div>
          ) : null}

          <label style={rotulo}>Gabarito</label>
          <div style={{ marginBottom: 12 }}>
            {letrasAtuaisDraft.length === 0 ? (
              <div style={{ fontSize: 12.5, color: C.sub }}>Preencha as alternativas primeiro.</div>
            ) : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {letrasAtuaisDraft.map((l) => {
                  const ativo = draft.gabarito.toUpperCase() === l;
                  return (
                    <button
                      key={l}
                      onClick={() => setDraft({ ...draft, gabarito: l })}
                      style={{
                        ...mono,
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "8px 14px",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: `1.5px solid ${ativo ? C.realce : C.line}`,
                        background: ativo ? C.realce : C.card,
                        color: ativo ? "#fff" : C.ink,
                      }}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label style={rotulo}>Comentário do gabarito</label>
          <textarea
            style={{ ...campo, minHeight: 60, resize: "vertical", lineHeight: 1.5, marginBottom: 12 }}
            value={draft.comentario}
            onChange={(e) => setDraft({ ...draft, comentario: e.target.value })}
          />

          {letrasErradasDraft.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={rotulo}>Por que cada alternativa errada está errada</label>
              {letrasErradasDraft.map((l) => (
                <div key={l} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      ...mono,
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.sub,
                      minWidth: 16,
                      paddingTop: 10,
                    }}
                  >
                    {l}
                  </span>
                  <input
                    style={{ ...campo, flex: 1 }}
                    placeholder={`Erro de quem marca ${l}`}
                    value={draft.explicacoes[l] ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, explicacoes: { ...draft.explicacoes, [l]: e.target.value } })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <label style={rotulo}>Conceitos (separados por vírgula, opcional)</label>
          <input
            style={{ ...campo, marginBottom: 12 }}
            value={draft.conceitos}
            onChange={(e) => setDraft({ ...draft, conceitos: e.target.value })}
          />

          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={rotulo}>Dispositivo legal (opcional)</label>
              <input
                style={campo}
                value={draft.dispositivo}
                onChange={(e) => setDraft({ ...draft, dispositivo: e.target.value })}
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={rotulo}>Tipo de cobrança (opcional)</label>
              <select
                style={campo}
                value={draft.tipoCobranca}
                onChange={(e) => setDraft({ ...draft, tipoCobranca: e.target.value as TipoId | "" })}
              >
                <option value="">Não informar</option>
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erroDraft && (
            <div style={{ ...mono, fontSize: 12, color: C.erro, marginBottom: 10 }}>{erroDraft}</div>
          )}

          {preview && questaoPreview && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                PRÉ-VISUALIZAÇÃO — RESPONDA À VONTADE, NÃO CONTA PARA NADA
              </div>
              <QuestaoCard
                key={JSON.stringify(questaoPreview)}
                questao={questaoPreview}
                materia={materiaFinal}
                tagAssunto="preview"
                labelProxima="Fechar pré-visualização"
                onResponder={() => {}}
                onProxima={() => setPreview(false)}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Botao
              tipo="fantasma"
              onClick={() => setPreview((p) => !p)}
              disabled={!questaoPreview}
              style={{ flex: 1 }}
            >
              {preview ? "Ocultar pré-visualização" : "Pré-visualizar"}
            </Botao>
            <Botao tipo="tinta" onClick={adicionarDraft} style={{ flex: 1 }}>
              Adicionar à fila
            </Botao>
          </div>
        </div>
      )}

      {erroGeral && (
        <div
          style={{
            background: C.erroSoft,
            border: `1.5px solid ${C.erro}`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {erroGeral}
        </div>
      )}
      {avisoValidacao && (
        <div style={{ ...mono, fontSize: 11.5, color: C.sub, marginBottom: 14 }}>{avisoValidacao}</div>
      )}

      {fila.length > 0 && (
        <div style={{ ...cartao, padding: "14px", marginBottom: 18 }}>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 10 }}>
            {fila.length} {fila.length === 1 ? "QUESTÃO" : "QUESTÕES"} NA FILA
          </div>
          {fila.map((q, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "6px 0",
                borderTop: i > 0 ? `1px solid ${C.line}` : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <button
                  onClick={() => moverNaFila(i, -1)}
                  disabled={i === 0}
                  aria-label="Mover para cima"
                  style={itemFilaBotao(i === 0)}
                >
                  ▲
                </button>
                <button
                  onClick={() => moverNaFila(i, 1)}
                  disabled={i === fila.length - 1}
                  aria-label="Mover para baixo"
                  style={itemFilaBotao(i === fila.length - 1)}
                >
                  ▼
                </button>
              </div>
              <span
                style={{
                  fontSize: 13,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {i + 1}. {q.enunciado}
              </span>
              <button
                onClick={() => editarDaFila(i)}
                aria-label="Editar"
                style={{
                  ...mono,
                  fontSize: 12,
                  color: C.caneta,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                Editar
              </button>
              <button
                onClick={() => removerDaFila(i)}
                aria-label="Remover"
                style={{
                  ...mono,
                  fontSize: 12,
                  color: C.erro,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <Botao tipo="tinta" onClick={iniciar} disabled={!fila.length}>
        Iniciar bloco importado{fila.length ? ` (${fila.length} questões)` : ""}
      </Botao>
    </div>
  );
}

function itemFilaBotao(desabilitado: boolean) {
  return {
    fontSize: 9,
    lineHeight: "9px",
    color: desabilitado ? C.line : C.sub,
    background: "none",
    border: "none",
    cursor: desabilitado ? "default" : "pointer",
    padding: 2,
  } as const;
}

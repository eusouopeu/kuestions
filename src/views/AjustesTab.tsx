import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { C, campo, cartao, mono, rotulo } from "../theme";
import Shell from "../components/Shell";
import Botao from "../components/Botao";
import Segmented from "../components/Segmented";
import {
  getApiKey,
  getProxyUrl,
  pareceApiKey,
  setApiKey,
  setProxyUrl,
} from "../lib/secure";
import { MODEL } from "../lib/anthropic";
import { getComExplicacoesIA, setComExplicacoesIA } from "../lib/preferenciasGeracao";
import { exportarBancoJSON, importarBancoJSON } from "../lib/db";
import { exportarArquivo } from "../lib/exportar";
import { getTema, setTema, type Tema } from "../lib/tema";
import {
  exportarParaMesclagem,
  listarReportadas,
  mesclarBackup,
  MOTIVOS_REPORT,
  resolverReport,
  resumo,
  type QuestaoReportada,
  type ResultadoMesclagem,
} from "../lib/repo";
import {
  getConfigLembrete,
  lembreteDisponivel,
  setConfigLembrete,
  type ConfigLembrete,
} from "../lib/lembretes";
import { diasDesdeUltimoBackup, DIAS_PARA_AVISO_BACKUP, registrarBackupFeito } from "../lib/backupInfo";
import { sincronizarDocumentos } from "../lib/exportarDocumentos";
import { Capacitor } from "@capacitor/core";
import { isTauri } from "@tauri-apps/api/core";
import {
  getConfigMeta,
  getMetasPorMateria,
  setConfigMeta,
  setMetasPorMateria,
  type ConfigMeta,
} from "../lib/metas";
import {
  getPesosEdital,
  pesoDe,
  PESO_MAX,
  PESO_PADRAO,
  PRESETS_PESO_EDITAL,
  setPesosEdital,
  type PesosEdital,
} from "../lib/edital";
import { MATERIAS } from "../lib/constants";
import { AREAS_BANCO } from "../lib/banco";

/** Matérias/áreas cujo peso no edital pode ser configurado: união das
 * matérias de geração (MATERIAS) com as áreas do banco de questões reais
 * (AREAS_BANCO) — os rótulos nem sempre batem 1:1 entre os dois (ver
 * comentário em lib/banco.ts), então a união cobre nota estimada e simulado
 * sem exigir que o usuário configure a mesma matéria duas vezes. */
const MATERIAS_E_AREAS: string[] = [...new Set([...MATERIAS, ...AREAS_BANCO])].sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function labelMotivo(id: string | null): string {
  return MOTIVOS_REPORT.find((m) => m.id === id)?.label ?? "Motivo não informado";
}

/**
 * Configuração da credencial. A chave é digitada pelo usuário e guardada
 * localmente (Preferences → SharedPreferences/UserDefaults do app). Nunca vai
 * para o bundle nem sai do aparelho, exceto na chamada à própria API.
 */
export default function AjustesTab({ ativa }: { ativa: boolean }) {
  const [chave, setChave] = useState("");
  const [proxy, setProxy] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [status, setStatus] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [carregado, setCarregado] = useState(false);

  const [tema, setTemaLocal] = useState<Tema>("sistema");
  const [exportandoBackup, setExportandoBackup] = useState(false);
  const [backupExportado, setBackupExportado] = useState(false);
  const [arquivoRestauro, setArquivoRestauro] = useState<File | null>(null);
  const [confirmacaoRestauro, setConfirmacaoRestauro] = useState("");
  const [restaurando, setRestaurando] = useState(false);
  const [statusBackup, setStatusBackup] = useState<{ tom: "ok" | "erro"; texto: string } | null>(
    null,
  );
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  // Mesclagem entre aparelhos (rec. 9 — "sync"): diferente de exportar/
  // restaurar backup (que SUBSTITUI tudo), aqui o conteúdo de outro aparelho
  // é inserido sem apagar nada local — ver mesclarBackup em repo.ts.
  const [exportandoMesclagem, setExportandoMesclagem] = useState(false);
  const [mesclagemExportada, setMesclagemExportada] = useState(false);
  const [arquivoMesclagem, setArquivoMesclagem] = useState<File | null>(null);
  const [mesclando, setMesclando] = useState(false);
  const [resultadoMesclagem, setResultadoMesclagem] = useState<ResultadoMesclagem | null>(null);
  const inputMesclagemRef = useRef<HTMLInputElement>(null);

  const [sincronizandoDocs, setSincronizandoDocs] = useState(false);
  const [docsSincronizados, setDocsSincronizados] = useState(false);

  const [reportadas, setReportadas] = useState<QuestaoReportada[]>([]);
  const [carregandoReportadas, setCarregandoReportadas] = useState(true);
  const [resolvendo, setResolvendo] = useState<number | null>(null);

  const [lembrete, setLembreteLocal] = useState<ConfigLembrete>({ ativo: false, hora: 19 });
  const [salvandoLembrete, setSalvandoLembrete] = useState(false);
  const [erroLembrete, setErroLembrete] = useState<string | null>(null);

  const [meta, setMetaLocal] = useState<ConfigMeta>({ ativa: false, blocosPorSemana: 3 });
  const [metasPorMateria, setMetasPorMateriaLocal] = useState<Record<string, number>>({});
  const [materiaParaAdicionar, setMateriaParaAdicionar] = useState("");
  const [pesos, setPesosLocal] = useState<PesosEdital>({});
  const [presetPeso, setPresetPeso] = useState("");

  const [diasBackup, setDiasBackup] = useState<number | null>(null);
  const [temDados, setTemDados] = useState(false);

  const [comExplicacoesIA, setComExplicacoesIALocal] = useState(true);

  useEffect(() => {
    Promise.all([getApiKey(), getProxyUrl()])
      .then(([k, p]) => {
        setChave(k);
        setProxy(p);
      })
      .finally(() => setCarregado(true));
    getTema().then(setTemaLocal);
    getConfigLembrete().then(setLembreteLocal);
    getConfigMeta().then(setMetaLocal);
    getMetasPorMateria().then(setMetasPorMateriaLocal);
    getPesosEdital().then(setPesosLocal);
    getComExplicacoesIA().then(setComExplicacoesIALocal);
  }, []);

  async function alternarComExplicacoesIA(v: boolean) {
    setComExplicacoesIALocal(v);
    await setComExplicacoesIA(v);
  }

  useEffect(() => {
    if (!ativa) return;
    diasDesdeUltimoBackup().then(setDiasBackup);
    resumo(null)
      .then((r) => setTemDados(r.totalQuestoes > 0 || r.conceitosSalvos > 0))
      .catch(() => setTemDados(false));
  }, [ativa]);

  // Recarrega toda vez que a aba é reaberta — um report feito em Questões
  // (outra aba, que fica montada em paralelo, ver App.tsx) só apareceria
  // aqui depois de um refresh manual sem isto.
  useEffect(() => {
    if (!ativa) return;
    setCarregandoReportadas(true);
    listarReportadas()
      .then(setReportadas)
      .catch(() => setReportadas([]))
      .finally(() => setCarregandoReportadas(false));
  }, [ativa]);

  async function resolver(id: number) {
    setResolvendo(id);
    try {
      await resolverReport(id);
      setReportadas((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      console.error("resolver report", e);
    } finally {
      setResolvendo(null);
    }
  }

  async function salvar() {
    const k = chave.trim();
    const p = proxy.trim();

    if (!k && !p) {
      setStatus({ tom: "erro", texto: "Informe uma chave de API ou uma URL de backend." });
      return;
    }
    if (k && !pareceApiKey(k)) {
      setStatus({
        tom: "erro",
        texto: "A chave não parece válida — deve começar com sk-ant-.",
      });
      return;
    }
    if (p && !/^https:\/\//i.test(p)) {
      setStatus({ tom: "erro", texto: "A URL do backend precisa usar https://." });
      return;
    }

    try {
      await Promise.all([setApiKey(k), setProxyUrl(p)]);
      setStatus({ tom: "ok", texto: "Salvo. Já pode gerar questões." });
    } catch {
      setStatus({ tom: "erro", texto: "Falha ao guardar a credencial." });
    }
  }

  async function limpar() {
    await Promise.all([setApiKey(""), setProxyUrl("")]);
    setChave("");
    setProxy("");
    setStatus({ tom: "ok", texto: "Credenciais removidas do aparelho." });
  }

  async function alternarLembrete(ativo: boolean) {
    setSalvandoLembrete(true);
    setErroLembrete(null);
    try {
      const ok = await setConfigLembrete({ ...lembrete, ativo });
      if (ok) setLembreteLocal((c) => ({ ...c, ativo }));
      else
        setErroLembrete(
          ativo
            ? "Permissão de notificação negada — ative nas configurações do aparelho."
            : "Falha ao desligar o lembrete.",
        );
    } finally {
      setSalvandoLembrete(false);
    }
  }

  async function mudarHoraLembrete(hora: number) {
    setLembreteLocal((c) => ({ ...c, hora }));
    if (!lembrete.ativo) return; // só reagenda se já estiver ligado
    setSalvandoLembrete(true);
    setErroLembrete(null);
    try {
      const ok = await setConfigLembrete({ ativo: true, hora });
      if (!ok) setErroLembrete("Falha ao reagendar o lembrete.");
    } finally {
      setSalvandoLembrete(false);
    }
  }

  async function mudarMeta(novo: ConfigMeta) {
    setMetaLocal(novo);
    try {
      await setConfigMeta(novo);
    } catch (e) {
      console.error("salvar meta semanal", e);
    }
  }

  async function salvarMetasPorMateria(novo: Record<string, number>) {
    setMetasPorMateriaLocal(novo);
    try {
      await setMetasPorMateria(novo);
    } catch (e) {
      console.error("salvar meta por matéria", e);
    }
  }

  function adicionarMetaMateria() {
    const m = materiaParaAdicionar;
    if (!m || m in metasPorMateria) return;
    setMateriaParaAdicionar("");
    salvarMetasPorMateria({ ...metasPorMateria, [m]: 3 });
  }

  function removerMetaMateria(m: string) {
    const { [m]: _removida, ...resto } = metasPorMateria;
    salvarMetasPorMateria(resto);
  }

  async function mudarPeso(materia: string, peso: number) {
    const novo = { ...pesos, [materia]: peso };
    setPesosLocal(novo);
    try {
      await setPesosEdital(novo);
    } catch (e) {
      console.error("salvar peso do edital", e);
    }
  }

  /** Preenche o peso de cada matéria a partir de um dos presets de concurso
   * (mesmos usados em SimuladoView → "Peso das matérias") — deixa explícito
   * qual é o peso de cada matéria em cada edital, e ainda dá o ponto de
   * partida para o usuário ajustar manualmente depois. */
  async function aplicarPresetPeso(id: string) {
    setPresetPeso(id);
    const preset = PRESETS_PESO_EDITAL.find((p) => p.id === id);
    if (!preset) return;
    const novo = Object.fromEntries(MATERIAS_E_AREAS.map((m) => [m, pesoDe(preset.pesos, m)]));
    setPesosLocal(novo);
    try {
      await setPesosEdital(novo);
    } catch (e) {
      console.error("aplicar preset de peso do edital", e);
    }
  }

  async function trocarTema(t: Tema) {
    setTemaLocal(t);
    await setTema(t);
  }

  async function exportarBackup() {
    if (exportandoBackup) return;
    setExportandoBackup(true);
    setStatusBackup(null);
    setBackupExportado(false);
    try {
      const json = await exportarBancoJSON();
      const data = new Date().toISOString().slice(0, 10);
      await exportarArquivo(`kuestions-backup-${data}.json`, json, "application/json");
      await registrarBackupFeito();
      setDiasBackup(0);
      setBackupExportado(true);
      setTimeout(() => setBackupExportado(false), 2500);
    } catch (e) {
      setStatusBackup({
        tom: "erro",
        texto: e instanceof Error ? e.message : "Falha ao gerar o backup.",
      });
    } finally {
      setExportandoBackup(false);
    }
  }

  async function sincronizarComDocumentos() {
    if (sincronizandoDocs) return;
    setSincronizandoDocs(true);
    setDocsSincronizados(false);
    try {
      await sincronizarDocumentos();
      setDocsSincronizados(true);
      setTimeout(() => setDocsSincronizados(false), 2500);
    } catch (e) {
      setStatusBackup({
        tom: "erro",
        texto: e instanceof Error ? e.message : "Falha ao sincronizar com Documentos.",
      });
    } finally {
      setSincronizandoDocs(false);
    }
  }

  function escolherArquivoRestauro(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (f) {
      setStatusBackup(null);
      setConfirmacaoRestauro("");
      setArquivoRestauro(f);
    }
  }

  async function confirmarRestauro() {
    if (!arquivoRestauro || restaurando || confirmacaoRestauro.trim().toUpperCase() !== "RESTAURAR")
      return;
    setRestaurando(true);
    try {
      const texto = await arquivoRestauro.text();
      await importarBancoJSON(texto);
      // Todas as abas guardam listas em memória (blocos, notas, gráficos);
      // recarregar é o jeito simples e seguro de todas lerem o banco novo.
      location.reload();
    } catch (e) {
      setStatusBackup({
        tom: "erro",
        texto: e instanceof Error ? e.message : "Falha ao restaurar o backup.",
      });
      setRestaurando(false);
      setArquivoRestauro(null);
    }
  }

  async function exportarMesclagem() {
    if (exportandoMesclagem) return;
    setExportandoMesclagem(true);
    setStatusBackup(null);
    setMesclagemExportada(false);
    try {
      const json = await exportarParaMesclagem();
      const data = new Date().toISOString().slice(0, 10);
      await exportarArquivo(`kuestions-mesclar-${data}.json`, json, "application/json");
      setMesclagemExportada(true);
      setTimeout(() => setMesclagemExportada(false), 2500);
    } catch (e) {
      setStatusBackup({
        tom: "erro",
        texto: e instanceof Error ? e.message : "Falha ao gerar o arquivo para mesclar.",
      });
    } finally {
      setExportandoMesclagem(false);
    }
  }

  function escolherArquivoMesclagem(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) {
      setStatusBackup(null);
      setResultadoMesclagem(null);
      setArquivoMesclagem(f);
    }
  }

  async function confirmarMesclagem() {
    if (!arquivoMesclagem || mesclando) return;
    setMesclando(true);
    setStatusBackup(null);
    try {
      const texto = await arquivoMesclagem.text();
      const resultado = await mesclarBackup(texto);
      setResultadoMesclagem(resultado);
      setArquivoMesclagem(null);
    } catch (e) {
      setStatusBackup({
        tom: "erro",
        texto: e instanceof Error ? e.message : "Falha ao mesclar o arquivo.",
      });
    } finally {
      setMesclando(false);
    }
  }

  return (
    <Shell titulo="Ajustes">
      <div style={{ marginBottom: 18 }}>
        <label style={rotulo}>Tema</label>
        <Segmented
          valor={tema}
          opcoes={[
            { id: "sistema" as Tema, label: "Sistema" },
            { id: "claro" as Tema, label: "Claro" },
            { id: "escuro" as Tema, label: "Escuro" },
          ]}
          onChange={trocarTema}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={rotulo}>Chave de API da Anthropic</label>
        <input
          style={{ ...campo, ...mono, fontSize: 13 }}
          type={visivel ? "text" : "password"}
          placeholder="sk-ant-…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={chave}
          onChange={(e) => {
            setChave(e.target.value);
            setStatus(null);
          }}
        />
        <button
          onClick={() => setVisivel((v) => !v)}
          style={{
            ...mono,
            marginTop: 6,
            fontSize: 11,
            background: "none",
            border: "none",
            color: C.caneta,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {visivel ? "Ocultar" : "Mostrar"} chave
        </button>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
          Gere uma chave em console.anthropic.com → API Keys. Ela fica guardada apenas neste
          aparelho e é enviada só para a API da Anthropic.
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={rotulo}>Backend próprio (opcional)</label>
        <input
          style={{ ...campo, ...mono, fontSize: 13 }}
          placeholder="https://meu-worker.workers.dev"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={proxy}
          onChange={(e) => {
            setProxy(e.target.value);
            setStatus(null);
          }}
        />
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
          Se preenchido, o app fala com esta URL em vez de api.anthropic.com — o backend precisa
          expor <code style={{ ...mono, fontSize: 12 }}>/v1/messages</code>. Deixe vazio para usar a
          chave acima diretamente. Veja <code style={{ ...mono, fontSize: 12 }}>proxy/</code> no
          repositório.
        </div>
      </div>

      {status && (
        <div
          style={{
            background: status.tom === "ok" ? C.okSoft : C.erroSoft,
            border: `1.5px solid ${status.tom === "ok" ? C.ok : C.erro}`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {status.texto}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Botao tipo="tinta" onClick={salvar} disabled={!carregado}>
          Salvar
        </Botao>
        {(chave || proxy) && (
          <Botao tipo="fantasma" onClick={limpar} style={{ color: C.erro }}>
            Remover credenciais
          </Botao>
        )}
      </div>

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 22 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          BACKUP
        </div>
        {temDados && (diasBackup === null || diasBackup >= DIAS_PARA_AVISO_BACKUP) && (
          <div
            style={{
              background: C.canetaSoft,
              border: `1.5px solid ${C.caneta}`,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12.5,
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            {diasBackup === null
              ? "Você ainda não exportou nenhum backup."
              : `Já fazem ${diasBackup} dias desde o último backup.`}{" "}
            Considere exportar agora.
          </div>
        )}

        {statusBackup && (
          <div
            style={{
              background: statusBackup.tom === "ok" ? C.okSoft : C.erroSoft,
              border: `1.5px solid ${statusBackup.tom === "ok" ? C.ok : C.erro}`,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {statusBackup.texto}
          </div>
        )}

        {arquivoRestauro ? (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Restaurar <strong>{arquivoRestauro.name}</strong> substitui TODOS os dados atuais
              (blocos, respostas e notas) pelo conteúdo do arquivo. Não há como desfazer.
            </div>
            <label style={{ ...rotulo, color: C.erro }}>
              Digite RESTAURAR para confirmar
            </label>
            <input
              style={{ ...campo, ...mono, fontSize: 13, borderColor: C.erro, marginBottom: 12 }}
              value={confirmacaoRestauro}
              onChange={(e) => setConfirmacaoRestauro(e.target.value)}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="RESTAURAR"
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => {
                  setArquivoRestauro(null);
                  setConfirmacaoRestauro("");
                }}
                disabled={restaurando}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={confirmarRestauro}
                disabled={restaurando || confirmacaoRestauro.trim().toUpperCase() !== "RESTAURAR"}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                {restaurando ? "Restaurando…" : "Restaurar e substituir"}
              </Botao>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Botao
              tipo="fantasma"
              onClick={exportarBackup}
              disabled={exportandoBackup}
              style={backupExportado ? { borderColor: C.ok, color: C.ok } : undefined}
            >
              {exportandoBackup
                ? "Gerando backup…"
                : backupExportado
                  ? "✓ Backup exportado"
                  : "Exportar backup completo"}
            </Botao>
            <Botao tipo="fantasma" onClick={() => inputArquivoRef.current?.click()}>
              Restaurar de um arquivo
            </Botao>
            <input
              ref={inputArquivoRef}
              type="file"
              accept="application/json,.json"
              onChange={escolherArquivoRestauro}
              style={{ display: "none" }}
            />
          </div>
        )}
      </div>

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          MESCLAR ENTRE APARELHOS
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>
          Diferente de restaurar um backup (que substitui tudo), mesclar ADICIONA o conteúdo do
          arquivo sem apagar nada daqui — exporte deste aparelho, mescle no outro (e vice-versa) para
          manter os dois com o histórico completo.
        </div>

        {resultadoMesclagem && (
          <div
            style={{
              background: C.okSoft,
              border: `1.5px solid ${C.ok}`,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            Mesclado: {resultadoMesclagem.blocosNovos} bloco{resultadoMesclagem.blocosNovos === 1 ? "" : "s"},{" "}
            {resultadoMesclagem.questoesNovas} questão{resultadoMesclagem.questoesNovas === 1 ? "" : "ões"}{" "}
            respondida{resultadoMesclagem.questoesNovas === 1 ? "" : "s"}, {resultadoMesclagem.notasNovas} nota
            {resultadoMesclagem.notasNovas === 1 ? "" : "s"} e {resultadoMesclagem.explicacoesNovas} explicação
            {resultadoMesclagem.explicacoesNovas === 1 ? "" : "ões"} nova{resultadoMesclagem.explicacoesNovas === 1 ? "" : "s"} — nada foi apagado.
          </div>
        )}

        {arquivoMesclagem ? (
          <div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Mesclar <strong>{arquivoMesclagem.name}</strong> aqui — o que já existir (mesmo
              conteúdo) é ignorado, o resto é adicionado.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setArquivoMesclagem(null)}
                disabled={mesclando}
                style={{ background: C.card, flex: 1 }}
              >
                Cancelar
              </Botao>
              <Botao onClick={confirmarMesclagem} disabled={mesclando} style={{ flex: 1 }}>
                {mesclando ? "Mesclando…" : "Mesclar"}
              </Botao>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Botao
              tipo="fantasma"
              onClick={exportarMesclagem}
              disabled={exportandoMesclagem}
              style={mesclagemExportada ? { borderColor: C.ok, color: C.ok } : undefined}
            >
              {exportandoMesclagem
                ? "Gerando…"
                : mesclagemExportada
                  ? "✓ Exportado"
                  : "Exportar para mesclar em outro aparelho"}
            </Botao>
            <Botao tipo="fantasma" onClick={() => inputMesclagemRef.current?.click()}>
              Mesclar de um arquivo
            </Botao>
            <input
              ref={inputMesclagemRef}
              type="file"
              accept="application/json,.json"
              onChange={escolherArquivoMesclagem}
              style={{ display: "none" }}
            />
          </div>
        )}
      </div>

      {(Capacitor.isNativePlatform() || isTauri()) && (
        <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
            PASTA NO APARELHO
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>
            Mantém uma cópia legível em Documentos/kuestion: o banco de questões em JSON e cada
            nota em Markdown, separadas por matéria — para abrir fora do app, com qualquer leitor
            de arquivos. Atualiza sozinha a cada bloco fechado e a cada nota salva.
          </div>
          <Botao
            tipo="fantasma"
            onClick={sincronizarComDocumentos}
            disabled={sincronizandoDocs}
            style={docsSincronizados ? { borderColor: C.ok, color: C.ok } : undefined}
          >
            {sincronizandoDocs
              ? "Sincronizando…"
              : docsSincronizados
                ? "✓ Sincronizado"
                : "Sincronizar agora"}
          </Botao>
        </div>
      )}

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          LEMBRETE DIÁRIO
        </div>
        {lembreteDisponivel && (
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>
            Uma notificação por dia, no horário abaixo, para manter a sequência de prática.
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 13.5 }}>Avisar todo dia</span>
          <button
            role="switch"
            aria-checked={lembrete.ativo}
            disabled={!lembreteDisponivel || salvandoLembrete}
            onClick={() => alternarLembrete(!lembrete.ativo)}
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              border: "none",
              padding: 3,
              display: "flex",
              justifyContent: lembrete.ativo ? "flex-end" : "flex-start",
              background: lembrete.ativo ? C.caneta : C.line,
              cursor: !lembreteDisponivel || salvandoLembrete ? "default" : "pointer",
              opacity: !lembreteDisponivel ? 0.5 : 1,
              transition: "background 0.15s",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: C.card,
              }}
            />
          </button>
        </div>

        {lembrete.ativo && (
          <div style={{ marginTop: 12 }}>
            <label style={rotulo}>Horário</label>
            <select
              style={campo}
              value={lembrete.hora}
              disabled={salvandoLembrete}
              onChange={(e) => mudarHoraLembrete(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        )}

        {erroLembrete && (
          <div style={{ ...mono, fontSize: 11.5, color: C.erro, marginTop: 10 }}>{erroLembrete}</div>
        )}
      </div>

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          META SEMANAL
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 13.5 }}>Acompanhar meta</span>
          <button
            role="switch"
            aria-checked={meta.ativa}
            onClick={() => mudarMeta({ ...meta, ativa: !meta.ativa })}
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              border: "none",
              padding: 3,
              display: "flex",
              justifyContent: meta.ativa ? "flex-end" : "flex-start",
              background: meta.ativa ? C.caneta : C.line,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.card }} />
          </button>
        </div>

        {meta.ativa && (
          <div style={{ marginTop: 12 }}>
            <label style={rotulo}>Blocos por semana</label>
            <select
              style={campo}
              value={meta.blocosPorSemana}
              onChange={(e) => mudarMeta({ ...meta, blocosPorSemana: Number(e.target.value) })}
            >
              {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} bloco{n === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          METAS POR MATÉRIA
        </div>
        {Object.keys(metasPorMateria).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {Object.entries(metasPorMateria).map(([m, blocos]) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, flex: 1 }}>{m}</span>
                <select
                  style={{ ...campo, ...mono, fontSize: 12, width: "auto", padding: "6px 8px" }}
                  value={blocos}
                  onChange={(e) =>
                    salvarMetasPorMateria({ ...metasPorMateria, [m]: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} bloco{n === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removerMetaMateria(m)}
                  aria-label={`Remover meta de ${m}`}
                  style={{
                    ...mono,
                    fontSize: 13,
                    background: "none",
                    border: "none",
                    color: C.erro,
                    cursor: "pointer",
                    padding: "4px 6px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <select
            style={campo}
            value={materiaParaAdicionar}
            onChange={(e) => setMateriaParaAdicionar(e.target.value)}
          >
            <option value="">Escolher matéria…</option>
            {MATERIAS.filter((m) => !(m in metasPorMateria)).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Botao
            tipo="fantasma"
            onClick={adicionarMetaMateria}
            disabled={!materiaParaAdicionar}
            style={{ maxWidth: 100 }}
          >
            Adicionar
          </Botao>
        </div>
      </div>

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          PESO DO EDITAL
        </div>

        <label style={{ ...rotulo, marginTop: 4 }}>Preencher a partir de um edital</label>
        <select
          style={{ ...campo, marginBottom: 12 }}
          value={presetPeso}
          onChange={(e) => aplicarPresetPeso(e.target.value)}
        >
          <option value="" disabled>
            Escolher um concurso…
          </option>
          {PRESETS_PESO_EDITAL.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {MATERIAS_E_AREAS.map((m) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, flex: 1 }}>{m}</span>
              <select
                style={{ ...campo, ...mono, fontSize: 12, width: "auto", padding: "6px 8px" }}
                value={pesos[m] ?? PESO_PADRAO}
                onChange={(e) => mudarPeso(m, Number(e.target.value))}
              >
                {Array.from({ length: PESO_MAX + 1 }, (_, n) => n).map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Não cai" : `Peso ${n}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...cartao, padding: "14px 16px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          QUESTÕES REPORTADAS{reportadas.length > 0 ? ` · ${reportadas.length}` : ""}
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: reportadas.length ? 12 : 0 }}>
          Questões que você sinalizou como erradas (enunciado ou gabarito), para revisar e depois
          corrigir na fonte.
        </div>
        {carregandoReportadas ? (
          <div style={{ fontSize: 13, color: C.sub }}>Carregando…</div>
        ) : reportadas.length === 0 ? null : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reportadas.map((r) => (
              <div
                key={r.id}
                style={{
                  border: `1.5px solid ${C.line}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ ...mono, fontSize: 10.5, color: C.erro, letterSpacing: 0.5 }}>
                    {r.materia.toUpperCase()} · {labelMotivo(r.motivo_report)}
                  </span>
                  <span style={{ ...mono, fontSize: 10.5, color: C.sub, flexShrink: 0 }}>
                    {dataCurta(r.ts)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.45,
                    margin: "0 0 8px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {r.enunciado}
                </p>
                <button
                  onClick={() => resolver(r.id)}
                  disabled={resolvendo === r.id}
                  style={{
                    ...mono,
                    fontSize: 11,
                    background: "none",
                    border: "none",
                    color: C.caneta,
                    cursor: resolvendo === r.id ? "default" : "pointer",
                    padding: 0,
                  }}
                >
                  {resolvendo === r.id ? "Marcando…" : "Marcar como resolvido"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...cartao, padding: "12px 14px", marginTop: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          GERAÇÃO
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13.5 }}>Explicações de IA na geração</div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>
              {comExplicacoesIA
                ? "Cada questão já sai com comentário e explicação de cada alternativa errada."
                : "Questões saem sem explicação — depois de responder, escolha só as alternativas que quer entender e peça a explicação na hora, mais aprofundada e mais barata."}
            </div>
          </div>
          <button
            role="switch"
            aria-checked={comExplicacoesIA}
            onClick={() => alternarComExplicacoesIA(!comExplicacoesIA)}
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              border: "none",
              padding: 3,
              flexShrink: 0,
              display: "flex",
              justifyContent: comExplicacoesIA ? "flex-end" : "flex-start",
              background: comExplicacoesIA ? C.caneta : C.line,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.card }} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 10 }}>
          Vale para blocos gerados com IA e para o banco de questões reais — configurado uma vez,
          continua valendo para os próximos blocos.
        </div>

        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
          Modelo: <code style={{ ...mono, fontSize: 12, color: C.ink }}>{MODEL}</code>
          <br />
          Raciocínio adaptativo com esforço médio, equilibrando a autoverificação factual do
          conteúdo jurídico e contábil com custo e latência por chamada.
        </div>
      </div>
    </Shell>
  );
}

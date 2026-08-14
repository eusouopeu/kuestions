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
import { exportarBancoJSON, importarBancoJSON } from "../lib/db";
import { exportarArquivo } from "../lib/exportar";
import { getTema, setTema, type Tema } from "../lib/tema";
import {
  listarReportadas,
  MOTIVOS_REPORT,
  resolverReport,
  resumo,
  type QuestaoReportada,
} from "../lib/repo";
import {
  getConfigLembrete,
  lembreteDisponivel,
  setConfigLembrete,
  type ConfigLembrete,
} from "../lib/lembretes";
import { diasDesdeUltimoBackup, DIAS_PARA_AVISO_BACKUP, registrarBackupFeito } from "../lib/backupInfo";
import { getConfigMeta, setConfigMeta, type ConfigMeta } from "../lib/metas";

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

  const [reportadas, setReportadas] = useState<QuestaoReportada[]>([]);
  const [carregandoReportadas, setCarregandoReportadas] = useState(true);
  const [resolvendo, setResolvendo] = useState<number | null>(null);

  const [lembrete, setLembreteLocal] = useState<ConfigLembrete>({ ativo: false, hora: 19 });
  const [salvandoLembrete, setSalvandoLembrete] = useState(false);
  const [erroLembrete, setErroLembrete] = useState<string | null>(null);

  const [meta, setMetaLocal] = useState<ConfigMeta>({ ativa: false, blocosPorSemana: 3 });

  const [diasBackup, setDiasBackup] = useState<number | null>(null);
  const [temDados, setTemDados] = useState(false);

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
  }, []);

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

  return (
    <Shell kicker="CONFIGURAÇÃO" titulo="Ajustes">
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
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>
          Blocos, respostas e notas vivem só neste aparelho. Exporte de vez em quando — sem
          backup, uma reinstalação ou troca de aparelho apaga tudo.
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
          LEMBRETE DIÁRIO
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>
          {lembreteDisponivel
            ? "Uma notificação por dia, no horário abaixo, para manter a sequência de prática."
            : "Notificação disponível só no aplicativo instalado (Android/iOS) — não funciona no navegador."}
        </div>

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
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>
          Quantos blocos (de qualquer origem) responder por semana — a semana reinicia toda
          segunda-feira. O progresso aparece no topo da aba Questões.
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
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
          Modelo: <code style={{ ...mono, fontSize: 12, color: C.ink }}>{MODEL}</code>
          <br />
          Raciocínio adaptativo com esforço médio, equilibrando a autoverificação factual do
          conteúdo jurídico e contábil com custo e latência por chamada.
        </div>
      </div>
    </Shell>
  );
}

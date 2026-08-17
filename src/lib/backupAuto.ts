/**
 * Backup automático rotativo: em vez de depender do usuário lembrar de tocar
 * em "Exportar" (ver `exportarBancoJSON` em db.ts e AjustesTab), grava um
 * snapshot do banco inteiro a cada `N_BLOCOS_PARA_BACKUP` blocos fechados,
 * guardando só os últimos `MAX_SNAPSHOTS` — protege meses de histórico de
 * erros e notas de uma desinstalação acidental sem exigir disciplina manual.
 *
 * Só roda no nativo (Android/iOS): é o cenário que motiva isto (perder o app
 * do celular); no navegador de desenvolvimento o sandbox de arquivos não tem
 * o mesmo valor de proteção contra perda de dados.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { exportarBancoJSON } from "./db";
import { registrarBackupFeito } from "./backupInfo";

const PASTA = "backups-auto";
const N_BLOCOS_PARA_BACKUP = 5;
const MAX_SNAPSHOTS = 5;
const K_CONTADOR = "blocos-desde-backup-auto";

async function lerContador(): Promise<number> {
  const { value } = await Preferences.get({ key: K_CONTADOR });
  return value ? Number(value) : 0;
}

async function salvarContador(n: number): Promise<void> {
  await Preferences.set({ key: K_CONTADOR, value: String(n) });
}

async function fazerSnapshot(): Promise<void> {
  const json = await exportarBancoJSON();
  await Filesystem.mkdir({ path: PASTA, directory: Directory.Data, recursive: true }).catch(() => {
    // já existe — mkdir com recursive:true nem sempre é idempotente em todo device.
  });
  await Filesystem.writeFile({
    path: `${PASTA}/backup-${Date.now()}.json`,
    data: json,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });

  // Mantém só os MAX_SNAPSHOTS mais recentes — o nome (timestamp) já ordena
  // cronologicamente por ordem alfabética.
  const { files } = await Filesystem.readdir({ path: PASTA, directory: Directory.Data });
  const ordenados = files.filter((f) => f.type === "file").sort((a, b) => a.name.localeCompare(b.name));
  const excedentes = ordenados.slice(0, Math.max(0, ordenados.length - MAX_SNAPSHOTS));
  for (const f of excedentes) {
    await Filesystem.deleteFile({ path: `${PASTA}/${f.name}`, directory: Directory.Data }).catch(() => {});
  }

  await registrarBackupFeito();
}

/**
 * Chamado ao fechar qualquer bloco (ver `fecharBloco` em repo.ts). Nunca
 * lança — uma falha de backup automático não pode travar o fechamento do
 * bloco em si, que é a ação que o usuário realmente pediu.
 */
export async function talvezFazerBackupAutomatico(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const atual = (await lerContador()) + 1;
    if (atual >= N_BLOCOS_PARA_BACKUP) {
      await fazerSnapshot();
      await salvarContador(0);
    } else {
      await salvarContador(atual);
    }
  } catch (e) {
    console.error("backup automático", e);
  }
}

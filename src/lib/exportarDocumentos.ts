/**
 * Espelha os dados do usuário numa pasta "kuestion" visível em Documentos do
 * aparelho — celular (`@capacitor/filesystem`, `Directory.Documents`) ou
 * desktop (`@tauri-apps/plugin-fs`, `BaseDirectory.Document`). Diferente do
 * backup completo (ver `exportarBancoJSON` em db.ts e o snapshot rotativo em
 * backupAuto.ts), que é um único JSON opaco pensado só para restaurar dentro
 * do próprio app, aqui o formato é para ser lido (ou importado) FORA do app:
 * o banco de questões em JSON, as notas em TSV+HTML — um arquivo por
 * matéria, um pronto para o import de texto do Anki (`#separator:tab`,
 * `#html:true`, tags na 2ª coluna).
 *
 * Usa `all()` de db.ts diretamente (não repo.ts) para não criar um ciclo de
 * import: repo.ts também depende deste módulo (via backupAuto.ts) para
 * disparar a sincronização a cada bloco fechado e a cada nota salva/editada/
 * apagada.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { isTauri } from "@tauri-apps/api/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { mkdir as tauriMkdir, remove as tauriRemove, writeTextFile as tauriWriteTextFile } from "@tauri-apps/plugin-fs";
import { all, exportarBancoJSON, parseJSON } from "./db";

const RAIZ = "kuestion";
const PASTA_BANCOS = `${RAIZ}/bancos`;
const PASTA_NOTAS = `${RAIZ}/notas`;

type Plataforma = "capacitor" | "tauri" | "nenhuma";

/** No nativo mobile é `@capacitor/filesystem`; no desktop (Tauri) é
 * `@tauri-apps/plugin-fs` — os dois dão acesso a um diretório de Documentos
 * de verdade, algo que não existe no navegador de desenvolvimento. */
function plataforma(): Plataforma {
  if (isTauri()) return "tauri";
  if (Capacitor.isNativePlatform()) return "capacitor";
  return "nenhuma";
}

async function garantirPasta(caminho: string, p: Plataforma): Promise<void> {
  if (p === "tauri") {
    await tauriMkdir(caminho, { baseDir: BaseDirectory.Document, recursive: true }).catch(() => {});
    return;
  }
  await Filesystem.mkdir({ path: caminho, directory: Directory.Documents, recursive: true }).catch(() => {
    // já existe — mkdir com recursive:true nem sempre é idempotente em todo device.
  });
}

async function escreverArquivo(caminho: string, conteudo: string, p: Plataforma): Promise<void> {
  if (p === "tauri") {
    await tauriWriteTextFile(caminho, conteudo, { baseDir: BaseDirectory.Document });
    return;
  }
  await Filesystem.writeFile({
    path: caminho,
    data: conteudo,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
}

/** Remove uma pasta inteira (com o que houver dentro) antes de regravá-la do
 * zero — mais simples e confiável do que rastrear arquivos/matérias órfãos
 * entre duas sincronizações (uma matéria renomeada ou esvaziada, por
 * exemplo). Não lança quando a pasta ainda não existe (primeira sincronização). */
async function apagarPasta(caminho: string, p: Plataforma): Promise<void> {
  if (p === "tauri") {
    await tauriRemove(caminho, { baseDir: BaseDirectory.Document, recursive: true }).catch(() => {});
    return;
  }
  await Filesystem.rmdir({ path: caminho, directory: Directory.Documents, recursive: true }).catch(() => {});
}

/** Nome de arquivo seguro a partir de texto livre — troca caracteres
 * inválidos em Android/iOS/Windows por "-" e limita o tamanho. */
function nomeDeArquivo(texto: string): string {
  const limpo = texto.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").slice(0, 120);
  return limpo || "sem-titulo";
}

/** Grava o banco de questões (backup completo do app, ver exportarBancoJSON)
 * como JSON em `Documentos/kuestion/bancos/`. Sobrescreve um único arquivo —
 * este espelho é sempre o estado mais atual, não um histórico. */
export async function sincronizarBancoDocumentos(): Promise<void> {
  const p = plataforma();
  if (p === "nenhuma") return;
  await garantirPasta(PASTA_BANCOS, p);
  const json = await exportarBancoJSON();
  await escreverArquivo(`${PASTA_BANCOS}/banco-de-questoes.json`, json, p);
}

interface NotaParaArquivo {
  materia: string;
  corpo: string;
  tags: string[];
}

/** Cabeçalho reconhecido pelo importador de texto do Anki: separador tab,
 * campos com HTML habilitado, tags lidas da 2ª coluna. Um `{{c1::…}}`/
 * `{{c2::…}}` de marca-texto (ver texto.ts) é sintaxe de Cloze do Anki, não
 * HTML — sai tal como está no corpo; `#html:true` só afeta como o Anki
 * interpreta tags HTML de fato presentes no campo (ex.: o `<br>` abaixo). */
const CABECALHO_TSV = ["#separator:tab", "#html:true", "#tags column:2"].join("\n");

/** Uma linha de TSV não pode conter tab nem quebra de linha literal — tabs
 * viram espaço (não deveriam aparecer em texto normal) e quebras de linha
 * viram `<br>`, a marcação HTML equivalente dentro de um campo do Anki. */
function corpoParaCampoTSV(corpo: string): string {
  return corpo.replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
}

function notaParaLinhaTSV(n: NotaParaArquivo): string {
  return `${corpoParaCampoTSV(n.corpo)}\t${n.tags.join(" ")}`;
}

/** Grava as notas salvas (ver `conceitos_salvos`) num único `.tsv` por
 * matéria em `Documentos/kuestion/notas/<matéria>.tsv` — pronto para import
 * de texto no Anki (ver CABECALHO_TSV). A pasta inteira é regravada do zero
 * a cada chamada (ver `apagarPasta`), então uma matéria renomeada ou
 * esvaziada não deixa arquivo órfão para trás. */
export async function sincronizarNotasDocumentos(): Promise<void> {
  const p = plataforma();
  if (p === "nenhuma") return;
  const notas = await all<{ materia: string; corpo: string; tags: unknown }>(
    `SELECT materia, corpo, tags FROM conceitos_salvos ORDER BY materia, ts ASC`,
  );

  const porMateria = new Map<string, NotaParaArquivo[]>();
  for (const n of notas) {
    const lista = porMateria.get(n.materia) ?? [];
    lista.push({ materia: n.materia, corpo: n.corpo, tags: parseJSON<string[]>(n.tags, []) });
    porMateria.set(n.materia, lista);
  }

  await apagarPasta(PASTA_NOTAS, p);
  await garantirPasta(PASTA_NOTAS, p);
  for (const [materia, lista] of porMateria) {
    const linhas = [CABECALHO_TSV, ...lista.map(notaParaLinhaTSV)].join("\n");
    await escreverArquivo(`${PASTA_NOTAS}/${nomeDeArquivo(materia)}.tsv`, linhas, p).catch((e) =>
      console.error("gravar notas .tsv da matéria", e),
    );
  }
}

/** Sincroniza banco de questões e notas de uma vez — usado pelo botão manual
 * em Ajustes e, automaticamente, junto do backup rotativo (ver
 * backupAuto.ts). Nunca lança: uma falha aqui não pode travar quem chamou. */
export async function sincronizarDocumentos(): Promise<void> {
  if (plataforma() === "nenhuma") return;
  try {
    await Promise.all([sincronizarBancoDocumentos(), sincronizarNotasDocumentos()]);
  } catch (e) {
    console.error("sincronizar pasta kuestion em Documentos", e);
  }
}

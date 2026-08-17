/**
 * Espelha os dados do usuário numa pasta "kuestion" visível em Documentos do
 * celular (@capacitor/filesystem, `Directory.Documents`) — diferente do
 * backup completo (ver `exportarBancoJSON` em db.ts e o snapshot rotativo em
 * backupAuto.ts), que é um único JSON opaco pensado só para restaurar dentro
 * do próprio app. Aqui o formato é para ser lido FORA do app, por qualquer
 * leitor de arquivos: o banco de questões em JSON, as notas em Markdown —
 * uma por arquivo, nomeada pelo título, separadas em subpastas por matéria.
 *
 * Usa `all()` de db.ts diretamente (não repo.ts) para não criar um ciclo de
 * import: repo.ts também depende deste módulo (via backupAuto.ts) para
 * disparar a sincronização a cada bloco fechado e a cada nota salva/editada/
 * apagada.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { all, exportarBancoJSON } from "./db";

const RAIZ = "kuestion";
const PASTA_BANCOS = `${RAIZ}/bancos`;
const PASTA_NOTAS = `${RAIZ}/notas`;

async function garantirPasta(caminho: string): Promise<void> {
  await Filesystem.mkdir({ path: caminho, directory: Directory.Documents, recursive: true }).catch(
    () => {
      // já existe — mkdir com recursive:true nem sempre é idempotente em todo device.
    },
  );
}

/** Remove todo arquivo de uma pasta antes de regravá-la do zero — mais
 * simples e confiável do que rastrear arquivos órfãos quando uma nota é
 * renomeada ou apagada entre duas sincronizações. */
async function limparArquivosDe(caminho: string): Promise<void> {
  try {
    const { files } = await Filesystem.readdir({ path: caminho, directory: Directory.Documents });
    for (const f of files) {
      if (f.type === "file") {
        await Filesystem.deleteFile({ path: `${caminho}/${f.name}`, directory: Directory.Documents }).catch(
          () => {},
        );
      }
    }
  } catch {
    // pasta ainda não existe — nada para limpar.
  }
}

/** Nome de arquivo seguro a partir de texto livre — troca caracteres
 * inválidos em Android/iOS por "-" e limita o tamanho. */
function nomeDeArquivo(texto: string): string {
  const limpo = texto.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").slice(0, 120);
  return limpo || "sem-titulo";
}

/** Grava o banco de questões (backup completo do app, ver exportarBancoJSON)
 * como JSON em `Documentos/kuestion/bancos/`. Sobrescreve um único arquivo —
 * este espelho é sempre o estado mais atual, não um histórico. */
export async function sincronizarBancoDocumentos(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await garantirPasta(PASTA_BANCOS);
  const json = await exportarBancoJSON();
  await Filesystem.writeFile({
    path: `${PASTA_BANCOS}/banco-de-questoes.json`,
    data: json,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
}

interface NotaParaArquivo {
  id: number;
  materia: string;
  titulo: string;
  corpo: string;
  tag: string;
}

function notaParaMarkdown(n: NotaParaArquivo): string {
  const linhas = [`# ${n.titulo || "Sem título"}`, ""];
  if (n.tag) linhas.push(`*Tag: ${n.tag}*`, "");
  linhas.push(n.corpo);
  return linhas.join("\n");
}

/** Grava cada nota salva (ver `conceitos_salvos`) como um `.md` próprio em
 * `Documentos/kuestion/notas/<matéria>/<título>.md`. Cada matéria é
 * completamente regravada a cada chamada (ver `limparArquivosDe`). */
export async function sincronizarNotasDocumentos(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const notas = await all<NotaParaArquivo>(
    `SELECT id, materia, titulo, corpo, tag FROM conceitos_salvos ORDER BY materia, titulo COLLATE NOCASE ASC`,
  );

  const porMateria = new Map<string, NotaParaArquivo[]>();
  for (const n of notas) {
    const lista = porMateria.get(n.materia) ?? [];
    lista.push(n);
    porMateria.set(n.materia, lista);
  }

  await garantirPasta(PASTA_NOTAS);
  for (const [materia, lista] of porMateria) {
    const pastaMateria = `${PASTA_NOTAS}/${nomeDeArquivo(materia)}`;
    await garantirPasta(pastaMateria);
    await limparArquivosDe(pastaMateria);

    const usados = new Set<string>();
    for (const n of lista) {
      let nome = nomeDeArquivo(n.titulo);
      if (usados.has(nome)) nome = `${nome}-${n.id}`; // títulos duplicados na mesma matéria
      usados.add(nome);
      await Filesystem.writeFile({
        path: `${pastaMateria}/${nome}.md`,
        data: notaParaMarkdown(n),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      }).catch((e) => console.error("gravar nota .md", e));
    }
  }
}

/** Sincroniza banco de questões e notas de uma vez — usado pelo botão manual
 * em Ajustes e, automaticamente, junto do backup rotativo (ver
 * backupAuto.ts). Nunca lança: uma falha aqui não pode travar quem chamou. */
export async function sincronizarDocumentos(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Promise.all([sincronizarBancoDocumentos(), sincronizarNotasDocumentos()]);
  } catch (e) {
    console.error("sincronizar pasta kuestion em Documentos", e);
  }
}

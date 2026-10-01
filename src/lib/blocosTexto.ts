/**
 * Quebra o texto de uma questão (enunciado, texto de apoio, alternativa) em
 * blocos para o render de TextoQuestao:
 *   - parágrafo: separado por linha em branco; quebras simples dentro dele
 *     (itens "I.", "II.", linhas de verso) são preservadas;
 *   - tabela: linhas consecutivas começando e terminando com "|" (sintaxe de
 *     tabela Markdown); uma linha "|---|---|" logo após a primeira faz dela
 *     o cabeçalho;
 *   - imagem: linha própria "![descrição](arquivo)", arquivo em
 *     banco/imagens/ (ver TextoQuestao).
 * É o formato em que banco/kuestion_db_1.json guarda tabelas e figuras das
 * provas (ver banco/CLAUDE.md).
 */
export type BlocoTexto =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "tabela"; cabecalho: string[] | null; linhas: string[][] }
  | { tipo: "imagem"; arquivo: string; descricao: string };

const RX_IMAGEM = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const RX_SEPARADOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

const ehLinhaTabela = (l: string) => l.startsWith("|") && l.endsWith("|") && l.length > 1;

function celulas(l: string): string[] {
  return l
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

export function blocosTexto(texto: string): BlocoTexto[] {
  const linhas = texto
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""));
  const blocos: BlocoTexto[] = [];
  let paragrafo: string[] = [];

  const fecharParagrafo = () => {
    const t = paragrafo.join("\n").trim();
    if (t) blocos.push({ tipo: "paragrafo", texto: t });
    paragrafo = [];
  };

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i].trim();
    if (!l) {
      fecharParagrafo();
      continue;
    }
    const img = RX_IMAGEM.exec(l);
    if (img) {
      fecharParagrafo();
      blocos.push({ tipo: "imagem", arquivo: img[2], descricao: img[1] });
      continue;
    }
    if (ehLinhaTabela(l)) {
      fecharParagrafo();
      const grupo: string[] = [];
      while (i < linhas.length && ehLinhaTabela(linhas[i].trim())) grupo.push(linhas[i++].trim());
      i--;
      const temCabecalho = grupo.length > 1 && RX_SEPARADOR.test(grupo[1]);
      const corpo = (temCabecalho ? grupo.slice(2) : grupo).filter((g) => !RX_SEPARADOR.test(g));
      blocos.push({
        tipo: "tabela",
        cabecalho: temCabecalho ? celulas(grupo[0]) : null,
        linhas: corpo.map(celulas),
      });
      continue;
    }
    paragrafo.push(linhas[i]);
  }
  fecharParagrafo();
  return blocos;
}

/**
 * Ordem de exibição das alternativas na revisão (ver QuestaoCard, prop
 * `embaralhar`): `ordem[posição exibida] = índice original`. Embaralhar evita
 * acertar de novo só por lembrar a LETRA da resposta certa em vez do
 * conteúdo — por isso o gabarito nunca fica na mesma posição de antes
 * (`indiceGabarito`), quando há mais de uma alternativa.
 */
export function ordemEmbaralhada(
  n: number,
  indiceGabarito: number,
  aleatorio: () => number = Math.random,
): number[] {
  const ordem = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return ordem;
  // Fisher-Yates.
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  // Gabarito caiu na posição original: troca com outra posição qualquer.
  if (indiceGabarito >= 0 && indiceGabarito < n && ordem[indiceGabarito] === indiceGabarito) {
    const outra = (indiceGabarito + 1 + Math.floor(aleatorio() * (n - 1))) % n;
    [ordem[indiceGabarito], ordem[outra]] = [ordem[outra], ordem[indiceGabarito]];
  }
  return ordem;
}

/** Alternativas chegam com a letra embutida no texto ("A) ...", ver
 * questaoDoBanco em lib/banco.ts). Ao embaralhar, a letra do texto precisa
 * acompanhar a posição exibida — senão a nova posição A mostraria "C) ...".
 * Texto sem prefixo de letra fica como está. */
export function rotularAlternativa(texto: string, letra: string): string {
  const semPrefixo = texto.replace(/^\s*[A-Ea-e]\s*[).:\-–]\s+/, "");
  return semPrefixo === texto ? texto : `${letra}) ${semPrefixo}`;
}

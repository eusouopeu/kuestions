/** Timestamp "agora", em ISO — comparação lexicográfica de `toISOString()`
 * funciona porque a string ordena igual à data que representa. Compartilhado
 * por qualquer consulta que precise comparar contra "agora" (filas de
 * revisão, erro perigoso). */
export const agoraISO = () => new Date().toISOString();

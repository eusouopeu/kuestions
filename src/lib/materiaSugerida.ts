import { materiasMenosRespondidas } from "./repo/questoes";

/**
 * Sorteia 1 matéria entre as 5 com menos questões respondidas de `candidatas`
 * — direciona sutilmente o padrão de Gerar/Do banco pro que está mais
 * atrasado, sem virar um seletor explícito na UI (ver GerarView/GerarBancoView).
 */
export async function escolherMateriaSugerida(candidatas: readonly string[]): Promise<string | null> {
  if (!candidatas.length) return null;
  const piores = await materiasMenosRespondidas(candidatas, 5);
  if (!piores.length) return null;
  return piores[Math.floor(Math.random() * piores.length)];
}

/**
 * Expressão digitada na calculadora, guardada fora do componente.
 *
 * A calculadora é "semifixa": fechar o popover (pelo botão-ícone) desmonta o
 * componente, mas a conta em andamento não pode se perder — quem fecha
 * normalmente está voltando ao enunciado para ler mais um dado e vai reabrir
 * em seguida. Como é só isto, mora num módulo simples em vez de um contexto
 * React: o estado é único no app (há uma calculadora por vez) e não precisa
 * disparar re-render de ninguém — cada montagem lê o valor atual.
 *
 * Não é persistido em disco de propósito: a conta vale para a questão que
 * está na tela, não entre sessões.
 */
let expressao = "";

export function lerExpressaoCalculadora(): string {
  return expressao;
}

export function guardarExpressaoCalculadora(valor: string): void {
  expressao = valor;
}

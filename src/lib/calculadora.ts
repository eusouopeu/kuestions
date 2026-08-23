/**
 * Motor da calculadora que aparece embaixo das questões de cálculo (ver
 * `pareceCalculo` e o componente Calculadora) — resolver a conta sem sair do
 * app e perder a questão de vista.
 *
 * É um avaliador próprio, não `eval`/`Function`: o app roda numa WebView com
 * a chave de API da Anthropic no armazenamento local, e não há motivo para
 * abrir um caminho de execução de string arbitrária só para somar números.
 * Além disso o parser aceita a notação que aparece em prova brasileira —
 * vírgula decimal, separador de milhar, "%" como divisão por 100 e "×"/"÷".
 *
 * Funções puras, sem estado e sem DOM — testadas em calculadora.test.ts.
 */

/** Precedência dos operadores binários aceitos. */
const PRECEDENCIA: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

type Token = { tipo: "num"; valor: number } | { tipo: "op"; valor: string };

/**
 * Normaliza a entrada antes de tokenizar: símbolos de teclado da calculadora
 * (×, ÷, −) viram os ASCII correspondentes, o separador de milhar cai e a
 * vírgula decimal vira ponto. A ordem importa — remover o ponto de milhar
 * antes de converter a vírgula evita ler "1.234,56" como 1.234.
 */
export function normalizarExpressao(entrada: string): string {
  return entrada
    .replace(/[×✕]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(/,/g, ".");
}

function tokenizar(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];

    if (/[\d.]/.test(c)) {
      let j = i;
      while (j < expr.length && /[\d.]/.test(expr[j])) j++;
      const bruto = expr.slice(i, j);
      const valor = Number(bruto);
      if (!Number.isFinite(valor)) throw new Error("Número inválido");
      tokens.push({ tipo: "num", valor });
      i = j;
      continue;
    }

    if ("+-*/^()%".includes(c)) {
      tokens.push({ tipo: "op", valor: c });
      i++;
      continue;
    }

    throw new Error(`Caractere inválido: ${c}`);
  }
  return tokens;
}

/**
 * "%" é pós-fixo e significa "divide por 100" — a leitura que faz uma prova
 * de tributário funcionar ("18% de 2.000" = 0.18 × 2000). Resolvido aqui,
 * antes do parser binário, porque é o único operador unário à direita.
 */
function aplicarPorcentagem(tokens: Token[]): Token[] {
  const saida: Token[] = [];
  for (const t of tokens) {
    const anterior = saida[saida.length - 1];
    if (t.tipo === "op" && t.valor === "%") {
      if (!anterior || anterior.tipo !== "num") throw new Error("% sem número antes");
      saida[saida.length - 1] = { tipo: "num", valor: anterior.valor / 100 };
      continue;
    }
    saida.push(t);
  }
  return saida;
}

/**
 * Menos unário: "-5" e "(-5+2)" viram "(0-5)" e "(0-5+2)". Detectado pela
 * posição — um "-" no início da expressão ou logo depois de outro operador
 * ou de "(" não pode ser subtração.
 */
function resolverUnario(tokens: Token[]): Token[] {
  const saida: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const anterior = tokens[i - 1];
    const inicioDeTermo =
      !anterior || (anterior.tipo === "op" && anterior.valor !== ")");
    if (t.tipo === "op" && (t.valor === "-" || t.valor === "+") && inicioDeTermo) {
      if (t.valor === "+") continue; // "+5" é só 5
      saida.push({ tipo: "num", valor: 0 }, { tipo: "op", valor: "-" });
      continue;
    }
    saida.push(t);
  }
  return saida;
}

/** Shunting-yard: infixo → notação polonesa reversa. */
function paraRPN(tokens: Token[]): Token[] {
  const saida: Token[] = [];
  const pilha: string[] = [];
  for (const t of tokens) {
    if (t.tipo === "num") {
      saida.push(t);
      continue;
    }
    if (t.valor === "(") {
      pilha.push(t.valor);
      continue;
    }
    if (t.valor === ")") {
      while (pilha.length && pilha[pilha.length - 1] !== "(") {
        saida.push({ tipo: "op", valor: pilha.pop()! });
      }
      if (!pilha.length) throw new Error("Parêntese fechado sem abrir");
      pilha.pop();
      continue;
    }
    const p = PRECEDENCIA[t.valor];
    if (p == null) throw new Error(`Operador inválido: ${t.valor}`);
    while (pilha.length) {
      const topo = pilha[pilha.length - 1];
      const pTopo = PRECEDENCIA[topo];
      // "^" é associativo à direita: 2^3^2 = 2^(3^2).
      if (pTopo == null || pTopo < p || (pTopo === p && t.valor === "^")) break;
      saida.push({ tipo: "op", valor: pilha.pop()! });
    }
    pilha.push(t.valor);
  }
  while (pilha.length) {
    const op = pilha.pop()!;
    if (op === "(") throw new Error("Parêntese aberto sem fechar");
    saida.push({ tipo: "op", valor: op });
  }
  return saida;
}

function avaliarRPN(rpn: Token[]): number {
  const pilha: number[] = [];
  for (const t of rpn) {
    if (t.tipo === "num") {
      pilha.push(t.valor);
      continue;
    }
    const b = pilha.pop();
    const a = pilha.pop();
    if (a == null || b == null) throw new Error("Expressão incompleta");
    switch (t.valor) {
      case "+":
        pilha.push(a + b);
        break;
      case "-":
        pilha.push(a - b);
        break;
      case "*":
        pilha.push(a * b);
        break;
      case "/":
        if (b === 0) throw new Error("Divisão por zero");
        pilha.push(a / b);
        break;
      case "^":
        pilha.push(a ** b);
        break;
      default:
        throw new Error(`Operador inválido: ${t.valor}`);
    }
  }
  if (pilha.length !== 1) throw new Error("Expressão incompleta");
  return pilha[0];
}

/**
 * Avalia a expressão. Devolve `null` — nunca lança — quando a expressão está
 * incompleta ou inválida: a calculadora recalcula a cada tecla, então um
 * estado intermediário ("12+") é o caso normal, não um erro a exibir.
 */
export function calcular(entrada: string): number | null {
  const expr = normalizarExpressao(entrada);
  if (!expr) return null;
  try {
    const r = avaliarRPN(paraRPN(resolverUnario(aplicarPorcentagem(tokenizar(expr)))));
    return Number.isFinite(r) ? r : null;
  } catch {
    return null;
  }
}

/**
 * Formata o resultado como número brasileiro, com até 6 casas decimais e sem
 * zeros à direita — o suficiente para alíquota e juros compostos sem
 * transformar 0,1+0,2 em 0,30000000000000004.
 */
export function formatarResultado(n: number): string {
  const arredondado = Math.round(n * 1e6) / 1e6;
  return arredondado.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
}

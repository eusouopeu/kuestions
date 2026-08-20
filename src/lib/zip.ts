/**
 * Escritor de .zip mínimo, só o necessário para montar um .apkg (ver
 * apkg.ts): dois arquivos pequenos (`collection.anki2` e `media`), sem
 * compressão (método STORED) — evita depender de uma lib de deflate externa
 * só para isso, e o ganho de compressão em poucas centenas de KB de SQLite
 * não compensa o peso de uma dependência nova. Formato ZIP padrão (local
 * file headers + central directory + end of central directory), que
 * qualquer leitor de zip — inclusive o importador de .apkg do Anki — lê sem
 * exigir compressão real.
 */

interface ArquivoZip {
  nome: string;
  dados: Uint8Array;
}

/** Tabela de CRC-32 (polinômio padrão 0xEDB88320), calculada uma vez. */
const TABELA_CRC32 = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function crc32(dados: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < dados.length; i++) {
    crc = TABELA_CRC32[(crc ^ dados[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escreverU16(v: DataView, offset: number, valor: number): void {
  v.setUint16(offset, valor, true);
}
function escreverU32(v: DataView, offset: number, valor: number): void {
  v.setUint32(offset, valor, true);
}

/** Monta um .zip com os arquivos dados, todos sem compressão. Nomes devem
 * ser ASCII simples (é o caso de "collection.anki2"/"media"). */
export function criarZip(arquivos: ArquivoZip[]): Uint8Array {
  const codificador = new TextEncoder();
  const partesLocais: Uint8Array[] = [];
  const partesCentrais: Uint8Array[] = [];
  let offset = 0;

  for (const arq of arquivos) {
    const nomeBytes = codificador.encode(arq.nome);
    const crc = crc32(arq.dados);
    const tamanho = arq.dados.length;

    const headerLocal = new Uint8Array(30 + nomeBytes.length);
    const vLocal = new DataView(headerLocal.buffer);
    escreverU32(vLocal, 0, 0x04034b50);
    escreverU16(vLocal, 4, 20); // versão mínima
    escreverU16(vLocal, 6, 0); // flags
    escreverU16(vLocal, 8, 0); // método: stored
    escreverU16(vLocal, 10, 0); // hora
    escreverU16(vLocal, 12, 0x21); // data (1980-01-01, único valor válido mínimo)
    escreverU32(vLocal, 14, crc);
    escreverU32(vLocal, 18, tamanho); // tamanho comprimido == tamanho real (stored)
    escreverU32(vLocal, 22, tamanho);
    escreverU16(vLocal, 26, nomeBytes.length);
    escreverU16(vLocal, 28, 0); // extra field
    headerLocal.set(nomeBytes, 30);

    partesLocais.push(headerLocal, arq.dados);

    const headerCentral = new Uint8Array(46 + nomeBytes.length);
    const vCentral = new DataView(headerCentral.buffer);
    escreverU32(vCentral, 0, 0x02014b50);
    escreverU16(vCentral, 4, 20); // versão que criou
    escreverU16(vCentral, 6, 20); // versão mínima
    escreverU16(vCentral, 8, 0);
    escreverU16(vCentral, 10, 0);
    escreverU16(vCentral, 12, 0);
    escreverU16(vCentral, 14, 0x21);
    escreverU32(vCentral, 16, crc);
    escreverU32(vCentral, 20, tamanho);
    escreverU32(vCentral, 24, tamanho);
    escreverU16(vCentral, 28, nomeBytes.length);
    escreverU16(vCentral, 30, 0); // extra
    escreverU16(vCentral, 32, 0); // comentário
    escreverU16(vCentral, 34, 0); // disco inicial
    escreverU16(vCentral, 36, 0); // atributos internos
    escreverU32(vCentral, 38, 0); // atributos externos
    escreverU32(vCentral, 42, offset); // offset do header local
    headerCentral.set(nomeBytes, 46);

    partesCentrais.push(headerCentral);
    offset += headerLocal.length + arq.dados.length;
  }

  const inicioCentral = offset;
  const tamanhoCentral = partesCentrais.reduce((s, p) => s + p.length, 0);

  const fim = new Uint8Array(22);
  const vFim = new DataView(fim.buffer);
  escreverU32(vFim, 0, 0x06054b50);
  escreverU16(vFim, 4, 0); // disco atual
  escreverU16(vFim, 6, 0); // disco do início do diretório central
  escreverU16(vFim, 8, arquivos.length); // registros neste disco
  escreverU16(vFim, 10, arquivos.length); // registros totais
  escreverU32(vFim, 12, tamanhoCentral);
  escreverU32(vFim, 16, inicioCentral);
  escreverU16(vFim, 20, 0); // comentário

  const total = offset + tamanhoCentral + fim.length;
  const resultado = new Uint8Array(total);
  let pos = 0;
  for (const parte of [...partesLocais, ...partesCentrais, fim]) {
    resultado.set(parte, pos);
    pos += parte.length;
  }
  return resultado;
}

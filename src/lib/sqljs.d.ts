/**
 * Tipos mínimos do sql.js — o pacote não publica `.d.ts` nem tem
 * `@types/sql.js` instalado; cobre só a API usada por lib/apkg.ts (montar um
 * banco Anki em memória e exportar os bytes) e por migrations.test.ts
 * (aplicar as migrações e ler o resultado), sem trazer uma dependência nova
 * só para tipagem.
 */
declare module "sql.js" {
  /** Resultado de `exec`: uma entrada por SELECT executado. */
  export interface SqlJsResultado {
    columns: string[];
    values: unknown[][];
  }

  export interface SqlJsDatabase {
    run(sql: string, params?: unknown[]): void;
    /** Executa um ou mais comandos e devolve o resultado dos SELECTs. */
    exec(sql: string): SqlJsResultado[];
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: new () => SqlJsDatabase;
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
  }): Promise<SqlJsStatic>;
}

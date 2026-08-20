/**
 * Tipos mínimos do sql.js — o pacote não publica `.d.ts` nem tem
 * `@types/sql.js` instalado; cobre só a API que lib/apkg.ts usa (montar um
 * banco Anki em memória e exportar os bytes), sem trazer uma dependência
 * nova só para tipagem.
 */
declare module "sql.js" {
  export interface SqlJsDatabase {
    run(sql: string, params?: unknown[]): void;
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

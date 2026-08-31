/**
 * Migrações do schema SQLite, indexadas pela versão que instalam — extraídas
 * de db.ts para poderem ser aplicadas (e testadas, ver migrations.test.ts)
 * fora do Capacitor: db.ts importa @capacitor-community/sqlite no topo, o que
 * inviabiliza carregá-lo num teste em Node. Aqui só há dados, sem I/O.
 *
 * Toda migração é idempotente no que dá (CREATE TABLE/INDEX IF NOT EXISTS) e
 * nunca recria tabela: colunas abandonadas ficam mortas no banco em vez de
 * DROP COLUMN, que depende da versão do SQLite de cada aparelho em campo.
 */
export interface Migracao {
  version: number;
  sql: string;
}

export const MIGRATIONS: Migracao[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS blocos (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ts              TEXT    NOT NULL,
        materia         TEXT    NOT NULL,
        topico          TEXT,
        tipo            TEXT    NOT NULL,
        formato         TEXT    NOT NULL,
        nivel           INTEGER NOT NULL,
        total_acertos   INTEGER NOT NULL DEFAULT 0,
        total_questoes  INTEGER NOT NULL DEFAULT 0,
        por_sub         TEXT    NOT NULL DEFAULT '[]',
        aprovado        INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS questoes_respondidas (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        bloco_id            INTEGER REFERENCES blocos(id) ON DELETE SET NULL,
        materia             TEXT    NOT NULL,
        sub                 TEXT    NOT NULL,
        carga_conceitual    INTEGER NOT NULL,
        formato             TEXT    NOT NULL,
        tipo_cobranca       TEXT,
        enunciado           TEXT    NOT NULL,
        alternativas        TEXT,
        gabarito            TEXT    NOT NULL,
        resposta            TEXT    NOT NULL,
        acertou             INTEGER NOT NULL,
        revisada            INTEGER NOT NULL DEFAULT 0,
        comentario          TEXT,
        explicacoes_erradas TEXT    NOT NULL DEFAULT '{}',
        conceitos           TEXT    NOT NULL DEFAULT '[]',
        dispositivo         TEXT,
        ts                  TEXT    NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conceitos_salvos (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        materia           TEXT    NOT NULL,
        termo             TEXT    NOT NULL,
        definicao         TEXT    NOT NULL DEFAULT '',
        questao_origem_id INTEGER REFERENCES questoes_respondidas(id) ON DELETE SET NULL,
        ts                TEXT    NOT NULL
      );

      -- Um termo só existe uma vez por matéria: é o que impede duplicar o
      -- conceito quando o usuário toca no mesmo chip em outra questão.
      CREATE UNIQUE INDEX IF NOT EXISTS ix_conceitos_materia_termo
        ON conceitos_salvos (materia, termo);

      -- Índices para as agregações da aba Dados e a lista de erradas.
      CREATE INDEX IF NOT EXISTS ix_qr_materia   ON questoes_respondidas (materia);
      CREATE INDEX IF NOT EXISTS ix_qr_acertou   ON questoes_respondidas (acertou);
      CREATE INDEX IF NOT EXISTS ix_qr_bloco     ON questoes_respondidas (bloco_id);
      CREATE INDEX IF NOT EXISTS ix_blocos_ts    ON blocos (ts);
      CREATE INDEX IF NOT EXISTS ix_blocos_mat   ON blocos (materia);
    `,
  },
  {
    // Notas deixam de ser "chip de conceito com nome único por matéria" e
    // passam a ser "título + corpo (texto selecionado) + tag", criadas pelo
    // usuário selecionando qualquer trecho da questão. `termo`/`definicao`
    // ficam como colunas mortas (não apagamos coluna em SQLite sem certeza da
    // versão do motor em todo aparelho Android já em campo); o app para de
    // lê-las. `topico` em questoes_respondidas guarda o tópico do bloco de
    // origem, necessário para calcular a tag também na revisão de erradas
    // (onde não há mais acesso à config do bloco).
    version: 2,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN topico TEXT;

      ALTER TABLE conceitos_salvos ADD COLUMN titulo TEXT NOT NULL DEFAULT '';
      ALTER TABLE conceitos_salvos ADD COLUMN corpo  TEXT NOT NULL DEFAULT '';
      ALTER TABLE conceitos_salvos ADD COLUMN tag    TEXT NOT NULL DEFAULT '';

      UPDATE conceitos_salvos SET titulo = termo, corpo = definicao WHERE titulo = '';

      DROP INDEX IF EXISTS ix_conceitos_materia_termo;
      CREATE INDEX IF NOT EXISTS ix_conceitos_materia ON conceitos_salvos (materia);
    `,
  },
  {
    // Reportar questão com erro: sinaliza que o ENUNCIADO/gabarito da questão
    // está errado (não que o usuário errou a resposta), para revisar depois o
    // que o modelo gerou mal. Independente de `acertou`/`revisada`, que
    // seguem descrevendo o desempenho do usuário.
    version: 3,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN reportada INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    // A carga conceitual (sub-blocos A–D) deixou de orientar a geração: o
    // usuário sentiu as questões parecidas demais entre sub-blocos, então a
    // dificuldade real que importa é `nivel` (Config.nivel), que até aqui só
    // vivia em `blocos`. Trazemos para `questoes_respondidas` para poder
    // filtrar/agregar acerto por nível na aba Dados e no header de Refazer.
    // `sub`/`carga_conceitual` continuam NOT NULL (mesma política de não
    // dropar coluna já adotada nas migrações anteriores) — novas linhas
    // gravam valores mortos ('' e 1) e o app para de lê-los.
    version: 4,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN nivel INTEGER;

      UPDATE questoes_respondidas
      SET nivel = (SELECT nivel FROM blocos WHERE blocos.id = questoes_respondidas.bloco_id)
      WHERE bloco_id IS NOT NULL;
    `,
  },
  {
    // Categoriza o motivo do report (ver ModalReport.tsx) em vez de um
    // reportada=1 genérico — orienta a curadoria do banco de questões
    // geradas por IA direto para a causa mais provável.
    version: 5,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN motivo_report TEXT;
    `,
  },
  {
    // Repetição espaçada (caixas de Leitner) em vez de um `revisada` binário:
    // `caixa_leitner` (1–5) e `proxima_revisao` (ISO, NULL = vencida agora)
    // decidem quando uma errada volta a aparecer em "Refazer erradas" — ver
    // registrarRevisao em repo.ts. Linhas já marcadas `revisada = 1` na versão
    // anterior viram caixa 2 sem data agendada: continuam fora da fila de
    // pendentes (mesmo comportamento de antes), só passam a evoluir de caixa
    // dali em diante.
    //
    // `banco_id` guarda o id da questão de origem em banco_questoes.json
    // quando o bloco veio do banco real (ver lib/banco.ts) — permite priorizar
    // questões inéditas do banco fixo em vez de sortear com reposição.
    version: 6,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN caixa_leitner INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE questoes_respondidas ADD COLUMN proxima_revisao TEXT;
      ALTER TABLE questoes_respondidas ADD COLUMN banco_id TEXT;

      UPDATE questoes_respondidas SET caixa_leitner = 2 WHERE revisada = 1;

      CREATE INDEX IF NOT EXISTS ix_qr_proxima_revisao ON questoes_respondidas (proxima_revisao);
      CREATE INDEX IF NOT EXISTS ix_qr_banco_id ON questoes_respondidas (banco_id);
    `,
  },
  {
    // Tempo por questão: `tempo_ms` guarda quanto tempo o usuário levou entre
    // a questão aparecer e o envio da resposta — cronometrado em QuestaoCard.
    // NULL para respostas gravadas antes desta versão (não há como recuperar
    // o tempo retroativamente) e para o simulado cronometrado, que tem sua
    // própria UI sem QuestaoCard e já mede o tempo agregado do bloco inteiro.
    //
    // Notas passam a ter repetição espaçada própria (mesmo esquema de caixas
    // de Leitner de questoes_respondidas — ver INTERVALOS_LEITNER_DIAS em
    // repo.ts), para revisão ativa das notas salvas dentro do próprio app,
    // não só exportação para o Anki. `proxima_revisao = NULL` (o padrão de
    // toda nota nova) significa "nunca revisada" — vencida agora.
    version: 7,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN tempo_ms INTEGER;

      ALTER TABLE conceitos_salvos ADD COLUMN caixa_leitner INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE conceitos_salvos ADD COLUMN proxima_revisao TEXT;

      CREATE INDEX IF NOT EXISTS ix_conceitos_proxima_revisao ON conceitos_salvos (proxima_revisao);
    `,
  },
  {
    // Cache de comentário/explicações por questão real do banco fixo
    // (banco_id, ver lib/banco.ts). Sem isso, toda vez que o estoque de
    // questões inéditas de uma matéria acaba e `selecionarQuestoes` sorteia
    // de novo uma questão já vista, a mesma questão real disparava uma nova
    // chamada de API para gerar a mesma explicação de novo — o banco tem só
    // ~1100 questões e um usuário ativo esgota rápido o estoque de uma área.
    // Preenchida na primeira geração (ver gerarExplicacoesComCache em
    // repo.ts) e consultada antes de qualquer nova chamada.
    version: 8,
    sql: `
      CREATE TABLE IF NOT EXISTS explicacoes_banco (
        banco_id            TEXT PRIMARY KEY,
        comentario          TEXT NOT NULL DEFAULT '',
        explicacoes_erradas TEXT NOT NULL DEFAULT '{}',
        ts                  TEXT NOT NULL
      );
    `,
  },
  {
    // Nota deixa de ter um único `tag` e passa a ter `tags` (array JSON):
    // a primeira posição é sempre a "tag de origem" (a que já existia,
    // derivada do assunto do bloco), agora travada contra exclusão na edição
    // — o usuário só pode adicionar/remover as demais. O campo `titulo`
    // também é abandonado (a pasta da matéria já organiza as notas; um
    // título livre só duplicava trabalho na criação/edição): igual a
    // `termo`/`definicao`/`tag` na v2, a coluna continua `NOT NULL DEFAULT
    // ''` no schema (sem DROP COLUMN) e o app simplesmente para de lê-la.
    version: 9,
    sql: `
      ALTER TABLE conceitos_salvos ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';

      UPDATE conceitos_salvos SET tags = json_array(tag) WHERE tag != '';
    `,
  },
  {
    // Confiança da resposta ("certeza" ou "chute"), registrada ANTES de
    // revelar o gabarito (ver QuestaoCard) — separa acerto por conhecimento
    // de acerto por sorte na aba Dados (ver porConfianca em repo.ts). NULL
    // para toda resposta anterior a esta versão e para fluxos que não pedem
    // confiança (revisão em Refazer erradas, simulado cronometrado).
    version: 10,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN confianca TEXT;
    `,
  },
  {
    // "Administração Financeira e Orçamentária" virou "AFO" em MATERIAS
    // (constants.ts) — renomeia também o histórico já gravado com o nome
    // antigo, para não fragmentar blocos/respostas/notas da mesma matéria
    // em dois nomes diferentes nas agregações da aba Dados e nas pastas de
    // Notas.
    version: 11,
    sql: `
      UPDATE blocos SET materia = 'AFO' WHERE materia = 'Administração Financeira e Orçamentária';
      UPDATE questoes_respondidas SET materia = 'AFO' WHERE materia = 'Administração Financeira e Orçamentária';
      UPDATE conceitos_salvos SET materia = 'AFO' WHERE materia = 'Administração Financeira e Orçamentária';
    `,
  },
  {
    // Registro de uso da API (tokens e custo) por chamada — sem isto o app
    // gasta a conta pessoal do usuário sem nenhum lugar onde ver quanto já
    // gastou (cada bloco de 12 questões são 4 chamadas). Uma linha por
    // chamada concluída, com os quatro contadores que a API devolve em
    // `usage` (entrada, saída, escrita e leitura de cache — cada um com
    // preço diferente, ver lib/custo.ts) e o custo já calculado em USD, para
    // que a agregação não dependa de a tabela de preços continuar igual.
    version: 12,
    sql: `
      CREATE TABLE IF NOT EXISTS uso_api (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        ts                TEXT    NOT NULL,
        modelo            TEXT    NOT NULL,
        origem            TEXT    NOT NULL,
        tokens_entrada    INTEGER NOT NULL DEFAULT 0,
        tokens_saida      INTEGER NOT NULL DEFAULT 0,
        cache_escrita     INTEGER NOT NULL DEFAULT 0,
        cache_leitura     INTEGER NOT NULL DEFAULT 0,
        custo_usd         REAL    NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS ix_uso_api_ts ON uso_api (ts);
    `,
  },
  {
    // Repetição espaçada também para as ACERTADAS. Até aqui a caixa de
    // Leitner só era usada em "Refazer erradas": acertar uma questão uma vez
    // a tirava do circuito para sempre — o oposto do que repetição espaçada
    // faz. As colunas já existiam em toda linha (v6); o que faltava era
    // agendar a primeira revisão das acertadas.
    //
    // Esta migração agenda o histórico já existente: toda acertada de
    // verdade (`resposta != ''`) entra na caixa 2 com revisão marcada para
    // 3 dias depois da resposta (INTERVALOS_LEITNER_DIAS[1] em repo.ts).
    // Como quase todo histórico é antigo, na prática isso as deixa vencidas
    // — que é o correto: nunca foram revisadas.
    //
    // O strftime reproduz o formato de `toISOString()` (com "T" e "Z")
    // porque a comparação de datas no app é LEXICOGRÁFICA; o `datetime()`
    // do SQLite devolveria "AAAA-MM-DD HH:MM:SS", que ordena diferente.
    version: 13,
    sql: `
      UPDATE questoes_respondidas
         SET revisada        = 1,
             caixa_leitner   = MAX(caixa_leitner, 2),
             proxima_revisao = strftime('%Y-%m-%dT%H:%M:%fZ', ts, '+3 days')
       WHERE acertou = 1
         AND resposta != ''
         AND proxima_revisao IS NULL;
    `,
  },
  {
    // "AFO" e "Finanças Públicas" são a mesma matéria com dois nomes: AFO
    // era o nome curto usado em MATERIAS (geração por IA, ver constants.ts)
    // e "Finanças Públicas" é o nome da mesma área no banco de questões
    // reais (lib/banco.ts) — sem unificar, um bloco gerado por IA e um
    // bloco do banco da mesma matéria apareciam como matérias diferentes em
    // toda agregação da aba Dados, nas pastas de Notas e no peso do edital.
    // Mantém "Finanças Públicas" (o nome que já existia no banco real) em
    // vez de "AFO" — é o lado com mais dados e o mais descritivo dos dois.
    version: 14,
    sql: `
      UPDATE blocos SET materia = 'Finanças Públicas' WHERE materia = 'AFO';
      UPDATE questoes_respondidas SET materia = 'Finanças Públicas' WHERE materia = 'AFO';
      UPDATE conceitos_salvos SET materia = 'Finanças Públicas' WHERE materia = 'AFO';
    `,
  },
  {
    // Caderno (páginas de blocos), Mapas mentais, Tarefas e PDFs importados —
    // ver src/lib/repo/caderno.ts, repo/mapas.ts, repo/tarefas.ts, repo/pdfs.ts.
    //
    // Cada linha é uma unidade inteira (página/mapa), não um blob único do
    // app: permite busca via SQL (LIKE em `blocos`/`nos`), dedup por
    // conteúdo na mesclagem entre aparelhos (ver repo/backup.ts) e revisão
    // espaçada por item, no mesmo padrão de `conceitos_salvos`.
    //
    // `pdfs.caminho` só guarda o caminho relativo em Documentos/kuestion
    // (ver lib/exportarDocumentos.ts) — o binário do PDF nunca entra no
    // SQLite.
    version: 15,
    sql: `
      CREATE TABLE IF NOT EXISTS caderno_paginas (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo     TEXT    NOT NULL DEFAULT '',
        icone      TEXT,
        pasta      TEXT,
        fixada     INTEGER NOT NULL DEFAULT 0,
        blocos     TEXT    NOT NULL DEFAULT '[]',
        criada_em  TEXT    NOT NULL,
        ts         TEXT    NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ix_caderno_ts ON caderno_paginas (ts);

      CREATE TABLE IF NOT EXISTS mapas (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        nome            TEXT    NOT NULL,
        materia         TEXT,
        nos             TEXT    NOT NULL DEFAULT '[]',
        caixa_leitner   INTEGER NOT NULL DEFAULT 1,
        proxima_revisao TEXT,
        ts              TEXT    NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ix_mapas_ts ON mapas (ts);

      CREATE TABLE IF NOT EXISTS tarefas (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        texto     TEXT    NOT NULL,
        feita     INTEGER NOT NULL DEFAULT 0,
        tag       TEXT,
        criada_em TEXT    NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pdfs (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        nome    TEXT    NOT NULL,
        caminho TEXT    NOT NULL,
        pagina  INTEGER NOT NULL DEFAULT 1,
        ts      TEXT    NOT NULL
      );
    `,
  },
  {
    // Pastas em PDFs, no mesmo padrão de caderno_paginas.pasta — permite
    // organizar PDFs importados em pastas, igual às páginas do Caderno.
    version: 16,
    sql: `ALTER TABLE pdfs ADD COLUMN pasta TEXT;`,
  },
];

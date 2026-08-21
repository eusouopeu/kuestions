# Kuestions

App mobile (iOS/Android) de treino por repetição para concursos da área fiscal, em Capacitor + React + TypeScript. Gera blocos de questões no método Kumon, guarda tudo em SQLite nativo, mostra onde o desempenho quebra e exporta o que você grifar como flashcard.

Adaptado do artefato `Questoes-Kumon.jsx`, preservando a lógica pedagógica, a paleta e as interações originais. (Nome do projeto anterior: Kumon Fiscal — `applicationId`/`appId` continuam `com.pedroteles.kumonfiscal`, só o nome exibido mudou.)

---

## 1. Configurar a chave de API

O app **não** embute nenhuma chave no bundle. Há duas opções; a primeira é a padrão e não exige infraestrutura.

### Opção A — chave no aparelho (padrão)

1. Gere uma chave em [console.anthropic.com](https://console.anthropic.com) → **API Keys**.
2. Abra o app → aba **Ajustes** → cole a chave no campo *Chave de API da Anthropic* → **Salvar**.

A chave é guardada via `@capacitor/preferences` (SharedPreferences no Android, UserDefaults no iOS — ambos privados ao sandbox do app) e sai do aparelho apenas na chamada para `api.anthropic.com`. Sem chave configurada, o app abre direto em Ajustes.

O custo da API é seu: cada bloco de 12 questões são 4 chamadas (uma por sub-bloco).

### Opção B — backend fino guardando a chave

Use se for distribuir o app a outras pessoas, para que a chave não fique no aparelho de ninguém. O Worker está em [`proxy/cloudflare-worker.js`](proxy/cloudflare-worker.js), com as instruções de deploy no topo do arquivo. Resumo:

```bash
npm i -g wrangler && wrangler login
wrangler deploy proxy/cloudflare-worker.js --name kumon-fiscal-proxy
wrangler secret put ANTHROPIC_API_KEY   # a chave sk-ant-…
wrangler secret put APP_TOKEN           # um segredo qualquer, para fechar o Worker
```

No app, em **Ajustes**, preencha *Backend próprio* com a URL do Worker e ponha o `APP_TOKEN` no campo *Chave de API*. Um Worker sem `APP_TOKEN` é uma conta da Anthropic aberta para quem descobrir a URL — não pule esse passo.

---

## 2. Rodar

```bash
npm install
```

O `postinstall` copia `sql-wasm.wasm` para `public/assets/` — necessário só para rodar no navegador (ver *Notas técnicas*).

### Navegador (desenvolvimento)

```bash
npm run dev
```

SQLite roda via WASM e persiste em IndexedDB. Bom para mexer em UI; para testar comportamento nativo, use emulador.

### Android

Precisa de Android Studio + um SDK instalado.

```bash
npm run android      # build + sync + abre o Android Studio
```

No Android Studio, escolha um emulador ou aparelho conectado e clique em **Run**. Para linha de comando:

```bash
npm run sync
cd android && ./gradlew installDebug
```

### iOS

Precisa de **Xcode completo** (não apenas as Command Line Tools) e CocoaPods.

```bash
npm run ios          # build + pod install + sync + abre o Xcode
```

No Xcode, selecione um simulador e clique em **Run**. Para rodar em iPhone físico, defina um *Team* de assinatura em **Signing & Capabilities**.

> **Estado desta máquina:** o projeto iOS está gerado e com os Pods instalados, mas o Xcode **não está instalado** aqui — `xcode-select -p` aponta para `/Library/Developer/CommandLineTools`. Antes do primeiro build iOS:
>
> 1. Instale o Xcode pela App Store.
> 2. Aponte as ferramentas para ele (pede senha, então rode você mesmo):
>
> ```bash
> sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
> ```
>
> Android não depende disso e já funciona.

---

## 3. O que o app faz

### Aba Questões

**Gerar novas** — configure matéria, tópico, tipo de cobrança, formato e dificuldade; o app gera um bloco de **12 questões = 4 sub-blocos (A–D) × 3**.

A dificuldade do *conteúdo* é constante no bloco (nível 1–5). O que sobe entre sub-blocos é a **carga conceitual**: A exige 1 conceito isolado, D exige 4 ou mais mobilizados em paralelo. É esse eixo que mostra onde o raciocínio quebra — errar em D com A/B perfeitos significa que os conceitos existem mas não se combinam.

Aprovação em **≥ 90% (11/12)**. Os sub-blocos são pré-carregados em cascata: enquanto você responde A, o B já está sendo gerado.

Tipos de cobrança: literalidade em abstrato, norma em caso concreto, dispositivo cabível, cálculo concreto, conceitos e classificações, e **misturado** (sorteia um tipo diferente por questão dentro do sub-bloco).

Ao responder, a questão revela: gabarito, comentário, e **a explicação do erro de cada alternativa errada** — com o mesmo detalhe em Certo/Errado e em múltipla escolha.

**Importar** — monta um bloco sem chamar a API, de duas formas:

- **JSON**: cole (ou carregue um arquivo `.json`) um array de questões no mesmo formato que a geração produz — só `enunciado`, `formato` ("ce"/"mc") e `gabarito` são obrigatórios; o resto (`comentario`, `explicacoes_erradas`, `conceitos`, `dispositivo`, `tipo_cobranca`) é opcional e fica em branco quando ausente. Itens inválidos são descartados com aviso, não travam a importação inteira.
- **Manual**: um formulário monta uma questão por vez (enunciado, alternativas em sequência a partir de A, gabarito, comentário, explicação de cada alternativa errada) e acumula numa fila antes de iniciar o bloco.

Em ambos os casos o drill e a gravação em `questoes_respondidas` são idênticos aos de um bloco gerado — a única diferença é a origem das questões. O bloco importado usa nível 3 e tipo "misturado" fixos (sem sentido pedir dificuldade constante ou tipo único para um conjunto que você mesmo montou).

**Refazer erradas** — relê as questões já erradas do banco e as reapresenta, **sem chamar a API** (custo zero). Agrupadas por matéria, com o tema em revisão no topo. Acertar marca a questão como *revisada*; ela continua no histórico, e o filtro "só pendentes" separa o que falta.

Interações: toque para marcar, deslize ← para riscar uma alternativa, deslize → para desfazer.

### Aba Notas

Em qualquer questão (respondida ou não), **selecione um trecho de texto** — do enunciado, do comentário, das explicações — e toque no botão flutuante "+ Salvar nota" que aparece perto da seleção. Um formulário pede:

- **Título** — digitado por você;
- **Corpo** — o trecho selecionado, pré-preenchido e editável;
- **Tag** — o assunto do bloco de origem (tópico digitado na geração, ou a matéria como fallback), resumido localmente a até 3 palavras separadas por hífen (ex.: `imunidade-tributaria-reciproca`). Sem chamada à API — é normalização de string, não geração de conteúdo.

Uma pasta por matéria, ordenável por data ou A–Z, com edição e exclusão. Cada pasta tem um botão **Exportar flashcards (CSV)**: gera um CSV de 3 colunas (título, corpo, tag), sem cabeçalho, pronto para importar no Anki. Se o corpo contiver uma lista (linhas começando com `-`, `*`, `1.`, `1)`, `a)` — pelo menos 2 para não confundir com uma citação solta de artigo), o título exportado ganha a contagem entre parênteses, ex. `Hipóteses de suspensão da exigibilidade (6)`. No Android/iOS, a exportação abre a folha de compartilhamento nativa (Drive, Arquivos, e-mail…); no navegador, baixa direto.

A revisão dentro do app (botão **Revisar notas pendentes**) usa a MESMA classificação da exportação: nota com "=" abre mostrando só o que vem antes do sinal e revela o resto ao virar; nota com marca-texto abre com os trechos marcados tarjados e os revela ao virar — igual ao cartão que o Anki vai mostrar depois. A exportação em `.apkg` dá a cada nota um GUID derivado do seu id no banco, então reexportar a mesma pasta ATUALIZA os cartões no Anki em vez de duplicá-los e zerar o agendamento.

### Aba Dados

Filtro por matéria ("todas" agrega; uma matéria filtra estritamente) e:

- evolução do % de acerto por bloco no tempo (linha, com o limiar de aprovação);
- acerto por nível, por tipo de cobrança, por formato (CE vs MC), por confiança e por conceito — todos no mesmo componente de barras, com a mesma largura de eixo, para que a área de plotagem seja comparável entre eles;
- **erro perigoso** — quantas questões você marcou com "certeza" e mesmo assim errou, e que % das suas certezas isso representa. É o erro que não se revisa sozinho (sem dúvida percebida, não se volta ao ponto); por isso a fila de "Refazer erradas" passa a mostrar essas questões primeiro;
- **custo da API** — gasto do mês, gasto total, número de chamadas e quanto dos tokens de entrada veio do cache. O teto mensal é configurado em Ajustes: com 80% ou mais dele consumido, gerar um bloco novo pede confirmação (nunca bloqueia — o teto é do usuário, não uma política do app);
- totais: acerto geral, questões respondidas e sequência de dias, os três numa linha.

Toda questão respondida é gravada, certa ou errada. É a mesma base para a revisão de erradas e para os gráficos.

### Prioridade de estudo e acessibilidade

Na tela de configuração de bloco, um cartão **Estudar agora** aponta a matéria mais urgente, cruzando peso no edital × fraqueza (% de acerto) × dias sem praticar ([`src/lib/prioridade.ts`](src/lib/prioridade.ts)) — multiplicação, não soma, para que peso 0 ("não cai no meu edital") zere a prioridade por mais fraca que a matéria esteja. Um toque aplica a matéria na configuração.

Em Ajustes há **tamanho da interface** (padrão/grande/maior — aplica `zoom` na raiz, então cresce texto e alvo de toque juntos) e, em cada questão, um botão de **ouvir** que lê enunciado, alternativas e — depois de revelada — gabarito e comentário, pela síntese de voz do próprio aparelho (sem rede, sem custo).

### Simulado: relatório pós-prova

Além do placar, o simulado cronometra cada questão e fecha com um relatório: nota ponderada pelo peso do edital, tempo médio por questão, questões deixadas em branco, acerto por área (barra mais grossa quanto maior o peso) e as **questões mais lentas** — acima de 2× o seu tempo médio. Acertar gastando o dobro do tempo é fluência baixa, um problema diferente de errar, e o único que o placar conta como acerto.

---

## 4. Notas técnicas

### Testes e CI

`npm test` (vitest, ambiente node) cobre as funções puras — `texto.ts`, `flashcards.ts`, `sugestao.ts`, `prioridade.ts`, `custo.ts`, `blocoUtils.ts`, `pontuacaoTopicos.ts` — e as **migrações do schema**, que rodam de verdade contra o SQLite do `sql.js` (`src/lib/migrations.test.ts`): banco antigo com dados, migração até a última versão, dados intactos. As migrações vivem em [`src/lib/migrations.ts`](src/lib/migrations.ts), separadas de `db.ts` justamente para poderem ser carregadas fora do Capacitor. O workflow em `.github/workflows/ci.yml` roda typecheck, testes, build web e o APK de debug a cada push.

### Schema SQLite

`@capacitor-community/sqlite`, com o schema versionado por `PRAGMA user_version` e migrado no boot ([`src/lib/db.ts`](src/lib/db.ts), com as migrações em [`src/lib/migrations.ts`](src/lib/migrations.ts)). Abrir uma versão nova de schema aplica só as migrações pendentes — não recria nem apaga dados. Atualmente na versão 12 (a última acrescenta `uso_api`, o registro de tokens e custo por chamada). A v2 adiciona `topico` a `questoes_respondidas` (para calcular a tag da nota também na revisão de erradas, onde não há mais acesso à config do bloco) e migra `conceitos_salvos` do fluxo antigo de "chip de conceito" (`termo`/`definicao`, únicos por matéria) para o de seleção de texto (`titulo`/`corpo`/`tag`, sem unicidade — o usuário decide o título a cada seleção, então duas notas com o mesmo título são um uso legítimo). As colunas `termo`/`definicao` ficam mortas no banco (sem `DROP COLUMN`, para não depender da versão do SQLite de cada aparelho já em campo).

Tabelas: `blocos`, `questoes_respondidas`, `conceitos_salvos`, `explicacoes_banco` e `uso_api`. As agregações da aba Dados são feitas em SQL (`GROUP BY`), não em memória — é a razão de usar SQLite em vez de Preferences.

### Abas ficam montadas (não desmontadas) ao trocar

[`src/App.tsx`](src/App.tsx) renderizava as abas condicionalmente (`{aba === "questoes" && <QuestoesTab/>}`), o que **desmontava** a aba ao sair dela — trocar de aba no meio de um bloco perdia o sub-bloco atual, o progresso e as respostas, sem gravar nada. A correção: cada aba, uma vez visitada, permanece montada para sempre, só escondida via `display:none`; Notas e Dados recebem uma prop `ativa` e recarregam os dados sempre que reativadas (em vez de usar `key` para forçar remount, que era o mecanismo antigo de "atualizar ao voltar").

### `temperature: 0` foi substituído

A especificação original pedia `temperature: 0` para reduzir alucinação. **O parâmetro foi removido nos modelos atuais e uma requisição que o envie recebe erro 400.** O controle equivalente é raciocínio adaptativo com `output_config.effort`, que dá ao modelo espaço para executar a autoverificação factual que o prompt exige (conferir gabarito, dispositivo citado e contas) antes de fechar o JSON. As instruções de segurança jurídica do artefato foram mantidas na íntegra.

O prompt de cada sub-bloco é montado em três partes, do mais estável ao mais volátil — método (regras fixas), configuração (matéria/tópico/nível/formato) e dinâmico (padrões já usados, equilíbrio C/E) — com `cache_control` nas duas primeiras. Como o cache é casamento de prefixo, pôr as regras fixas ANTES da configuração faz o cache sobreviver à troca de matéria e de bloco, não só aos sub-blocos de um mesmo bloco. Toda chamada concluída grava tokens e custo em `uso_api` (ver [`src/lib/custo.ts`](src/lib/custo.ts) e o cartão CUSTO DA API na aba Dados); leitura de cache custa 10% do token de entrada, então o efeito da divisão é visível ali.

Modelo: `claude-sonnet-5`, esforço `medium` — equilíbrio entre a autoverificação factual e o custo por chamada (cada bloco de 12 questões já são 4 chamadas). As chamadas usam streaming, porque com raciocínio ligado o `max_tokens` cobre raciocínio + resposta e um valor alto sem streaming arriscaria timeout de HTTP.

### `sql.js` está pinado em 1.11.0

Não atualize sem testar no navegador. O `jeep-sqlite` traz o *glue* JS do sql.js compilado dentro do próprio bundle, e esse glue precisa casar com a ABI do binário `.wasm`. Com sql.js 1.14 o carregamento falha em runtime com:

```
LinkError: WebAssembly.instantiate(): Import #34 "a" "I": function import requires a callable
```

Isso afeta **apenas o navegador**; no Android/iOS o plugin usa SQLite nativo e o WASM é irrelevante (ele fica empacotado no app, ~650 kB de peso morto, sem efeito em runtime).

### `jeep-sqlite` é carregado pelo build standalone

[`src/lib/db.ts`](src/lib/db.ts) importa `jeep-sqlite/dist/components/jeep-sqlite.js` e não `jeep-sqlite/loader`. Sob Vite, o loader lazy do Stencil registra o nome do elemento mas não bootstrapa a instância: o componente nunca hidrata e `initWebStore()` fica pendurado **para sempre, sem lançar erro** — o app trava em "Abrindo banco de dados…". Também é preciso aguardar `componentOnReady()`, porque `customElements.whenDefined()` só garante que a classe existe, não que a instância carregou.

### CocoaPods e locale

`pod install` quebra com `Unicode Normalization not appropriate for ASCII-8BIT` quando `LANG` não é UTF-8 (é o caso deste shell, onde `LANG` está vazio). O script `npm run ios:pods` já força `LANG=en_US.UTF-8`.

### Tamanho do bundle

A aba Dados carrega o `recharts` (~400 kB) por import dinâmico, fora do bundle inicial: quem nunca abrir Dados nunca baixa o gráfico.

### Ícone: gradiente de traço sumindo na haste do K

O SVG de origem (`resources/icon.svg`, `resources/icon-foreground.svg`) desenha o K como três traços (`stroke`, sem `fill`) em vez de usar uma fonte — assim o ícone não depende de nenhuma fonte estar instalada no rasterizador. A haste vertical do K, sendo uma linha perfeitamente vertical, tem bounding box geométrico de **largura zero**; um gradiente `objectBoundingBox` (o padrão do SVG) degenera nesse caso e o `librsvg` simplesmente não pinta aquele traço — a haste some, sobrando só os dois braços (vira um "<"). A correção foi declarar o gradiente com `gradientUnits="userSpaceOnUse"` e coordenadas absolutas, que não dependem do bounding box de cada elemento. Se for redesenhar o ícone com gradientes de traço, evite `objectBoundingBox` em qualquer traço perfeitamente horizontal ou vertical.

---

## 5. Estrutura

```
src/
  lib/
    db.ts          abertura do SQLite + migrações versionadas
    repo.ts        todas as queries, incluindo as agregações da aba Dados
    anthropic.ts   prompt de geração, parsing tolerante e normalização (normalizarQuestao é
                   reaproveitado pela importação de JSON/manual)
    secure.ts      chave de API / URL de backend via Preferences
    texto.ts       tag de assunto, detecção de lista e slug — puros, sem chamada à API
    exportar.ts    CSV + Filesystem/Share (nativo) ou Blob (navegador)
    constants.ts   matérias, tipos, formatos, níveis, 4×3=12
    types.ts
  components/      Opcao (toque/arrasto), QuestaoCard, SelecaoNota (seleção → nota), Rail,
                   Chip, TabBar, …
  views/           QuestoesTab (Gerar/Importar/Refazer), NotasTab, DadosTab, AjustesTab
  theme.ts         paleta C e tipografia herdadas do artefato
proxy/             Cloudflare Worker opcional (opção B)
resources/         fonte do ícone (SVG + PNG rasterizado) para o @capacitor/assets
scripts/           cópia do sql-wasm.wasm para public/assets
```

Comandos: `npm run dev` · `npm run build` · `npm run typecheck` · `npm run sync` · `npm run android` · `npm run ios`

Para regenerar os ícones após editar `resources/icon.svg` / `icon-foreground.svg` / `icon-background.svg`:

```bash
cd resources && for f in icon icon-foreground icon-background; do rsvg-convert -w 1024 -h 1024 -o "$f.png" "$f.svg"; done
cd .. && npx @capacitor/assets generate --android --ios --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000'
```

(`rsvg-convert` vem do `librsvg`: `brew install librsvg`.)

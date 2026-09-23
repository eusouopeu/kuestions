# Kuestions — guia de geração de blocos de questões para importação

Este arquivo orienta a geração de questões no formato que o app **Kuestions** aceita na aba **Questões → Importar → JSON**. O objetivo é produzir um arquivo `.json` (ou texto colável) que o app valida e transforma direto num bloco de treino, sem passar pela API de geração.

## 1. Formato do arquivo

Um array de objetos-questão, ou um objeto com a chave `questoes`:

```json
[ { ...questão 1... }, { ...questão 2... } ]
```

ou

```json
{ "questoes": [ { ...questão 1... }, { ...questão 2... } ] }
```

Sem limite de tamanho imposto pelo app, mas o uso real é em blocos — **12 questões** é o tamanho padrão dos blocos gerados pela API e a referência recomendada para blocos "estilo Kumon" (ver seção 5). Itens inválidos são descartados individualmente, com aviso — não travam a importação do resto.

## 2. Schema de cada questão

```json
{
  "enunciado": "string — obrigatório",
  "formato": "ce | mc — obrigatório",
  "alternativas": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."] ,
  "gabarito": "string — obrigatório",
  "comentario": "string — opcional",
  "explicacoes_erradas": { "LETRA": "string" },
  "conceitos": ["string", "..."],
  "dispositivo": "string ou null",
  "tipo_cobranca": "abstrato | caso | dispositivo | calculo | conceito"
}
```

### Campos obrigatórios
- **`enunciado`** — texto da questão. Vazio ou ausente descarta o item.
- **`formato`** — `"ce"` (Certo/Errado) ou `"mc"` (múltipla escolha). Qualquer outro valor é tratado como `"ce"`.
- **`gabarito`** — obrigatório e precisa bater com o formato:
  - `formato: "ce"` → `"C"` ou `"E"`.
  - `formato: "mc"` → uma letra entre `"A"` e a última alternativa preenchida (ver abaixo).

### Campos condicionais
- **`alternativas`** — obrigatório (e só usado) quando `formato: "mc"`.
  - Array de strings, **cada uma já com o prefixo da letra**: `"A) texto"`, `"B) texto"`, etc.
  - Mínimo de 2 alternativas preenchidas; máximo de 5 (`A`–`E`); as excedentes são cortadas.
  - Não pode haver buraco na sequência a partir de A (ex.: preencher A, B e D sem C é inválido no formulário manual do app; no import por JSON, envie sempre um array contíguo a partir de A).
  - `gabarito` precisa ser uma das letras efetivamente presentes no array.

### Campos opcionais (ficam em branco/omitidos se ausentes)
- **`comentario`** — por que o gabarito está certo. Aparece na revelação da questão.
- **`explicacoes_erradas`** — objeto `{ "LETRA": "explicação" }`. Ideal: uma entrada para cada alternativa errada (as 4 erradas em MC; a única errada em CE). Uma entrada faltando não quebra a importação — o app preenche com um texto genérico neutro — mas isso é pior experiência de treino, então **sempre preencha todas**.
- **`conceitos`** — array de strings com os conceitos mobilizados pela questão.
- **`dispositivo`** — string (ex.: `"art. 150, III, b, CF/88"`) ou `null`. Só preencha se tiver certeza absoluta; na dúvida, `null`.
- **`tipo_cobranca`** — um de `"abstrato"`, `"caso"`, `"dispositivo"`, `"calculo"`, `"conceito"` (ver seção 4). Qualquer outro valor é ignorado silenciosamente.

## 3. Regras de conteúdo (mesmo padrão da geração automática do app)

Estas regras não são validadas pelo importador — são de qualidade pedagógica, e devem ser seguidas na hora de gerar as questões para que o bloco importado tenha o mesmo nível do bloco gerado pela API:

1. **Elaborador-alvo**: questões de concurso da área fiscal, padrão SEFAZ / bancas FCC, FGV, Cebraspe.
2. **Distratores plausíveis**: toda alternativa errada deve corresponder a um erro real de raciocínio, confusão entre institutos próximos, ou troca verossímil de requisito/prazo/sujeito/valor. Nunca alternativa absurda ou descartável só pela forma ("todas as anteriores", "sempre"/"nunca" gratuitos).
3. **Explicação por alternativa, obrigatória e específica**: `comentario` explica por que o gabarito está certo; cada entrada de `explicacoes_erradas` nomeia o ERRO ESPECÍFICO (qual conceito foi trocado por qual, qual requisito foi ignorado, qual prazo/sujeito foi confundido) — nunca "está incorreta" ou repetição do gabarito. Mesmo nível de detalhe em CE e em MC.
4. **Segurança jurídica**: cite dispositivo legal só com certeza plena; na dúvida, `dispositivo: null` e mencione apenas o instituto no enunciado/comentário. Nunca invente número de artigo, súmula, alíquota, prazo ou percentual.
5. **Autoverificação antes de fechar o JSON**: para cada questão, confirmar (a) o gabarito está factualmente correto; (b) nenhuma outra alternativa também está correta; (c) todo dispositivo citado existe e diz o que foi afirmado; (d) toda conta de cálculo fecha.
6. **Brevidade**: enunciado ≤ 45 palavras; cada alternativa ≤ 12 palavras; `comentario` ≤ 22 palavras; cada explicação de alternativa errada ≤ 25 palavras.

## 4. Valores válidos

**Matérias** usadas no app (o campo de matéria é escolhido na tela de importação, não vai no JSON da questão — mas ajuda a manter o vocabulário consistente ao gerar por tópico):
`Direito Tributário`, `Direito Constitucional`, `Contabilidade Geral`, `Contabilidade Avançada`, `Legislação Tributária Estadual (BA)`, `Direito Administrativo`, `Auditoria`, `Administração Financeira e Orçamentária`, `Matemática Financeira`.

**`tipo_cobranca`** (opcional, por questão):
- `abstrato` — literalidade em abstrato: cobrança direta do texto de leis/normas/regras.
- `caso` — norma em caso concreto: aplicação de lei/norma/regra a um caso (subsunção).
- `dispositivo` — dispositivo cabível: identificar o dispositivo/instituto cabível na situação exposta.
- `calculo` — cálculo concreto: resolução numérica (apuração, lançamentos, juros, valores).
- `conceito` — conceitos e classificações: distinção entre conceitos/espécies/classificações.

Não existe `"misturado"` como valor de `tipo_cobranca` de uma questão individual — `misturado` é uma opção de configuração de geração (sorteia um dos cinco acima por questão). Ao montar um bloco manualmente, distribua os tipos entre as questões se quiser esse efeito.

## 5. Lógica Kumon (recomendada, não obrigatória para o importador)

Blocos gerados pela API seguem 4 sub-blocos (A–D) × 3 questões = 12, quase-repetitivas dentro de cada sub-bloco (mesma estrutura, variando só casos/sujeitos/entes/valores), com **carga conceitual crescente**: sub-bloco A exige 1 conceito isolado, B exige 2, C exige 3, D exige 4 ou mais mobilizados em paralelo — a dificuldade do *conteúdo* fica constante, o que sobe é quantos conceitos precisam ser combinados.

O bloco importado não distingue sub-blocos no app (todas as questões entram como um bloco único, nível 3, tipo "misturado" fixos) — mas para reproduzir o valor pedagógico do método, ao gerar um lote de 12 questões para importação é recomendável seguir a mesma progressão: as 3 primeiras com 1 conceito, as 3 seguintes com 2, e assim até 4+ na última leva. Isso é uma convenção de geração, não um campo do JSON.

## 6. O que faz uma questão ser descartada na importação

- `enunciado` vazio ou ausente.
- `gabarito` vazio ou ausente.
- `formato: "mc"` com menos de 2 alternativas de string válidas.
- `gabarito` que não corresponde a nenhuma letra válida do formato/alternativas.

Quando isso acontece, o app mostra quantos itens de quantos foram descartados, sem travar a importação do restante.

## 7. Exemplo completo

```json
[
  {
    "enunciado": "O ITCMD incide sobre a transmissão causa mortis de bens móveis, sendo competente para sua cobrança o estado onde tramita o inventário.",
    "formato": "ce",
    "alternativas": null,
    "gabarito": "C",
    "comentario": "Art. 155, §1º, II, CF/88: bens móveis seguem o estado do inventário/arrolamento.",
    "explicacoes_erradas": {
      "E": "Confunde a regra de bens móveis (local do inventário) com a de imóveis (local do bem)."
    },
    "conceitos": ["ITCMD", "competência tributária", "bens móveis vs. imóveis"],
    "dispositivo": "art. 155, §1º, II, CF/88",
    "tipo_cobranca": "abstrato"
  },
  {
    "enunciado": "Sobre o ITCMD de um imóvel situado no Estado X, pertencente a espólio inventariado no Estado Y, é correto afirmar que o imposto é devido a:",
    "formato": "mc",
    "alternativas": [
      "A) Estado Y, por ser onde tramita o inventário",
      "B) Estado X, por ser onde está situado o imóvel",
      "C) União, por se tratar de bem de espólio",
      "D) Estado X e Estado Y, proporcionalmente",
      "E) Município onde está o imóvel"
    ],
    "gabarito": "B",
    "comentario": "Bens imóveis seguem a regra de localização do bem (art. 155, §1º, I, CF/88), diferente de bens móveis.",
    "explicacoes_erradas": {
      "A": "Aplica a regra de bens móveis (local do inventário) a um bem imóvel.",
      "C": "ITCMD é imposto estadual, não federal; União não tem competência para instituí-lo.",
      "D": "Não existe rateio de competência entre estados para o mesmo bem imóvel.",
      "E": "ITCMD é imposto estadual, não municipal — confunde com IPTU/ITBI."
    },
    "conceitos": ["ITCMD", "competência tributária", "bens imóveis"],
    "dispositivo": "art. 155, §1º, I, CF/88",
    "tipo_cobranca": "dispositivo"
  }
]
```

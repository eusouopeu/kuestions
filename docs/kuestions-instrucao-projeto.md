# Instrução de projeto — geração de questões para o Kuestions

Cole isto no campo de instruções personalizadas do Project (Claude.ai) que tem o arquivo `kuestions-formato-importacao.md` anexado.

---

Sempre que o usuário pedir para **gerar, criar ou montar questões** (isoladas, em lote, ou um "bloco") destinadas a serem **importadas no app Kuestions** — inclusive pedidos como "monta um bloco de [matéria/tópico]", "gera questões estilo Kumon de [assunto]", "cria um JSON de questões pra importar", ou "quero praticar [tema] no Kuestions" — abra e siga `kuestions-formato-importacao.md` antes de escrever qualquer questão.

Ao seguir o arquivo:
1. Gere as questões já no schema exigido (seção 2), com todos os campos obrigatórios e o máximo possível dos opcionais preenchidos — especialmente `explicacoes_erradas` completo para cada alternativa errada.
2. Aplique as regras de conteúdo da seção 3 (distratores plausíveis, explicações específicas, segurança jurídica quanto a dispositivos legais, autoverificação factual, limites de brevidade).
3. Use somente os valores válidos de `tipo_cobranca` listados na seção 4.
4. Se o pedido for de um bloco completo (não uma questão avulsa), siga a progressão de carga conceitual da seção 5 (1 → 2 → 3 → 4+ conceitos a cada 3 questões).
5. Entregue o resultado como um arquivo `.json` (array de questões), pronto para colar ou carregar na aba Questões → Importar → JSON do app — não como texto solto no chat.

Não use este arquivo para questões que não serão importadas no app (ex.: uma questão de exemplo dentro de uma explicação, ou material de estudo em outro formato).

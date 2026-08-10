# Documentação Técnica — Front-end (Finanças)

Este documento cobre os três scripts principais do front-end do projeto Finanças: `login.js`, `script.js` e `dashboard.js`. Ele descreve a arquitetura, as decisões de design e o funcionamento interno de cada módulo, para servir como referência técnica.

> **Escopo:** documentação de código já implementado. Não cobre o back-end (`financas-email-api`), que possui documentação própria.

---

## 1. Visão geral da arquitetura

O front-end é organizado em três scripts com responsabilidades separadas por tela:

| Arquivo | Tela | Responsabilidade principal |
|---|---|---|
| `login.js` | `login.html` | Cadastro, login, 2FA por e-mail, recuperação de senha |
| `script.js` | `perfil.html` (perfil/configurações) | Dados do usuário, tema claro/escuro, i18n, exclusão de conta |
| `dashboard.js` | `dashboard.html` | Gráfico financeiro, planilha de despesas, calculadora, metas |

**Padrões comuns aos três arquivos:**

- **Sem framework** — JavaScript puro (vanilla), manipulando o DOM diretamente. Bootstrap 5 é usado para modais e componentes de UI; Chart.js para o gráfico.
- **Isolamento de dados por conta** — toda chave de `localStorage` é atrelada com o `id` do usuário (vindo do MySQL via back-end), através da função `chaveUsuario(nomeBase)`. Isso garante que, no mesmo navegador, duas contas diferentes nunca leem ou escrevem os dados uma da outra.
- **Sessão em `sessionStorage`** — `usuarioId`, `usuarioNome` e `usuarioEmail` ficam em `sessionStorage` (não em `localStorage`), então a sessão expira ao fechar a aba/janela.(tela de login)
- **i18n via objeto `traducoes`** — definido em `i18n.js` (carregado antes destes scripts), é um dicionário `{ idioma: { chave: texto } }`. Cada arquivo implementa sua própria função `traduzir(chave)` com padronização para português caso não encontre opção escolhida pelo usuário. 
- **Comunicação com back-end via `fetch`** — todas as chamadas HTTP usam `AbortSignal.timeout(...)` para evitar que a UI fique travada esperando indefinidamente se o servidor não responder.

---

## 2. `login.js`

### 2.1 Configuração e sessão

```js
const API = 'http://127.0.0.1:8080/api';
```

Aponta para a API Spring Boot local. `chaveUsuario(nomeBase, idUsuario)` monta chaves como `dois_fatores_42`, permitindo passar um `idUsuario` explícito (usado, por exemplo, ao checar preferências de notificação de um usuário que acabou de logar, antes da sessão global estar 100% propagada).

`detectarIdiomaNavegador()` mapeia o idioma do navegador (`navigator.language`, ex: `"ja-JP"`) para um dos 9 códigos suportados pelo `i18n.js`. É usado só como fallback no primeiro acesso, antes de existir preferência salva. A solução implementada por mim foi a estrutura de dados HashMap dentro de outra HashMap, o primeiro hash atrela a chave do idioma ao idioma, e o segundo atrela o idioma as traduções na tabela de traduções (i18n.js).

### 2.2 Cadastro (`cadastrarUsuario`)

Fluxo:
1. Valida nome, e-mail (regex simples) e senha (mínimo 6 caracteres) no client-side.
2. Envia `POST /usuarios/cadastro` com `{ nome, email, senha }`.
3. Em caso de sucesso, chama `salvarSessao(usuario)` — grava `id`, `nome`, `email` no `sessionStorage` — e redireciona para `dashboard.html` após 1.5s (tempo para o usuário ver a mensagem de sucesso).
4. O e-mail de boas-vindas é responsabilidade do back-end; o front não dispara nada adicional.

### 2.3 Login (`fazerLogin`)

1. Valida campos preenchidos.
2. `POST /usuarios/login` com `{ email, senha }`.
3. Se a conta tiver 2FA ativado (checado via `localStorage` isolado por conta), abre o modal de verificação (`abrirModal2FALogin`) em vez de redirecionar direto.
4. Se não tiver 2FA, chama `notificarLogin(usuario)` (e-mail de aviso de novo login, respeitando a preferência `notificacoesAtivas`) e redireciona para o dashboard.

### 2.4 Autenticação de dois fatores (2FA)

O código do 2FA **nunca existe no navegador** — é gerado e validado inteiramente no servidor. O front-end só:

- Envio (`enviarCodigo2FA`, `POST /2fa/enviar`);
- Mostra um contador regressivo de 5 minutos (`DURACAO_CODIGO_2FA_MS`), sincronizado com o prazo do backend;
- Envia o código digitado pro servidor validar (`verificar2FALogin`, `POST /2fa/verificar`).

O estado do modal (id/nome/e-mail do usuário, horário de expiração) é guardado em `dataset` do próprio elemento do modal — evita variáveis globais extras e mantém o estado colado ao componente de UI que o usa.

### 2.5 Recuperação de senha ("esqueci minha senha")

Fluxo em duas etapas, dentro do mesmo modal:

1. **Etapa 1** (`enviarCodigoRecuperacao`) — usuário informa o e-mail. `POST /senha/esqueci`. O front **sempre passa** para a etapa 2, independentemente de o e-mail existir ou não no banco — decisão de segurança para não revelar quais e-mails têm conta cadastrada (o backend segue essa mesma lógica).
2. **Etapa 2** (`redefinirSenha`) — usuário informa o código recebido e a nova senha (com confirmação). `POST /senha/redefinir`. Em caso de sucesso, mostra tela de confirmação e fecha o modal automaticamente após 2s.

Assim como no 2FA, há um contador regressivo (`DURACAO_CODIGO_RESET_MS`, 15 minutos) e botão de reenvio (`reenviarCodigoRecuperacao`), que reinicia o timer e limpa o campo de código.

Todo o estado do modelo é resetado no evento `hidden.bs.modal`, evitando que dados de uma tentativa anterior vazem para a próxima abertura.

### 2.6 UX: "Enter inteligente"

Um único listener global de `keydown` decide qual ação disparar ao pressionar Enter, verificando qual modal está com a classe `show` no momento (2FA, cadastro, ou login por padrão). Evita duplicar listeners por formulário. 

---

## 3. `script.js` (Perfil / Configurações)

### 3.1 Sanitização de entrada

```js
function sanitizarTexto(textoInseguro) { ... }
```

Escapa manualmente os metacaracteres HTML (`&`, `<`, `>`, `"`, `'`, `/`) antes de inserir nome/e-mail do usuário no DOM via `textContent`/`value`, prevenindo XSS refletido a partir de dados vindos do `sessionStorage`.

### 3.2 Carregamento inicial da página de perfil

No `DOMContentLoaded`:
1. Lê a sessão; sem `idUsuario` ou `email`, redireciona para `login.html` (rota protegida no client-side).
2. Preenche nome, e-mail e a inicial do avatar.
3. Sincroniza os toggles de **notificações por e-mail** e **2FA** com o valor salvo em `localStorage`, isolado por conta.

### 3.3 Internacionalização (i18n)

`aplicarTraducaoAtual()` é a função central: percorre todos os elementos `[data-i18n]` e substitui o `textContent` pela tradução correspondente ao idioma salvo. Também dispara a os elementos na planilha (`renderPlanilha()`) e do gráfico (`atualizarIdiomaDoGrafico()`) **se esses componentes já existirem na página** — é o que permite trocar o idioma em tempo real, sem recarregar a página, mesmo em telas com gráfico/planilha ativos.

`mudarIdioma(idiomaSelecionado)` grava a preferência isolada por conta **e** uma cópia "global" (`idiomaPreferido_global`, sem sufixo de id) — usada pela tela de login para lembrar o último idioma escolhido antes mesmo de o usuário estar autenticado.

### 3.4 Tema claro/escuro (`aplicarTema`)

Implementação manual (sem CSS custom properties/variáveis de tema): a função varre seletores específicos (`.card-secao`, `.secao-titulo`, `.campo-label`, etc.) e aplica cores inline diretamente via `style`, com um bloco `if/else` para tema claro e outro para escuro.

Um ponto de atenção tratado explicitamente: o gráfico Chart.js não herda estilos CSS da página, então suas cores (legenda, eixos, grade, e a escala radial usada nos gráficos tipo radar) são inseridas manualmente dentro da mesma função, com um bloco dedicado para `myChart.options.scales.r` (radar).


### 3.5 Salvar perfil (`salvarPerfil`)

`PUT /usuarios/{id}` com nome e e-mail sanitizados. Usa `Promise.all` combinando a requisição com um `setTimeout` de 800ms — garante que o estado visual "Salvando..." apareça por tempo suficiente para o usuário perceber o feedback, mesmo se a API responder quase instantaneamente.

### 3.6 Exclusão de conta

Fluxo de segurança em três funções:

1. `abrirModalExclusaoConta()` — abre o modal e desabilita o botão de confirmação.
2. `validarConfirmacaoExclusao()` — só libera o botão quando o usuário digita exatamente `"EXCLUIR"` no campo de confirmação (case-insensitive, com `trim()`).
3. `confirmarExclusaoConta()` — `DELETE /usuarios/{id}`. Em caso de sucesso, chama `limparLocalStorageDaConta(idUsuario)` (remove **todas** as chaves de `localStorage` que terminam com `_{id}` — dados financeiros, tema, idioma, etc.), limpa a sessão e redireciona para o login.

O texto de confirmação e as mensagens de erro têm dicionário próprio por idioma (`textosExclusao`), resolvido a partir dos dois primeiros caracteres do idioma salvo.

---

## 4. `dashboard.js`

Este é o script mais extenso, dividido em seções claramente comentadas no próprio arquivo.

### 4.1 Gráfico (Chart.js)

O gráfico principal (`myChart`) nasce como barras (Entrada vs. Saída por mês), com tooltip formatando valores em `R$` e eixo Y com incrementos de R$ 1.000.

`mudarGrafico(tipo)` permite trocar o tipo de visualização (barra, linha, doughnut, polarArea, radar) via um FAB (botão flutuante) com menu (`toggleFab`). Como o Chart.js não permite trocar o `type` de uma instância existente, a função **destrói e recria** o gráfico (`myChart.destroy()`), preservando os dados atuais. Tipos "circulares" (doughnut/polarArea/radar) usam uma paleta de cores por mês em vez das duas cores fixas de Entrada/Saída, já que esses gráficos não têm eixos para diferenciar as séries visualmente da mesma forma.

Após recriar o gráfico, `aplicarTema()` (de `script.js`) é chamada novamente para repintar o novo `myChart` com as cores do tema ativo — necessário porque uma instância nova sempre nasce com as cores padrão do modo claro.

### 4.2 Persistência financeira (`localStorage`)

Toda a state financeira (entradas, saídas, meta, dados do gráfico, planilhas) é criadao em um único objeto e salva sob uma chave por conta (`chaveDadosFinanceiros()`):

```js
{ totalEntrada, totalSaida, mesAnoReferencia, meta, graficoEntrada, graficoSaida, abas, abaAtiva }
```

Esse dado **nunca é enviado ao back-end** — é uma decisão de privacidade mantida desde o início do projeto (dados financeiros pessoais ficam só no dispositivo do usuário).

`obterMesAnoAtual()` gera uma chave tipo `"2026-7"`. Ao carregar o estado salvo, se o mês/ano salvo for diferente do atual, `totalEntrada`/`totalSaida` são zerados automaticamente — os totais representam sempre o mês atual, não um acumulado histórico.

### 4.3 Formatação monetária com i18n

```js
const LOCALES_MOEDA = { pt: 'pt-BR', en: 'en-US', ... };
function formatBRL(v) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(v);
}
```

Ponto importante: o **valor sempre está em Real (BRL)** — não há conversão de moeda. Só a *formatação* (posição do símbolo, separador decimal/milhar) muda conforme o idioma escolhido, via `Intl.NumberFormat`.

### 4.4 Badges de saldo e percentuais

`atualizarBadgeSaldo(saldo)` classifica o saldo em três estados visuais (positivo/negativo/neutro) e aplica classes CSS + texto traduzido correspondentes.

`atualizarBadgesPercentuais()` calcula, a cada atualização, a fatia percentual de entrada e saída sobre o total movimentado no mês:

```
% saída   = (totalSaida / totalEntrada) × 100
% entrada = 100% − % saída
```

Se a saída ultrapassa a entrada, o percentual de entrada fica negativo — comportamento intencional para sinalizar déficit. O cálculo é sempre refeito do zero a partir dos totais atuais (não depende de nenhuma base fixa acumulada), então funciona independente de quantas vezes o usuário registrar novos valores.

### 4.5 Registro de saldo e despesas

- `atualizarSaldo(fechar)` — soma os valores digitados de entrada/saída aos totais, atualiza cards, gráfico e badges, e persiste.
- `cadastrarDespesas()` — soma um conjunto fixo de campos de despesa (`cad_luz`, `cad_agua`, `cad_internet`, `cad_aluguel`, `cad_comida`, `cad_lazer`) e lança o total como saída.
- `removerDadosSaldo()` — zera entrada/saída do mês, com confirmação (`confirm()`) traduzida nos 9 idiomas antes de executar, por ser uma ação destrutiva.

### 4.6 Calculadora

Implementação de calculadora de quatro operações com máquina de estados simples (`calcCurrent`, `calcPrev`, `calcOperator`, `calcNewNum`):

- `calcOp(op)` — se já havia uma operação pendente, resolve ela primeiro (permite encadear operações: `5 + 3 + 2` calcula o `5+3` antes de continuar).
- `calcEquals(silent)` — o parâmetro `silent` diferencia "calcular e manter a operação visível" (usado internamente pelo encadeamento) de "calcular e finalizar" (usado pelo botão `=`).
- Divisão por zero retorna a string `'Erro'` em vez de lançar exceção.

### 4.7 Planilha de despesas (funcionalidade mais complexa do módulo)

**Modelo de dados:** cada aba (`abas[]`) tem `{ nome, dados, mesclas }`, onde `dados` é um dicionário plano `{ "r{linha}_c{coluna}": valor }` — 100 linhas de categoria × 12 colunas de mês.

**Abas (múltiplas planilhas):**
- `criarAba`, `novaAba`, `ativarAba`, `excluirAba`, `iniciarRenomeacaoAba` gerenciam múltiplas planilhas por conta (ex: uma por mês, ou por finalidade).
- A renomeação de aba edita o nome **inline**,(em linha) substituindo o conteúdo da própria aba por um `<input>`, em vez de usar `window.prompt()` — decisão registrada em comentário no código, já que o Electron não dá suporte a `window.prompt()` ([electron/electron#472](https://github.com/electron/electron/issues/472)).

**Seleção de células (estilo Excel):** `iniciarSelecaoPlanilha`/`estenderSelecaoPlanilha` implementam clique-e-arraste sobre `<td>`, guardando início/fim em `selecaoPlanilha`. Um listener global de `mouseup` encerra o arrasto mesmo se o mouse for solto fora da tabela.

**Mesclagem de colunas (`mesclas`):** o usuário seleciona um intervalo de colunas de uma única linha e escolhe uma operação (soma, subtração, multiplicação, divisão). Isso **não altera os dados da grade** — afeta apenas a exibição da linha "Total", que passa a mostrar uma célula combinada (com `colspan`) representando o resultado da operação sobre aquele intervalo. Regras de validação: não permite mesclar uma única coluna, nem mesclar sobre um intervalo que já tem mesclagem ativa (`sobrepoe`).

**Redimensionamento de colunas:** arrastar a borda de um cabeçalho (`iniciarRedimensionamentoColuna`) ajusta a largura via elementos `<col>` de um `<colgroup>` — abordagem escolhida porque é a forma confiável de controlar a largura de uma coluna inteira em HTML sem desalinhar cabeçalho, corpo e linha de total. As larguras são persistidas separadamente (`larguraColunasPlanilha`), por ser preferência visual e não dado financeiro.

**Renderização (`renderPlanilha`):** reconstrói `<thead>` e `<tbody>` inteiros a partir do estado. Para performance em edições simples (digitar em uma célula), `atualizarLinhaTotal()` recalcula **só a linha de Total**, sem re-renderizar a tabela toda a cada tecla digitada (chamada via `oninput` nos campos).

**Busca por data (`pesquisarData`):** destaca visualmente a coluna do mês correspondente à data pesquisada e mostra o total já calculado daquele mês.

**Modo tela cheia (`toggleFullscreen`):** expande o modal da planilha para ocupar `100vw`/`100vh`, ajustando a altura máxima da área rolável.



































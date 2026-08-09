# Technical Documentation — Front-end (Finanças)

This document covers the three main front-end scripts of the Finanças project: `login.js`, `script.js`, and `dashboard.js`. It describes the architecture, design decisions, and internal workings of each module, serving as technical reference.

> **Scope:** documentation of already-implemented code. Does not cover the back-end (`financas-email-api`), which has its own documentation.

---

## 1. Architecture overview

The front-end is organized into three scripts with responsibilities separated by screen:

| File | Screen | Main responsibility |
|---|---|---|
| `login.js` | `login.html` | Sign-up, login, email-based 2FA, password recovery |
| `script.js` | `perfil.html` (profile/settings) | User data, light/dark theme, i18n, account deletion |
| `dashboard.js` | `dashboard.html` | Financial chart, expense spreadsheet, calculator, goals |

**Patterns common to all three files:**

- **No framework** — plain (vanilla) JavaScript, manipulating the DOM directly. Bootstrap 5 is used for modals and UI components; Chart.js for the chart.
- **Per-account data isolation** — every `localStorage` key is tied to the user's `id` (coming from MySQL via the back-end), through the `chaveUsuario(nomeBase)` function. This ensures that, in the same browser, two different accounts never read or write each other's data.
- **Session in `sessionStorage`** — `usuarioId`, `usuarioNome`, and `usuarioEmail` live in `sessionStorage` (not `localStorage`), so the session expires when the tab/window is closed (login screen).
- **i18n via the `traducoes` object** — defined in `i18n.js` (loaded before these scripts), it's a `{ language: { key: text } }` dictionary. Each file implements its own `traduzir(chave)` function, defaulting to Portuguese if the user's chosen option isn't found.
- **Communication with the back-end via `fetch`** — all HTTP calls use `AbortSignal.timeout(...)` to prevent the UI from hanging indefinitely if the server doesn't respond.

---

## 2. `login.js`

### 2.1 Configuration and session

```js
const API = 'http://127.0.0.1:8080/api';
```

Points to the local Spring Boot API. `chaveUsuario(nomeBase, idUsuario)` builds keys like `dois_fatores_42`, allowing an explicit `idUsuario` to be passed (used, for example, when checking notification preferences for a user who just logged in, before the global session is fully propagated).

`detectarIdiomaNavegador()` maps the browser's language (`navigator.language`, e.g. `"ja-JP"`) to one of the 9 language codes supported by `i18n.js`. It's used only as a fallback on first access, before any saved preference exists. The solution I implemented is a HashMap-within-a-HashMap data structure: the first hash maps the language key to the language, and the second maps the language to its translations in the translation table (`i18n.js`).

### 2.2 Sign-up (`cadastrarUsuario`)

Flow:
1. Validates name, email (simple regex), and password (minimum 6 characters) client-side.
2. Sends `POST /usuarios/cadastro` with `{ nome, email, senha }`.
3. On success, calls `salvarSessao(usuario)` — stores `id`, `nome`, `email` in `sessionStorage` — and redirects to `dashboard.html` after 1.5s (giving the user time to see the success message).
4. The welcome email is the back-end's responsibility; the front-end doesn't trigger anything additional.

### 2.3 Login (`fazerLogin`)

1. Validates filled fields.
2. `POST /usuarios/login` with `{ email, senha }`.
3. If the account has 2FA enabled (checked via `localStorage`, isolated per account), opens the verification modal (`abrirModal2FALogin`) instead of redirecting directly.
4. If 2FA is not enabled, calls `notificarLogin(usuario)` (new-login warning email, respecting the `notificacoesAtivas` preference) and redirects to the dashboard.

### 2.4 Two-factor authentication (2FA)

The 2FA code **never exists in the browser** — it's generated and validated entirely on the server. The front-end only:

- Sends the request (`enviarCodigo2FA`, `POST /2fa/enviar`);
- Shows a 5-minute countdown (`DURACAO_CODIGO_2FA_MS`), synced with the backend's deadline;
- Sends the entered code to the server for validation (`verificar2FALogin`, `POST /2fa/verificar`).

The modal's state (user id/name/email, expiration time) is stored in the modal element's own `dataset` — this avoids extra global variables and keeps the state attached to the UI component that uses it.

### 2.5 Password recovery ("forgot my password")

Two-step flow, within the same modal:

1. **Step 1** (`enviarCodigoRecuperacao`) — the user provides their email. `POST /senha/esqueci`. The front-end **always advances** to step 2, regardless of whether the email exists in the database or not — a security decision to avoid revealing which emails have a registered account (the backend follows this same logic).
2. **Step 2** (`redefinirSenha`) — the user enters the received code and the new password (with confirmation). `POST /senha/redefinir`. On success, shows a confirmation screen and closes the modal automatically after 2s.

As with 2FA, there's a countdown (`DURACAO_CODIGO_RESET_MS`, 15 minutes) and a resend button (`reenviarCodigoRecuperacao`), which restarts the timer and clears the code field.

The entire modal state is reset on the `hidden.bs.modal` event, preventing data from a previous attempt from leaking into the next time it's opened.

### 2.6 UX: "smart Enter"

A single global `keydown` listener decides which action to trigger when Enter is pressed, checking which modal currently has the `show` class (2FA, sign-up, or login by default). This avoids duplicating listeners per form.

---

## 3. `script.js` (Profile / Settings)

### 3.1 Input sanitization

```js
function sanitizarTexto(textoInseguro) { ... }
```

Manually escapes HTML metacharacters (`&`, `<`, `>`, `"`, `'`, `/`) before inserting the user's name/email into the DOM via `textContent`/`value`, preventing reflected XSS from data coming out of `sessionStorage`.

### 3.2 Initial loading of the profile page

On `DOMContentLoaded`:
1. Reads the session; without `idUsuario` or `email`, redirects to `login.html` (client-side protected route).
2. Fills in name, email, and the avatar initial.
3. Syncs the **email notifications** and **2FA** toggles with the value saved in `localStorage`, isolated per account.

### 3.3 Internationalization (i18n)

`aplicarTraducaoAtual()` is the central function: it iterates over every `[data-i18n]` element and replaces its `textContent` with the translation matching the saved language. It also refreshes the spreadsheet elements (`renderPlanilha()`) and the chart (`atualizarIdiomaDoGrafico()`) **if those components already exist on the page** — this is what allows switching the language in real time, without reloading the page, even on screens with an active chart/spreadsheet.

`mudarIdioma(idiomaSelecionado)` saves the preference isolated per account **and** a "global" copy (`idiomaPreferido_global`, with no id suffix) — used by the login screen to remember the last chosen language even before the user is authenticated.

### 3.4 Light/dark theme (`aplicarTema`)

Manual implementation (no CSS custom properties/theme variables): the function walks specific selectors (`.card-secao`, `.secao-titulo`, `.campo-label`, etc.) and applies inline colors directly via `style`, with one `if/else` block for the light theme and another for dark.

One point handled explicitly: the Chart.js chart doesn't inherit the page's CSS styles, so its colors (legend, axes, grid, and the radial scale used in radar-type charts) are set manually inside the same function, with a dedicated block for `myChart.options.scales.r` (radar).

### 3.5 Save profile (`salvarPerfil`)

`PUT /usuarios/{id}` with sanitized name and email. Uses `Promise.all` combining the request with an 800ms `setTimeout` — this guarantees the "Saving..." visual state appears long enough for the user to notice the feedback, even if the API responds almost instantly.

### 3.6 Account deletion

Three-function security flow:

1. `abrirModalExclusaoConta()` — opens the modal and disables the confirmation button.
2. `validarConfirmacaoExclusao()` — only enables the button once the user types exactly `"EXCLUIR"` in the confirmation field (case-insensitive, with `trim()`).
3. `confirmarExclusaoConta()` — `DELETE /usuarios/{id}`. On success, calls `limparLocalStorageDaConta(idUsuario)` (removes **all** `localStorage` keys ending in `_{id}` — financial data, theme, language, etc.), clears the session, and redirects to login.

The confirmation text and error messages have their own per-language dictionary (`textosExclusao`), resolved from the first two characters of the saved language.

---

## 4. `dashboard.js`

This is the largest script, divided into clearly commented sections within the file itself.

### 4.1 Chart (Chart.js)

The main chart (`myChart`) starts out as a bar chart (Income vs. Expense per month), with a tooltip formatting values in `R$` and a Y axis with increments of R$ 1,000.

`mudarGrafico(tipo)` allows switching the visualization type (bar, line, doughnut, polarArea, radar) via a FAB (floating action button) with a menu (`toggleFab`). Since Chart.js doesn't allow changing the `type` of an existing instance, the function **destroys and recreates** the chart (`myChart.destroy()`), preserving the current data. "Circular" types (doughnut/polarArea/radar) use a per-month color palette instead of the two fixed Income/Expense colors, since these chart types have no axes to visually differentiate series the same way.

After recreating the chart, `aplicarTema()` (from `script.js`) is called again to repaint the new `myChart` with the active theme's colors — necessary because a new instance always starts with the default light-mode colors.

### 4.2 Financial data persistence (`localStorage`)

All financial state (income, expenses, goal, chart data, spreadsheets) is built into a single object and saved under one key per account (`chaveDadosFinanceiros()`):

```js
{ totalEntrada, totalSaida, mesAnoReferencia, meta, graficoEntrada, graficoSaida, abas, abaAtiva }
```

This data is **never sent to the back-end** — a privacy decision maintained since the start of the project (personal financial data stays only on the user's device).

`obterMesAnoAtual()` generates a key like `"2026-7"`. When the saved state is loaded, if the saved month/year differs from the current one, `totalEntrada`/`totalSaida` are automatically reset to zero — the totals always represent the current month, not a historical accumulation.

### 4.3 Currency formatting with i18n

```js
const LOCALES_MOEDA = { pt: 'pt-BR', en: 'en-US', ... };
function formatBRL(v) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(v);
}
```

Important point: the **value is always in Brazilian Real (BRL)** — there's no currency conversion. Only the *formatting* (symbol position, decimal/thousands separator) changes according to the chosen language, via `Intl.NumberFormat`.

### 4.4 Balance and percentage badges

`atualizarBadgeSaldo(saldo)` classifies the balance into three visual states (positive/negative/neutral) and applies the corresponding CSS classes and translated text.

`atualizarBadgesPercentuais()` calculates, on every update, the percentage share of income and expense out of the total moved during the month:

```
% expense = (totalSaida / totalEntrada) × 100
% income  = 100% − % expense
```

If expenses exceed income, the income percentage goes negative — intentional behavior to flag a deficit. The calculation is always redone from scratch based on the current totals (it doesn't depend on any fixed accumulated base), so it works no matter how many times the user records new values.

### 4.5 Recording balance and expenses

- `atualizarSaldo(fechar)` — adds the entered income/expense values to the totals, updates cards, chart, and badges, and persists the data.
- `cadastrarDespesas()` — sums a fixed set of expense fields (`cad_luz`, `cad_agua`, `cad_internet`, `cad_aluguel`, `cad_comida`, `cad_lazer`) and posts the total as an expense.
- `removerDadosSaldo()` — zeroes out the month's income/expense, with a `confirm()` translated into the 9 languages before executing, since it's a destructive action.

### 4.6 Calculator

Four-operation calculator implementation with a simple state machine (`calcCurrent`, `calcPrev`, `calcOperator`, `calcNewNum`):

- `calcOp(op)` — if an operation was already pending, it's resolved first (allows chaining operations: `5 + 3 + 2` calculates `5+3` before continuing).
- `calcEquals(silent)` — the `silent` parameter differentiates "calculate and keep the operation visible" (used internally for chaining) from "calculate and finish" (used by the `=` button).
- Division by zero returns the string `'Erro'` instead of throwing an exception.

### 4.7 Expense spreadsheet (the module's most complex feature)

**Data model:** each tab (`abas[]`) has `{ nome, dados, mesclas }`, where `dados` is a flat dictionary `{ "r{row}_c{column}": value }` — 100 category rows × 12 month columns.

**Tabs (multiple spreadsheets):**
- `criarAba`, `novaAba`, `ativarAba`, `excluirAba`, `iniciarRenomeacaoAba` manage multiple spreadsheets per account (e.g., one per month, or per purpose).
- Renaming a tab edits the name **inline**, replacing the tab's own content with an `<input>`, instead of using `window.prompt()` — a decision noted in a code comment, since Electron doesn't support `window.prompt()` ([electron/electron#472](https://github.com/electron/electron/issues/472)).

**Cell selection (Excel-style):** `iniciarSelecaoPlanilha`/`estenderSelecaoPlanilha` implement click-and-drag over `<td>` elements, storing the start/end in `selecaoPlanilha`. A global `mouseup` listener ends the drag even if the mouse is released outside the table.

**Column merging (`mesclas`):** the user selects a range of columns within a single row and chooses an operation (addition, subtraction, multiplication, division). This **does not alter the grid data** — it only affects the display of the "Total" row, which then shows a combined cell (with `colspan`) representing the result of the operation over that range. Validation rules: doesn't allow merging a single column, nor merging over a range that already has an active merge (`sobrepoe`).

**Column resizing:** dragging a header's edge (`iniciarRedimensionamentoColuna`) adjusts the width via `<col>` elements inside a `<colgroup>` — this approach was chosen because it's the reliable way to control an entire column's width in HTML without misaligning the header, body, and total row. Widths are persisted separately (`larguraColunasPlanilha`), since it's a visual preference rather than financial data.

**Rendering (`renderPlanilha`):** rebuilds the entire `<thead>` and `<tbody>` from the state. For performance on simple edits (typing into a cell), `atualizarLinhaTotal()` recalculates **only the Total row**, without re-rendering the whole table on every keystroke (called via `oninput` on the fields).

**Search by date (`pesquisarData`):** visually highlights the month column matching the searched date and shows that month's already-calculated total.

**Fullscreen mode (`toggleFullscreen`):** expands the spreadsheet modal to fill `100vw`/`100vh`, adjusting the scrollable area's max height.












































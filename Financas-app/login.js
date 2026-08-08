// ── CONFIGURAÇÃO DA API ───────────────────────────────────────────
const API = 'http://127.0.0.1:8080/api';

// ── SESSÃO E ISOLAMENTO POR CONTA ──────────────────────────────────
// Cada conta é identificada pelo "id" gerado automaticamente pelo MySQL.
// Preferências (idioma, tema, notificações, 2FA) e dados financeiros ficam
// no localStorage, mas SEMPRE prefixados por esse id — assim, contas
// diferentes usando o mesmo computador nunca leem/escrevem uma na outra.

// Monta uma chave de localStorage isolada para a conta logada.
// Ex.: chaveUsuario('dois_fatores') -> 'dois_fatores_42'
function chaveUsuario(nomeBase, idUsuario = sessionStorage.getItem('usuarioId')) {
  return `${nomeBase}_${idUsuario}`;
}

// Mapeia o idioma do navegador (ex.: "ja-JP", "pt-BR") para um dos códigos
// suportados pelo i18n.js. Usado só como fallback quando o usuário ainda
// não tem preferência de idioma salva (primeiro acesso).
function detectarIdiomaNavegador() {
  const mapa = { pt: 'pt', en: 'en', es: 'es', fr: 'fr', de: 'de', ja: 'jp', it: 'it', pl: 'po', nl: 'ne' };
  const idioma = (navigator.language || navigator.userLanguage || 'pt').toLowerCase().split('-')[0];
  return mapa[idioma] || 'pt';
}

// Busca uma chave de tradução no idioma atual do usuário. Se ainda não houver
// preferência salva (primeiro acesso), usa o idioma do navegador como fallback.
function traduzir(chave) {
  const idiomaAtual = localStorage.getItem(chaveUsuario('idiomaPreferido'))
    || localStorage.getItem('idiomaPreferido_global')
    || detectarIdiomaNavegador();
  const dicionario = traducoes[idiomaAtual] || traducoes['pt'];
  return dicionario[chave] || chave;
}

// Chamada pelo login.html no DOMContentLoaded. Traduz todos os elementos
// marcados com data-i18n (texto) e data-i18n-placeholder (placeholder de input).
function applySettings() {
  if (typeof traducoes === 'undefined') {
    console.error("Erro crítico: o objeto 'traducoes' não está definido. Verifique se i18n.js foi carregado antes de login.js.");
    return;
  }

  const idiomaGuardado = localStorage.getItem(chaveUsuario('idiomaPreferido'))
    || localStorage.getItem('idiomaPreferido_global')
    || detectarIdiomaNavegador();

  document.querySelectorAll('[data-i18n]').forEach(elemento => {
    const chave = elemento.getAttribute('data-i18n');
    if (traducoes[idiomaGuardado] && traducoes[idiomaGuardado][chave]) {
      elemento.textContent = traducoes[idiomaGuardado][chave];
    } else {
      console.warn(`Chave de tradução não encontrada: "${chave}" no idioma "${idiomaGuardado}"`);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(elemento => {
    const chave = elemento.getAttribute('data-i18n-placeholder');
    if (traducoes[idiomaGuardado] && traducoes[idiomaGuardado][chave]) {
      elemento.placeholder = traducoes[idiomaGuardado][chave];
    } else {
      console.warn(`Chave de tradução não encontrada: "${chave}" no idioma "${idiomaGuardado}"`);
    }
  });
}

// Grava os dados da sessão atual (chamada logo após cadastro/login com sucesso).
function salvarSessao(usuario) {
  sessionStorage.setItem('usuarioId', usuario.id);
  sessionStorage.setItem('usuarioNome', usuario.nome);
  sessionStorage.setItem('usuarioEmail', usuario.email);
}

// ── CRIAR CONTA ───────────────────────────────────────────────────

function toggleSenha() {
  const inp = document.getElementById('cadSenha');
  const ico = document.getElementById('iconeSenha');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  ico.className = inp.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
}

async function cadastrarUsuario() {
  const nome  = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const senha = document.getElementById('cadSenha').value.trim();

  // Limpa erros anteriores
  ['erroNome', 'erroEmailCad', 'erroSenhaCad'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  let ok = true;
  if (!nome) {
    document.getElementById('erroNome').style.display = 'block';
    ok = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('erroEmailCad').style.display = 'block';
    ok = false;
  }
  if (!senha || senha.length < 6) {
    document.getElementById('erroSenhaCad').style.display = 'block';
    ok = false;
  }
  if (!ok) return;

  // Feedback visual
  const btn = document.getElementById('btnCadastrar');
  btn.textContent = traduzir('login.msg.cadastrando');
  btn.disabled = true;

  // Cadastra direto no banco (MySQL), via a API Java. O e-mail de boas-vindas
  // já é enviado pelo próprio backend — não precisamos chamar isso aqui.
  let usuario;
  try {
    const resposta = await fetch(`${API}/usuarios/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
      signal: AbortSignal.timeout(8000)
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      const el = document.getElementById('erroEmailCad');
      el.textContent = dados.erro || traduzir('login.msg.erro_cadastro_generico');
      el.style.display = 'block';
      btn.textContent = traduzir('login.modal.btn_cadastrar');
      btn.disabled = false;
      return;
    }

    usuario = dados; // { id, nome, email }
  } catch (e) {
    const el = document.getElementById('erroEmailCad');
    el.textContent = traduzir('login.msg.erro_conexao');
    el.style.display = 'block';
    btn.textContent = traduzir('login.modal.btn_cadastrar');
    btn.disabled = false;
    return;
  }

  // Sessão da conta recém-criada — o "id" (vindo do MySQL) é usado para
  // isolar as preferências e os dados financeiros de cada conta.
  salvarSessao(usuario);

  btn.textContent = traduzir('login.msg.cadastrado_sucesso');
  btn.style.background = '#0a2e1f';
  const msgSucesso = document.getElementById('msgSucessoCadastro');
  if (msgSucesso) msgSucesso.style.display = 'block';

  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
}

// Limpa o modal ao fechar
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalCriarConta');
  if (!modal) return;
  modal.addEventListener('hidden.bs.modal', () => {
    ['cadNome', 'cadEmail', 'cadSenha'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['erroNome', 'erroEmailCad', 'erroSenhaCad', 'msgSucessoCadastro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const erroEmailCad = document.getElementById('erroEmailCad');
    if (erroEmailCad) erroEmailCad.textContent = traduzir('login.modal.erro_email');
    const btn = document.getElementById('btnCadastrar');
    if (btn) {
      btn.textContent = traduzir('login.modal.btn_cadastrar');
      btn.style.background = '#1a5c42';
      btn.disabled = false;
    }
  });
});


// ── NOTIFICAÇÃO DE LOGIN POR E-MAIL ────────────────────────────────

// Envia notificação de login via API Java (mesma API usada na confirmação de cadastro)
async function notificarLogin(usuario) {
  const notifAtivas = localStorage.getItem(chaveUsuario('notificacoesAtivas', usuario.id)) !== 'false';
  if (!notifAtivas) return; // usuário desligou a opção no perfil

  try {
    const resposta = await fetch(`${API}/email/notificacao-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: usuario.nome, email: usuario.email }),
      signal: AbortSignal.timeout(5000) // cancela se passar de 5s
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
    }
  } catch (e) {
    if (e.name === 'TimeoutError') {
      console.warn('Notificação de login: tempo limite excedido.');
    } else {
      console.warn('Notificação de login não enviada:', e.message);
    }
  }
}


// ── LOGIN ─────────────────────────────────────────────────────────

async function fazerLogin() {
  const email = document.getElementById('inputEmail').value.trim();
  const senha = document.getElementById('inputSenha').value.trim();

  document.getElementById('erroEmail').style.display = 'none';
  document.getElementById('erroSenha').style.display = 'none';

  let ok = true;
  if (!email) { document.getElementById('erroEmail').style.display = 'block'; ok = false; }
  if (!senha)  { document.getElementById('erroSenha').style.display = 'block'; ok = false; }
  if (!ok) return;

  const btnEntrar = document.getElementById('btnEntrar');
  btnEntrar.disabled = true;

  let usuario;
  try {
    const resposta = await fetch(`${API}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
      signal: AbortSignal.timeout(8000)
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      const erroEmail = document.getElementById('erroEmail');
      erroEmail.textContent = dados.erro || traduzir('login.msg.erro_login_generico');
      erroEmail.style.display = 'block';
      btnEntrar.disabled = false;
      return;
    }

    usuario = dados; // { id, nome, email }
  } catch (e) {
    const erroEmail = document.getElementById('erroEmail');
    erroEmail.textContent = traduzir('login.msg.erro_conexao');
    erroEmail.style.display = 'block';
    btnEntrar.disabled = false;
    return;
  }

  // Sessão da conta logada — o "id" isola as preferências e os dados financeiros.
  salvarSessao(usuario);

  // Verifica 2FA (preferência isolada por conta)
  const dois_fatores = localStorage.getItem(chaveUsuario('dois_fatores', usuario.id)) === 'true';

  if (dois_fatores) {
    btnEntrar.disabled = false;
    abrirModal2FALogin(usuario);
  } else {
    btnEntrar.textContent = `${traduzir('login.msg.entrando_a')}${usuario.nome.split(' ')[0]}${traduzir('login.msg.entrando_b')}`;
    notificarLogin(usuario);
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
  }
}


// ── 2FA NO LOGIN (código gerado e validado no servidor) ────────────

const DURACAO_CODIGO_2FA_MS = 5 * 60 * 1000; // 5 minutos (mesmo prazo usado no servidor)
let intervaloExpiracao2FA = null;

// Pede ao servidor pra gerar um novo código e enviá-lo por e-mail.
// O código em si nunca fica no navegador — só o servidor sabe qual é.
async function enviarCodigo2FA(nome, email) {
  try {
    const resposta = await fetch(`${API}/2fa/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email }),
      signal: AbortSignal.timeout(8000)
    });
    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
    }
    return true;
  } catch (e) {
    console.warn('Código 2FA não enviado por e-mail:', e.message);
    return false;
  }
}

function iniciarContadorExpiracao2FA(modal) {
  const elExpiracao = document.getElementById('expiracao2FALogin');
  if (intervaloExpiracao2FA) clearInterval(intervaloExpiracao2FA);

  const atualizar = () => {
    const restanteMs = Number(modal.dataset.expiraEm) - Date.now();
    if (restanteMs <= 0) {
      elExpiracao.textContent = `${traduzir('login.msg.codigo_expirado_a')}${traduzir('login.2fa.reenviar')}${traduzir('login.msg.codigo_expirado_b')}`;
      clearInterval(intervaloExpiracao2FA);
      return;
    }
    const minutos = Math.floor(restanteMs / 60000);
    const segundos = Math.floor((restanteMs % 60000) / 1000).toString().padStart(2, '0');
    elExpiracao.textContent = `${traduzir('login.msg.codigo_expira_em')}${minutos}:${segundos}`;
  };

  atualizar();
  intervaloExpiracao2FA = setInterval(atualizar, 1000);
}

async function abrirModal2FALogin(usuario) {
  const modal = document.getElementById('modal2FALogin');
  if (!modal) return;

  document.getElementById('erro2FALogin').style.display = 'none';
  document.getElementById('input2FALogin').value = '';
  document.getElementById('email2FALogin').textContent = usuario.email;

  modal.dataset.expiraEm = Date.now() + DURACAO_CODIGO_2FA_MS;
  modal.dataset.id = usuario.id;
  modal.dataset.nome = usuario.nome;
  modal.dataset.email = usuario.email;

  const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
  bsModal.show();
  setTimeout(() => document.getElementById('input2FALogin')?.focus(), 400);

  iniciarContadorExpiracao2FA(modal);
  await enviarCodigo2FA(usuario.nome, usuario.email);
}

async function reenviarCodigo2FALogin() {
  const modal = document.getElementById('modal2FALogin');
  if (!modal) return;

  const nome  = modal.dataset.nome;
  const email = modal.dataset.email;
  modal.dataset.expiraEm = Date.now() + DURACAO_CODIGO_2FA_MS;

  const erroEl = document.getElementById('erro2FALogin');
  erroEl.style.display = 'none';
  document.getElementById('input2FALogin').value = '';

  const btnReenviar = document.getElementById('btnReenviar2FA');
  btnReenviar.style.pointerEvents = 'none';
  btnReenviar.style.opacity = '0.6';

  iniciarContadorExpiracao2FA(modal);
  await enviarCodigo2FA(nome, email);

  btnReenviar.style.pointerEvents = 'auto';
  btnReenviar.style.opacity = '1';
}

async function verificar2FALogin() {
  const modal    = document.getElementById('modal2FALogin');
  const digitado = document.getElementById('input2FALogin').value.trim();
  const id       = modal.dataset.id;
  const nome     = modal.dataset.nome;
  const email    = modal.dataset.email;
  const erroEl   = document.getElementById('erro2FALogin');

  erroEl.style.display = 'none';

  if (!digitado) {
    erroEl.textContent = traduzir('login.msg.digite_codigo');
    erroEl.style.display = 'block';
    return;
  }

  try {
    const resposta = await fetch(`${API}/2fa/verificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo: digitado }),
      signal: AbortSignal.timeout(8000)
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok || !dados.ok) {
      erroEl.textContent = dados.erro || traduzir('login.msg.codigo_incorreto');
      erroEl.style.display = 'block';
      document.getElementById('input2FALogin').value = '';
      document.getElementById('input2FALogin').focus();
      return;
    }
  } catch (e) {
    erroEl.textContent = traduzir('login.msg.erro_verificar_codigo');
    erroEl.style.display = 'block';
    return;
  }

  // Correto — redireciona
  if (intervaloExpiracao2FA) clearInterval(intervaloExpiracao2FA);
  bootstrap.Modal.getInstance(modal).hide();
  const btn = document.getElementById('btnEntrar');
  btn.textContent = `${traduzir('login.msg.entrando_a')}${nome.split(' ')[0]}${traduzir('login.msg.entrando_b')}`;
  btn.disabled = true;
  notificarLogin({ id, nome, email });
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
}

// ── ENTER INTELIGENTE ─────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const modal2FA      = document.getElementById('modal2FALogin');
  const modalCadastro = document.getElementById('modalCriarConta');
  if (modal2FA?.classList.contains('show'))      { verificar2FALogin();  return; }
  if (modalCadastro?.classList.contains('show')) { cadastrarUsuario();   return; }
  fazerLogin();
});



// ── RECUPERAÇÃO DE SENHA (esqueci minha senha) ─────────────────────

const DURACAO_CODIGO_RESET_MS = 15 * 60 * 1000; // 15 minutos (mesmo prazo do servidor)
let intervaloExpiracaoReset = null;
let emailRecuperacaoAtual = null;

function iniciarContadorExpiracaoReset() {
  const elExpiracao = document.getElementById('rsExpiracao');
  if (intervaloExpiracaoReset) clearInterval(intervaloExpiracaoReset);

  const expiraEm = Date.now() + DURACAO_CODIGO_RESET_MS;

  const atualizar = () => {
    const restanteMs = expiraEm - Date.now();
    if (restanteMs <= 0) {
      elExpiracao.textContent = `${traduzir('login.msg.codigo_expirado_a')}${traduzir('login.reset.reenviar')}${traduzir('login.msg.codigo_expirado_b')}`;
      clearInterval(intervaloExpiracaoReset);
      return;
    }
    const minutos = Math.floor(restanteMs / 60000);
    const segundos = Math.floor((restanteMs % 60000) / 1000).toString().padStart(2, '0');
    elExpiracao.textContent = `${traduzir('login.msg.codigo_expira_em')}${minutos}:${segundos}`;
  };

  atualizar();
  intervaloExpiracaoReset = setInterval(atualizar, 1000);
}

// Chama /api/senha/esqueci. Sempre avança pra etapa 2, exista o e-mail
// ou não — o back-end já trata isso de forma genérica (não revela se
// a conta existe).
async function enviarCodigoRecuperacao() {
  const email = document.getElementById('rsEmail').value.trim();
  const erroEmail = document.getElementById('rsErroEmail');
  erroEmail.style.display = 'none';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erroEmail.style.display = 'block';
    return;
  }

  const btn = document.getElementById('rsBtnEnviar');
  btn.disabled = true;

  try {
    await fetch(`${API}/senha/esqueci`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    // Segue mesmo com erro de rede — não revelamos detalhes por segurança.
  }

  emailRecuperacaoAtual = email;
  document.getElementById('rsEmailConfirmado').textContent = email;
  document.getElementById('rsPasso1').style.display = 'none';
  document.getElementById('rsPasso2').style.display = 'block';
  btn.disabled = false;

  iniciarContadorExpiracaoReset();
  setTimeout(() => document.getElementById('rsCodigo')?.focus(), 300);
}

async function reenviarCodigoRecuperacao() {
  if (!emailRecuperacaoAtual) return;

  const btnReenviar = document.getElementById('rsBtnReenviar');
  btnReenviar.style.pointerEvents = 'none';
  btnReenviar.style.opacity = '0.6';

  document.getElementById('rsErroCodigo').style.display = 'none';
  document.getElementById('rsCodigo').value = '';

  try {
    await fetch(`${API}/senha/esqueci`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailRecuperacaoAtual }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) { /* falha silenciosa, mesma lógica do envio inicial */ }

  iniciarContadorExpiracaoReset();
  btnReenviar.style.pointerEvents = 'auto';
  btnReenviar.style.opacity = '1';
}

async function redefinirSenha() {
  const codigo = document.getElementById('rsCodigo').value.trim();
  const novaSenha = document.getElementById('rsNovaSenha').value.trim();
  const confirmarSenha = document.getElementById('rsConfirmarSenha').value.trim();

  const erroCodigo = document.getElementById('rsErroCodigo');
  const erroSenha = document.getElementById('rsErroSenha');
  const erroConfirmar = document.getElementById('rsErroConfirmar');
  [erroCodigo, erroSenha, erroConfirmar].forEach(el => el.style.display = 'none');

  let ok = true;
  if (!codigo) {
    erroCodigo.textContent = traduzir('login.msg.digite_codigo');
    erroCodigo.style.display = 'block';
    ok = false;
  }
  if (!novaSenha || novaSenha.length < 6) {
    erroSenha.style.display = 'block';
    ok = false;
  }
  if (novaSenha !== confirmarSenha) {
    erroConfirmar.style.display = 'block';
    ok = false;
  }
  if (!ok) return;

  const btn = document.getElementById('rsBtnRedefinir');
  btn.disabled = true;

  try {
    const resposta = await fetch(`${API}/senha/redefinir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailRecuperacaoAtual, codigo, novaSenha }),
      signal: AbortSignal.timeout(8000)
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok || !dados.ok) {
      erroCodigo.textContent = dados.erro || traduzir('login.reset.msg_erro_generico');
      erroCodigo.style.display = 'block';
      btn.disabled = false;
      return;
    }
  } catch (e) {
    erroCodigo.textContent = traduzir('login.msg.erro_conexao');
    erroCodigo.style.display = 'block';
    btn.disabled = false;
    return;
  }

  if (intervaloExpiracaoReset) clearInterval(intervaloExpiracaoReset);
  document.getElementById('rsPasso2').style.display = 'none';
  document.getElementById('rsSucesso').style.display = 'block';

  setTimeout(() => {
    bootstrap.Modal.getInstance(document.getElementById('modalRecuperarSenha'))?.hide();
  }, 2000);
}

// Reseta o modal sempre que ele for fechado (por X, ESC, ou depois do sucesso).
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalRecuperarSenha');
  if (!modal) return;
  modal.addEventListener('hidden.bs.modal', () => {
    if (intervaloExpiracaoReset) clearInterval(intervaloExpiracaoReset);
    emailRecuperacaoAtual = null;
    ['rsEmail', 'rsCodigo', 'rsNovaSenha', 'rsConfirmarSenha'].forEach(id => {
      document.getElementById(id).value = '';
    });
    ['rsErroEmail', 'rsErroCodigo', 'rsErroSenha', 'rsErroConfirmar'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    document.getElementById('rsPasso1').style.display = 'block';
    document.getElementById('rsPasso2').style.display = 'none';
    document.getElementById('rsSucesso').style.display = 'none';
    document.getElementById('rsBtnEnviar').disabled = false;
    document.getElementById('rsBtnRedefinir').disabled = false;
  });
});


































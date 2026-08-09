
// ── GRÁFICO ──────────────────────────────────────────────────────────
const MESES_GRAFICO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
// Busca uma chave de tradução no idioma atual do gráfico (com fallback pro português).
// Corrige o uso indevido de "traducoes(...)" como se fosse uma função — "traducoes"
// é um objeto (dicionário por idioma), não uma função.
function traduzir(chave) {
  const idiomaAtual = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const dicionario = traducoes[idiomaAtual] || traducoes['pt'];
  return dicionario[chave] || chave;
}
const ctx = document.getElementById('myChart').getContext('2d');
let myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: MESES_GRAFICO,
    datasets: [
      {
        label: 'Entrada',
        data: Array(12).fill(0),
        backgroundColor: 'rgba(74,222,128,0.8)',
        borderColor: '#1a5c42',
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
        categoryPercentage: 0.6,
        barPercentage: 0.45,
      },
      {
        label: 'Saída',
        data: Array(12).fill(0),
        backgroundColor: 'rgba(248,113,113,0.8)',
        borderColor: '#c62828',
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
        categoryPercentage: 0.6,
        barPercentage: 0.45,
      }
    ]
  },
  options: {
    responsive: true,
    animation: { duration: 500 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true, position: 'top',
        labels: { color: '#111827', font: { size: 12, family: 'Sora', weight: '600' }, usePointStyle: true, padding: 20 }
      },
      tooltip: {
        backgroundColor: '#0a2e1f',
        titleColor: '#fff',
        bodyColor: '#a7f3d0',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: ctx => ctx.parsed.y > 0
            ? ` ${ctx.dataset.label}: R$ ${ctx.parsed.y.toFixed(2).replace('.', ',')}`
            : ` ${ctx.dataset.label}: R$ 0,00`
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#f0f0f0' },
        ticks: { color: '#6b7280', font: { size: 12, family: 'Sora' } }
      },
      y: {
        min: 0,
        max: 10000,
        grid: { color: '#f0f0f0' },
        ticks: {
          stepSize: 1000,
          color: '#9ca3af',
          font: { size: 11, family: 'Sora' },
          callback: v => 'R$ ' + v.toLocaleString('pt-BR')
        },
        title: {
          display: true,
          text: 'Valor (R$)',
          color: '#9ca3af',
          font: { size: 11, family: 'Sora' }
        }
      }
    }
  }
});


// Identifica o mês/ano atual (ex: "2026-7") pra saber quando um novo mês começou.
function obterMesAnoAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${agora.getMonth()}`;
}
// ── ESTADO GLOBAL ─────────────────────────────────────────────────────

let totalEntrada = 0;
let totalSaida   = 0;
let metaAtual    = '';

// ── PERSISTÊNCIA (localStorage, isolada por conta) ─────────────────
// Tudo aqui é dado financeiro pessoal — nunca vai pro banco de dados,
// só fica no localStorage, isolado pelo "id" da conta (chaveUsuario,
// definida em script.js, que carrega antes deste arquivo).
function chaveDadosFinanceiros() {
  return chaveUsuario('dados_financeiros');
}

function salvarEstadoFinanceiro() {
  salvarEstadoAtual(); // garante que a planilha em edição também está atualizada

  const estado = {
    totalEntrada,
    totalSaida,
    mesAnoReferencia: obterMesAnoAtual(),
    meta: metaAtual,
    graficoEntrada: myChart.data.datasets[0].data,
    graficoSaida: myChart.data.datasets[1].data,
    abas,
    abaAtiva
  };

  try {
    localStorage.setItem(chaveDadosFinanceiros(), JSON.stringify(estado));
  } catch (e) {
    console.error('Não foi possível salvar os dados financeiros:', e);
  }
}

function carregarEstadoFinanceiro() {
  let estado;
  try {
    estado = JSON.parse(localStorage.getItem(chaveDadosFinanceiros()) || 'null');
  } catch (e) {
    console.error('Dados financeiros salvos estavam corrompidos:', e);
    estado = null;
  }
  if (!estado) return;

  totalEntrada = Number(estado.totalEntrada) || 0;
  totalSaida   = Number(estado.totalSaida) || 0;
  metaAtual    = estado.meta || '';
  if (estado.mesAnoReferencia && estado.mesAnoReferencia !== obterMesAnoAtual()) {
  totalEntrada = 0;
  totalSaida   = 0;
}

  if (Array.isArray(estado.graficoEntrada)) myChart.data.datasets[0].data = estado.graficoEntrada;
  if (Array.isArray(estado.graficoSaida))   myChart.data.datasets[1].data = estado.graficoSaida;
  myChart.update();

  if (Array.isArray(estado.abas)) {
    abas = estado.abas;
    // Compatibilidade: planilhas salvas antes da mesclagem existir não têm este campo.
    abas.forEach(aba => { if (!Array.isArray(aba.mesclas)) aba.mesclas = []; });
    abaAtiva = Number.isInteger(estado.abaAtiva) ? estado.abaAtiva : 0;
  }

  // Reflete os totais salvos nos cards e no badge de saldo
  const saldo = totalEntrada - totalSaida;
  const cardEntrada = document.getElementById('cardEntrada');
  const cardSaida   = document.getElementById('cardSaida');
  const cardSaldo   = document.getElementById('cardSaldo');
  if (cardEntrada) cardEntrada.textContent = formatBRL(totalEntrada);
  if (cardSaida)   cardSaida.textContent   = formatBRL(totalSaida);
  if (cardSaldo) {
    cardSaldo.textContent = formatBRL(saldo);
    cardSaldo.style.color = saldo < 0 ? '#e53935' : '#1565c0';
  }
  atualizarBadgeSaldo(saldo);
  atualizarBadgesPercentuais();
  atualizarTextoMetaAtual();
}

function atualizarTextoMetaAtual() {
  const el = document.getElementById('metaAtualTexto');
  if (!el) return;
  el.textContent = metaAtual ? `Meta atual: ${metaAtual}` : '';
}

// Mapeia os códigos de idioma do i18n.js pros locales que o Intl.NumberFormat entende.
const LOCALES_MOEDA = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', jp: 'ja-JP', it: 'it-IT', po: 'pl-PL', ne: 'nl-NL' };
 
// O valor continua sempre em Real (BRL) — só a formatação (posição do símbolo,
// separador de milhar/decimal) muda de acordo com o idioma escolhido pelo usuário.
function formatBRL(v) {
  const idiomaAtual = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const locale = LOCALES_MOEDA[idiomaAtual] || 'pt-BR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(v);
}


function atualizarBadgeSaldo(saldo) {
  const badge = document.getElementById('badgeSaldo');
  if (saldo > 0) {
    badge.className = 'badge-card badge-up';
    badge.innerHTML = '<i class="bi bi-check-circle"></i>   ' + traduzir('badge.saudavel');
  } else if (saldo < 0) {
    badge.className = 'badge-card badge-down';
    badge.innerHTML = '<i class="bi bi-exclamation-circle"></i>   ' + traduzir('badge.negativo');
  } else {
    badge.className = 'badge-card badge-ok';
    badge.innerHTML = '<i class="bi bi-dash-circle"></i>   ' + traduzir( 'badge.neutro');
  }
}


// Atualiza os badges "X%" de Entrada e Saída, sempre com base nos valores
// ATUAIS de totalEntrada/totalSaida (recalculado do zero a cada chamada —
// não depende de nenhuma base fixa, funciona não importa quantas vezes o
// usuário registre novos valores ao longo do mês).
//
// Regra:
//   % saída   = (totalSaida / totalEntrada) × 100   → quanto da entrada já foi gasto
//   % entrada = 100% − % saída                       → quanto sobrou (retido)
//
// Se totalSaida > totalEntrada (gastou mais do que ganhou), % saída passa de
// 100% e % entrada fica negativa — isso é intencional, indica déficit.
function atualizarBadgesPercentuais() {
  const badgeEntrada = document.getElementById('badgeEntrada');
  const badgeSaida   = document.getElementById('badgeSaida');
  const total = totalEntrada + totalSaida;

  // Nada movimentado ainda — não há base pra calcular % (evita divisão por zero)
  if (total === 0) {
    if (badgeEntrada) {
      badgeEntrada.className = 'badge-card badge-ok';
      badgeEntrada.innerHTML = '<i class="bi bi-dash-circle"></i> —';
    }
    if (badgeSaida) {
      badgeSaida.className = 'badge-card badge-ok';
      badgeSaida.innerHTML = '<i class="bi bi-dash-circle"></i> —';
    }
    return;
  }

  // Fatia de cada um dentro do total movimentado (entrada + saída) — sempre entre 0% e 100%.
  const fatiaEntrada = (totalEntrada / total) * 100;
  const fatiaSaida   = (totalSaida / total) * 100;

  // Entrada: se a saída ultrapassar a entrada (déficit), fica vermelho e negativo. Senão, verde e positivo.
  if (badgeEntrada) {
    if (totalSaida > totalEntrada) {
      badgeEntrada.className = 'badge-card badge-down';
      badgeEntrada.innerHTML = `<i class="bi bi-arrow-down-short"></i> -${Math.round(fatiaEntrada)}%`;
    } else {
      badgeEntrada.className = 'badge-card badge-up';
      badgeEntrada.innerHTML = `<i class="bi bi-arrow-up-short"></i> ${Math.round(fatiaEntrada)}%`;
    }
  }

  // Saída: sempre vermelho. Positivo enquanto a saída ficar abaixo da entrada (dentro do limite),
  // negativo quando a saída igualar ou ultrapassar a entrada (estourou o limite).
  if (badgeSaida) {
    if (totalSaida < totalEntrada) {
      badgeSaida.className = 'badge-card badge-down';
      badgeSaida.innerHTML = `<i class="bi bi-arrow-up-short"></i> ${Math.round(fatiaSaida)}%`;
    } else {
      badgeSaida.className = 'badge-card badge-down';
      badgeSaida.innerHTML = `<i class="bi bi-arrow-down-short"></i> -${Math.round(fatiaSaida)}%`;
    }
  }
}

function atualizarGrafico(entrada, saida) {
  const mes = new Date().getMonth();
  if (myChart.data.datasets[0]) myChart.data.datasets[0].data[mes] += entrada;
  if (myChart.data.datasets[1]) myChart.data.datasets[1].data[mes] += saida;
  try {
    const max = Math.max(...myChart.data.datasets[0].data, ...myChart.data.datasets[1].data);
    if (max > 0 && myChart.options.scales && myChart.options.scales.y) {
      myChart.options.scales.y.max = Math.ceil(max / 1000) * 1000 + 1000;
    }
  } catch(e) {}
  myChart.update();
}


// ── REGISTRAR SALDO ───────────────────────────────────────────────────

// Zera a entrada e a saída acumuladas (com confirmação, já que é destrutivo).
// Atualiza cards, gráfico, badges e persiste a mudança.
function removerDadosSaldo() {
  
const aviso = {
  pt: "Tem certeza que deseja remover os valores de entrada e saída registrados? TUDO SERÁ REMOVIDO!",
  en: "Are you sure you want to remove the registered income and expense values? EVERYTHING WILL BE REMOVED!",
  es: "¿Tiene certeza de que desea eliminar los valores de entrada y salida registrados?¡TODO SERÁ ELIMINADO! ",
  fr: "Êtes-vous sûr de vouloir supprimer les valeurs d'entrée et de sortie enregistrées ? TOUT SERA RETIRÉ !",
  de: "Sind Sie sicher, dass Sie die erfassten Ein- und Ausgangswerte löschen möchten? ALLES WIRD ENTFERNT! ",
  jp: "登録された入金および出金の値を削除してもよろしいですか？ すべて削除されます！ ",
  it: "Sei sicuro di voler rimuovere i valori di entrata e uscita registrati? TUTTO VERRÀ RIMOSTO!",
  po: "Czy na pewno chcesz usunąć zarejestrowane wartości przychodów i rozchodów? WSZYSTKO ZOSTANIE USUNIĘTE!",
  ne: "Weet u zeker dat u de geregistreerde inkomsten- en uitgavenwaarden wilt verwijderen? ALLES WORDT VERWIJDERD!"
};

const idiomaSalvo = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
const textoTraduzido = aviso[idiomaSalvo] || aviso['pt'];
if(!confirm(textoTraduzido)){
return; }


  totalEntrada = 0;
  totalSaida   = 0;

  const mes = new Date().getMonth();
  myChart.data.datasets[0].data[mes] = 0;
  myChart.data.datasets[1].data[mes] = 0;
  myChart.update();

  document.getElementById('cardEntrada').textContent = formatBRL(totalEntrada);
  document.getElementById('cardSaida').textContent   = formatBRL(totalSaida);
  document.getElementById('cardSaldo').textContent   = formatBRL(0);

  atualizarBadgeSaldo(0);
  atualizarBadgesPercentuais();
  salvarEstadoFinanceiro();

  document.getElementById('inputEntrada').value = '';
  document.getElementById('inputSaida').value   = '';
}


function atualizarSaldo(fechar) {
const mensagem = {
  pt: "Insira pelo menos um valor para continuar.",
  en: "Please enter at least one value to continue.",
  es: "Ingrese al menos un valor para continuar.",
  fr: "Veuillez saisir au moins une valeur pour continuer.",
  de: "Bitte geben Sie mindestens einen Wert ein, um fortzufahren.",
  jp: "続行するには少なくとも1つの値を入力してください。",
  it: "Inserisci almeno un valore per continuare.",
  po: "Wprowadź co najmniej jedną wartość, aby kontynuować.",
  ne: "Voer ten minste één waarde in om door te gaan."
};

  const idiomaAtual = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt-BR';
  const traduzir = mensagem[idiomaAtual] || mensagem['pt-BR'];
  
  const entradaInput = parseFloat(document.getElementById('inputEntrada').value) || 0;
  const saidaInput   = parseFloat(document.getElementById('inputSaida').value)   || 0;

  if (entradaInput === 0 && saidaInput === 0) {
    alert(traduzir);
    return;
  }

  totalEntrada += entradaInput;
  totalSaida   += saidaInput;

  
  
  const saldo = totalEntrada - totalSaida;
  document.getElementById('cardEntrada').textContent = formatBRL(totalEntrada);
  document.getElementById('cardSaida').textContent   = formatBRL(totalSaida);
  document.getElementById('cardSaldo').textContent   = formatBRL(saldo);
  atualizarBadgeSaldo(saldo);
  atualizarGrafico(entradaInput, saidaInput);
  atualizarBadgesPercentuais();
  salvarEstadoFinanceiro();

  document.getElementById('inputEntrada').value = '';
  document.getElementById('inputSaida').value   = '';
  
  const cardSaldo = document.getElementById('cardSaldo');
if (cardSaldo) {                                                                      
  cardSaldo.style.color = saldo < 0 ? '#e53935' : '#1565c0';
}

  if (fechar) {
    bootstrap.Modal.getInstance(document.getElementById('modalSaldo')).hide();
  }
}

// ── CADASTRAR DESPESAS ────────────────────────────────────────────────

function cadastrarDespesas() {
  const ids = ['cad_luz','cad_agua','cad_internet','cad_aluguel','cad_comida','cad_lazer'];

  let totalDespesas = 0;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) totalDespesas += parseFloat(el.value) || 0;
  });

  if (totalDespesas <= 0) {
    alert('Insira pelo menos uma despesa antes de cadastrar.');
    return;
  }

  totalSaida += totalDespesas;

  const saldo = totalEntrada - totalSaida;
  document.getElementById('cardSaida').textContent = formatBRL(totalSaida);
  document.getElementById('cardSaldo').textContent = formatBRL(saldo);
  atualizarBadgeSaldo(saldo);
  atualizarGrafico(0, totalDespesas);
  atualizarBadgesPercentuais();
  salvarEstadoFinanceiro();

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  


const btn = document.getElementById('btnCadastrar');
// Pega o texto atual do botão
const textoOriginal = btn.textContent.trim();

// Atualiza o botão para o estado "sucesso"
btn.textContent = `✓ ${textoOriginal}!`;
btn.style.background = '#0a2e1f';

// Restaura o estado original após 1.5 segundos
setTimeout(() => {
  btn.textContent = textoOriginal;
  btn.style.background = '#1a5c42';
}, 1500);
  
}



// ── DEFINIR METAS ─────────────────────────────────────────────────────

function salvarMeta() {
  const val = document.getElementById('inputMeta').value.trim();
  if (!val) {
    alert('Por favor, digite uma meta antes de salvar.');
    return;
  }
  metaAtual = val;
  salvarEstadoFinanceiro();
  atualizarTextoMetaAtual();

  
  
 const btn = document.querySelector('#modalMetas button[onclick="salvarMeta()"]');
  // Pega o texto atual do botão
 const textoOriginal = btn.textContent.trim();

// Atualiza o botão para o estado "sucesso"
btn.textContent = `✓ ${textoOriginal}!`;
btn.style.background = '#4ade80';

// Restaura o estado original após 1.5 segundos
setTimeout(() => {
  btn.textContent = textoOriginal;
  btn.style.background = '#fff';
}, 1500);
  
}

// Ao abrir o modal de metas, mostra a meta atual (se houver) e permite editá-la
document.getElementById('modalMetas').addEventListener('shown.bs.modal', () => {
  document.getElementById('inputMeta').value = metaAtual;
  atualizarTextoMetaAtual();
});


// ── CALCULADORA ───────────────────────────────────────────────────────

let calcCurrent  = '0';
let calcPrev     = '';
let calcOperator = '';
let calcNewNum   = false;

function calcUpdate() {
  const display = document.getElementById('calcDisplay');
  const expr    = document.getElementById('calcExpr');
  display.textContent = calcCurrent;
  const len = calcCurrent.length;
  display.style.fontSize = len > 9 ? '1.8rem' : len > 6 ? '2.4rem' : '3rem';
  expr.textContent = calcPrev && calcOperator ? `${calcPrev} ${calcOperator}` : '\u00a0';
  document.querySelectorAll('.cbtn-op').forEach(b => b.classList.remove('ativo'));
  if (calcOperator && !calcNewNum) {
    document.querySelectorAll('.cbtn-op').forEach(b => {
      if (b.textContent === calcOperator) b.classList.add('ativo');
    });
  }
}

function calcNum(n) {
  if (calcNewNum) { calcCurrent = n; calcNewNum = false; }
  else calcCurrent = calcCurrent === '0' ? n : calcCurrent + n;
  calcUpdate();
}

function calcDot() {
  if (calcNewNum) { calcCurrent = '0.'; calcNewNum = false; }
  else if (!calcCurrent.includes('.')) calcCurrent += '.';
  calcUpdate();
}

function calcOp(op) {
  if (calcOperator && !calcNewNum) calcEquals(true);
  calcPrev = calcCurrent;
  calcOperator = op;
  calcNewNum = true;
  calcUpdate();
}

function calcEquals(silent = false) {
  if (!calcOperator || !calcPrev) return;
  const a = parseFloat(calcPrev);
  const b = parseFloat(calcCurrent);
  let res;
  if (calcOperator === '+') res = a + b;
  else if (calcOperator === '−') res = a - b;
  else if (calcOperator === '×') res = a * b;
  else if (calcOperator === '÷') res = b !== 0 ? a / b : 'Erro';
  calcCurrent = typeof res === 'number'
    ? (Number.isInteger(res) ? String(res) : parseFloat(res.toFixed(10)).toString())
    : res;
  if (!silent) { calcPrev = ''; calcOperator = ''; }
  calcNewNum = !silent;
  calcUpdate();
}

function calcAC() {
  calcCurrent = '0'; calcPrev = ''; calcOperator = ''; calcNewNum = false;
  calcUpdate();
}

function calcSign() {
  calcCurrent = calcCurrent.startsWith('-')
    ? calcCurrent.slice(1)
    : calcCurrent !== '0' ? '-' + calcCurrent : '0';
  calcUpdate();
}

function calcPercent() {
  calcCurrent = String(parseFloat(calcCurrent) / 100);
  calcUpdate();
}

document.getElementById('modalCalculadora').addEventListener('show.bs.modal', calcAC);


// ── FAB — SELETOR DE TIPO DE GRÁFICO ─────────────────────────────────

let fabAberto = false;

function toggleFab() {
  fabAberto = !fabAberto;
  const menu = document.getElementById('fabMenu');
  const btn  = document.getElementById('fabBtn');
  menu.style.display     = fabAberto ? 'flex' : 'none';
  menu.style.flexDirection = 'column';
  menu.style.alignItems  = 'flex-end';
  menu.style.gap         = '8px';
  btn.style.background   = fabAberto ? '#0a2e1f' : '#1a5c42';
  btn.innerHTML = fabAberto
    ? '<i class="bi bi-x-lg"></i>'
    : '<i class="bi bi-bar-chart-line-fill"></i>';
}

function mudarGrafico(tipo) {
  const dadosEntrada = [...myChart.data.datasets[0].data];
  const dadosSaida   = [...myChart.data.datasets[1].data];

  myChart.destroy();

  const circular = tipo === 'doughnut' || tipo === 'polarArea' || tipo === 'radar';

  // 1. Define a localidade padrão do país para formatação de números
  const idiomaAtual = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  let localeCanvas = 'pt-BR';
  if (idiomaAtual === 'en') localeCanvas = 'en-US';
  else if (idiomaAtual === 'es') localeCanvas = 'es-ES';
  else if (idiomaAtual === 'fr') localeCanvas = 'fr-FR';
  else if (idiomaAtual === 'de') localeCanvas = 'de-DE';

  // 2. Busca a lista de meses traduzidos usando o helper traduzir()
  const mesesTraduzidos = [
    traduzir("grafico.meses.jan"), traduzir("grafico.meses.fev"),
    traduzir("grafico.meses.mar"), traduzir("grafico.meses.abr"),
    traduzir("grafico.meses.mai"), traduzir("grafico.meses.jun"),
    traduzir("grafico.meses.jul"), traduzir("grafico.meses.ago"),
    traduzir("grafico.meses.set"), traduzir("grafico.meses.out"),
    traduzir("grafico.meses.nov"), traduzir("grafico.meses.dez")
  ];

  const coresEntrada = mesesTraduzidos.map((_, i) => `hsla(${140 + i * 8}, 60%, ${45 + (i % 3) * 8}%, 0.8)`);
  const coresSaida   = mesesTraduzidos.map((_, i) => `hsla(${0   + i * 8}, 75%, ${55 + (i % 3) * 5}%, 0.8)`);

  const configData = circular ? {
    labels: mesesTraduzidos,
    datasets: [
      { label: traduzir("grafico.entrada"), data: dadosEntrada, backgroundColor: coresEntrada, borderColor: '#fff', borderWidth: 2 },
      { label: traduzir("grafico.saida"),   data: dadosSaida,   backgroundColor: coresSaida,   borderColor: '#fff', borderWidth: 2 }
    ]
  } : {
    labels: mesesTraduzidos,
    datasets: [
      {
        label: traduzir("grafico.entrada"),
        data: dadosEntrada,
        backgroundColor: tipo === 'line' ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.8)',
        borderColor: '#1a5c42',
        borderWidth: tipo === 'line' ? 2.5 : 1.5,
        borderRadius: tipo === 'bar' ? 6 : undefined,
        borderSkipped: false,
        tension: 0.4,
        fill: tipo === 'line',
        pointRadius: tipo === 'line' ? 4 : undefined,
        categoryPercentage: 0.6,
        barPercentage: 0.45,
      },
      {
        label: traduzir("grafico.saida"),
        data: dadosSaida,
        backgroundColor: tipo === 'line' ? 'rgba(248,113,113,0.15)' : 'rgba(248,113,113,0.8)',
        borderColor: '#c62828',
        borderWidth: tipo === 'line' ? 2.5 : 1.5,
        borderRadius: tipo === 'bar' ? 6 : undefined,
        borderSkipped: false,
        tension: 0.4,
        fill: tipo === 'line',
        pointRadius: tipo === 'line' ? 4 : undefined,
        categoryPercentage: 0.6,
        barPercentage: 0.45,
      }
    ]
  };

  const maiorValor = Math.max(...dadosEntrada, ...dadosSaida);
  const maxY = maiorValor > 0 ? Math.ceil(maiorValor / 1000) * 1000 + 1000 : 10000;

  myChart = new Chart(document.getElementById('myChart').getContext('2d'), {
    type: tipo,
    data: configData,
    options: {
      responsive: true,
      locale: localeCanvas, // Configura a pontuação numérica regional
      animation: { duration: 500 },
      plugins: {
        legend: {
          display: true, position: 'top',
          labels: { color: '#111827', font: { size: 12, family: 'Sora', weight: '600' }, usePointStyle: true, padding: 20 }
        },
        tooltip: {
          backgroundColor: '#0a2e1f', titleColor: '#fff', bodyColor: '#a7f3d0',
          padding: 12, cornerRadius: 8,
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.r ?? ctx.parsed.y ?? ctx.parsed;
              const val = typeof v === 'number' ? v : 0;
              // Formata os números da Tooltip de forma limpa usando a pontuação do país do usuário
              const numFormatado = val.toLocaleString(localeCanvas, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return ` ${ctx.dataset.label} — ${ctx.label}: ${numFormatado}`;
            }
          }
        }
      },
      scales: circular ? {} : {
        x: { grid: { color: '#f0f0f0' }, ticks: { color: '#6b7280', font: { size: 12, family: 'Sora' } } },
        y: {
          min: 0, max: maxY,
          grid: { color: '#f0f0f0' },
          ticks: { 
            stepSize: 1000, 
            color: '#9ca3af', 
            font: { size: 11, family: 'Sora' },
            // Formata os números da lateral (eixo Y) sem moeda estática
            callback: v => v.toLocaleString(localeCanvas, { maximumFractionDigits: 0 })
          },
          title: { 
            display: true, 
            text: traduzir("grafico.tituloEixoY"), // Usa o título traduzido ("Valor", "Value", etc.)
            color: '#9ca3af', 
            font: { size: 11, family: 'Sora' } 
          }
        }
      }
    }
  });

  fabAberto = true;
  toggleFab();

  // Todo novo gráfico nasce com as cores padrão (modo claro). Como quem
  // decide as cores de acordo com o tema salvo é a aplicarTema() (script.js),
  // chamamos ela de novo aqui pra repintar ESTE myChart recém-criado com as
  // cores certas (clara ou escura) — sem isso, a legenda "Entrada/Saída"
  // ficava escura demais e sumia em cima do card escuro.
  if (typeof aplicarTema === 'function') {
    aplicarTema();
  }
}



// ── PLANILHA (REGISTRO DE DESPESAS) ──────────────────────────────────

const CATEGORIAS = Array(100).fill('');
// Substitua a const antiga por esta função no escopo global do script.js
function obterMesesPlanilha() {
  // Captura o idioma preferido salvo pelo usuário
  const idiomaGuardado = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const dicionarioAtivo = traducoes[idiomaGuardado];

  // Se o dicionário existir e contiver os meses do gráfico, reutilizamos as mesmas chaves
  if (dicionarioAtivo && dicionarioAtivo["grafico.meses.jan"]) {
    return [
      dicionarioAtivo["grafico.meses.jan"], dicionarioAtivo["grafico.meses.fev"],
      dicionarioAtivo["grafico.meses.mar"], dicionarioAtivo["grafico.meses.abr"],
      dicionarioAtivo["grafico.meses.mai"], dicionarioAtivo["grafico.meses.jun"],
      dicionarioAtivo["grafico.meses.jul"], dicionarioAtivo["grafico.meses.ago"],
      dicionarioAtivo["grafico.meses.set"], dicionarioAtivo["grafico.meses.out"],
      dicionarioAtivo["grafico.meses.nov"], dicionarioAtivo["grafico.meses.dez"]
    ];
  }

  // Fallback (retorno de contingência) se a tabela i18n falhar
  return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
}


let abas     = [];
let abaAtiva = 0;

function criarAba(nomeCustom) {
  const nome = nomeCustom || `Planilha ${abas.length + 1}`;
  abas.push({ nome, dados: {}, mesclas: [] });
  renderAbas();
  ativarAba(abas.length - 1);
  salvarEstadoFinanceiro();
}

function novaAba() {
  criarAba(); // cria com nome padrão ("Planilha N")
  // Abre a edição inline do nome imediatamente, pra o usuário já dar um nome próprio
  setTimeout(() => {
    const ultimaTab = document.getElementById('abasContainer').lastElementChild;
    const iconeRenomear = ultimaTab?.querySelector('[title="Renomear"]');
    if (iconeRenomear) iconeRenomear.click();
  }, 0);
}

function renderAbas() {
  const container = document.getElementById('abasContainer');
  container.innerHTML = '';
  abas.forEach((aba, i) => {
    const tab = document.createElement('div');
    tab.style.cssText = `
      display:flex; align-items:center; gap:6px;
      padding:0 14px; height:38px; cursor:pointer;
      font-size:0.78rem; font-weight:600; white-space:nowrap;
      border-radius:6px 6px 0 0; margin-top:4px; transition:background .15s;
      ${i === abaAtiva
        ? 'background:#fff; color:#1a5c42; border:1px solid #1a5c42; border-bottom:2px solid #fff; margin-bottom:-2px;'
        : 'background:transparent; color:#1a5c42; opacity:0.6;'}
    `;
    tab.innerHTML = `
      <span onclick="ativarAba(${i})">${aba.nome}</span>
      <span onclick="iniciarRenomeacaoAba(event, ${i})" title="Renomear" style="opacity:0.4; font-size:0.7rem; cursor:pointer;">✏️</span>
      ${abas.length > 1 ? `<span onclick="excluirAba(${i})" title="Excluir" style="opacity:0.35; font-size:0.7rem; cursor:pointer;">✕</span>` : ''}
    `;
    container.appendChild(tab);
  });
}

// Substitui o nome da aba por um campo de texto editável, direto na própria aba.
// (Não usamos window.prompt() porque o Electron não dá suporte a ele — ver
// https://github.com/electron/electron/issues/472)
function iniciarRenomeacaoAba(event, i) {
  event.stopPropagation();
  const tab = event.currentTarget.parentElement;
  const nomeAtual = abas[i].nome;

  tab.innerHTML = `
    <input type="text" value="${nomeAtual}" id="inputRenomearAba"
      style="width:120px; border:1px solid #1a5c42; border-radius:4px; padding:2px 6px; font-size:0.78rem; font-family:'Sora',sans-serif; outline:none;" />
  `;

  const input = document.getElementById('inputRenomearAba');
  input.focus();
  input.select();

  const confirmarRenomeacao = () => {
    const novo = input.value.trim();
    if (novo) {
      abas[i].nome = novo;
      salvarEstadoFinanceiro();
    }
    renderAbas();
  };

  input.addEventListener('blur', confirmarRenomeacao);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = nomeAtual; input.blur(); }
  });
}

function ativarAba(i) {
  salvarEstadoAtual();
  abaAtiva = i;
  renderAbas();
  renderPlanilha();
  document.getElementById('infoAba').textContent = `Planilha ${i+1} de ${abas.length}`;
  salvarEstadoFinanceiro();
}

// (renomearAba antiga removida — usava window.prompt(), que o Electron não suporta.
// Substituída por iniciarRenomeacaoAba(), que edita o nome direto na aba.)

function excluirAba(i) {
  if (!confirm(`Excluir "${abas[i].nome}"?`)) return;
  abas.splice(i, 1);
  abaAtiva = Math.min(abaAtiva, abas.length - 1);
  renderAbas();
  renderPlanilha();
  salvarEstadoFinanceiro();
}

function salvarEstadoAtual() {
  if (!abas[abaAtiva]) return;
  document.querySelectorAll('#tabelaBody input').forEach(inp => {
    abas[abaAtiva].dados[inp.dataset.key] = inp.value;
  });
}

// ============================================================================
// MESCLAGEM DE COLUNAS NA LINHA TOTAL (estilo Excel) — o usuário seleciona um
// intervalo de células de UMA linha (vários meses, clique e arraste) só pra
// indicar quais colunas agrupar. As células da grade (Jan, Fev, Mar...) NUNCA
// são alteradas — continuam com seus valores, editáveis, normais, iguais a
// antes dessa funcionalidade existir. O único efeito visual é na linha TOTAL,
// lá embaixo: as colunas escolhidas se juntam em uma célula só, mostrando a
// soma combinada delas.
// Guardado por aba em aba.mesclas = [{c1, c2}, ...] (índices das colunas).
// ============================================================================

// Retorna a mesclagem (se houver) cujo intervalo de colunas cobre "mi".
function obterMesclaDaColuna(aba, mi) {
  return (aba.mesclas || []).find(mc => mi >= mc.c1 && mi <= mc.c2) || null;
}

let selecaoPlanilha = { inicio: null, fim: null, arrastando: false };

function iniciarSelecaoPlanilha(e, r, c) {
  selecaoPlanilha.inicio = { r, c };
  selecaoPlanilha.fim    = { r, c };
  selecaoPlanilha.arrastando = true;
  atualizarDestaquePlanilha();
}

function estenderSelecaoPlanilha(r, c) {
  if (!selecaoPlanilha.arrastando) return;
  selecaoPlanilha.fim = { r, c };
  atualizarDestaquePlanilha();
}

// Encerra o arrasto de seleção ao soltar o mouse em qualquer lugar da página.
document.addEventListener('mouseup', () => {
  if (!selecaoPlanilha.arrastando) return;
  selecaoPlanilha.arrastando = false;
  atualizarBotoesMesclagem();
});

function limitesSelecaoPlanilha() {
  if (!selecaoPlanilha.inicio || !selecaoPlanilha.fim) return null;
  return {
    r1: Math.min(selecaoPlanilha.inicio.r, selecaoPlanilha.fim.r),
    r2: Math.max(selecaoPlanilha.inicio.r, selecaoPlanilha.fim.r),
    c1: Math.min(selecaoPlanilha.inicio.c, selecaoPlanilha.fim.c),
    c2: Math.max(selecaoPlanilha.inicio.c, selecaoPlanilha.fim.c),
  };
}

// Pinta (ou limpa) a borda/fundo laranja nas células dentro da seleção atual.
// (Isso é só o destaque de "o que está selecionado agora" — não muda o valor
// nem o visual permanente da célula, que nunca é alterado por mesclagem.)
function atualizarDestaquePlanilha() {
  const limites = limitesSelecaoPlanilha();
  document.querySelectorAll('#tabelaBody td[data-row]').forEach(td => {
    const r = Number(td.dataset.row);
    const c = Number(td.dataset.col);
    const dentro = !!limites && r >= limites.r1 && r <= limites.r2 && c >= limites.c1 && c <= limites.c2;
    td.style.outline    = dentro ? '2px solid #f59e0b' : 'none';
    td.style.background = dentro ? '#fef3c7' : '';
  });
  atualizarBotoesMesclagem();
}

// Mostra o botão "Mesclar e Somar" só quando a seleção cobre 2+ colunas de UMA única linha.
// Mostra o botão "Limpar Seleção" sempre que houver qualquer seleção (uma ou mais células).
function atualizarBotoesMesclagem() {
  const btnMesclar = document.getElementById('btnMesclarSomar');
  const btnLimpar  = document.getElementById('btnLimparSelecao');

  const limites = limitesSelecaoPlanilha();

  if (btnMesclar) {
    const validoMesclar = !!limites && limites.r1 === limites.r2 && limites.c1 !== limites.c2;
    btnMesclar.style.display = validoMesclar ? 'inline-flex' : 'none';
  }

  if (btnLimpar) {
    btnLimpar.style.display = limites ? 'inline-flex' : 'none';
  }
}

// Junta as colunas selecionadas em uma única célula na linha Total, mostrando
// a soma combinada delas. A grade de dados (Jan, Fev, Mar...) não é alterada
// em nada — os valores continuam lá, normais e editáveis.
// Aplica a operação escolhida sobre uma lista de valores (já na ordem das
// colunas, ex: [Jan, Fev, Mar]). "soma" é o padrão — cobre também mesclagens
// antigas, salvas antes dessa funcionalidade existir (sem campo "operacao").
// Símbolo visual pra mostrar qual operação está ativa numa célula mesclada.
function simboloOperacao(operacao) {
  switch (operacao) {
    case 'subtracao':     return '';
    case 'multiplicacao': return '';
    case 'divisao':        return '';
    case 'soma':
    default:                return '';
  }
}

function calcularMescla(valores, operacao) {
  switch (operacao) {
    case 'subtracao':     return valores.reduce((a, b) => a - b);
    case 'multiplicacao': return valores.reduce((a, b) => a * b, 1);
    case 'divisao':        return valores.reduce((a, b) => (b !== 0 ? a / b : a));
    case 'soma':
    default:                return valores.reduce((a, b) => a + b, 0);
  }
}

function mesclarSelecaoPlanilha() {
  const limites = limitesSelecaoPlanilha();
  const aba = abas[abaAtiva];
  if (!limites || !aba) return;

  // Garante que qualquer valor recém-digitado (mesmo sem ter clicado fora do
  // campo ainda) já esteja gravado antes de calcular a soma — senão a
  // mesclagem podia pegar célula "vazia" e dar 0,00 por engano.
  salvarEstadoAtual();

  if (limites.r1 !== limites.r2) {
    alert('Selecione células de uma única linha (vários meses) para mesclar na linha Total.');
    return;
  }
  if (limites.c1 === limites.c2) {
    alert('Selecione mais de uma coluna (clique e arraste) para mesclar.');
    return;
  }

  aba.mesclas = aba.mesclas || [];

  // Não deixa mesclar em cima de um intervalo de colunas que já está mesclado.
  const sobrepoe = aba.mesclas.some(mc => limites.c1 <= mc.c2 && limites.c2 >= mc.c1);
  if (sobrepoe) {
    alert('Já existe uma mesclagem cobrindo alguma dessas colunas na linha Total. Desmescle-a primeiro.');
    return;
  }

  const seletorOperacao = document.getElementById('operacaoMescla');
  const operacao = seletorOperacao ? seletorOperacao.value : 'soma';

  aba.mesclas.push({ c1: limites.c1, c2: limites.c2, operacao });

  selecaoPlanilha = { inicio: null, fim: null, arrastando: false };
  renderPlanilha();
}

// Apaga o valor das células dentro da seleção atual (a mesma seleção usada
// para mesclar — clique e arraste). Pede confirmação antes, porque não dá
// pra desfazer depois de apagado.
function limparSelecaoPlanilha() {
  const limites = limitesSelecaoPlanilha();
  const aba = abas[abaAtiva];
  if (!limites || !aba) return;

  const totalCelulas = (limites.r2 - limites.r1 + 1) * (limites.c2 - limites.c1 + 1);
  const confirmou = confirm(
    totalCelulas === 1
      ? 'Apagar o valor desta célula? Essa ação não pode ser desfeita.'
      : `Apagar os valores de ${totalCelulas} células? Essa ação não pode ser desfeita.`
  );
  if (!confirmou) return;

  for (let r = limites.r1; r <= limites.r2; r++) {
    for (let c = limites.c1; c <= limites.c2; c++) {
      delete aba.dados[`r${r}_c${c}`];
    }
  }

  selecaoPlanilha = { inicio: null, fim: null, arrastando: false };
  renderPlanilha();
}

// Desfaz a mesclagem de colunas indicada (chamada pelo "✕" dentro da própria
// célula mesclada, na linha Total). A linha Total volta a mostrar uma célula
// por mês; a grade de dados nunca foi alterada, então nada muda ali.
function desmesclarColunas(c1, c2) {
  const aba = abas[abaAtiva];
  if (!aba) return;
  salvarEstadoAtual();
  aba.mesclas = (aba.mesclas || []).filter(mc => !(mc.c1 === c1 && mc.c2 === c2));
  renderPlanilha();
}

// ============================================================================
// REDIMENSIONAR COLUNAS (estilo Excel) — arrastar a borda direita de um
// cabeçalho (Descrição ou um mês) pra aumentar/diminuir sua largura. Usa
// <colgroup>/<col> na tabela, que é a forma confiável de controlar a largura
// de uma coluna inteira em HTML sem desalinhar cabeçalho, dados e Total.
// As larguras são só uma preferência visual, salvas à parte no localStorage
// (não mexem em nada dos dados financeiros).
// ============================================================================

let larguraColunas = null;

function carregarLarguraColunas() {
  try {
    const salvo = JSON.parse(localStorage.getItem(chaveUsuario('larguraColunasPlanilha')) || 'null');
    if (salvo && Array.isArray(salvo.meses) && salvo.meses.length === 12) return salvo;
  } catch (e) { /* ignora e usa o padrão abaixo */ }
  return { desc: 180, meses: Array(12).fill(90) };
}

function salvarLarguraColunas() {
  localStorage.setItem(chaveUsuario('larguraColunasPlanilha'), JSON.stringify(larguraColunas));
}

let redimensionandoColuna = null; // { tipo: 'desc' | 'mes', indice, larguraInicial, xInicial }

function iniciarRedimensionamentoColuna(e, tipo, indice) {
  e.preventDefault();
  e.stopPropagation();
  const larguraAtual = tipo === 'desc' ? larguraColunas.desc : larguraColunas.meses[indice];
  redimensionandoColuna = { tipo, indice, larguraInicial: larguraAtual, xInicial: e.clientX };
}

document.addEventListener('mousemove', (e) => {
  if (!redimensionandoColuna) return;
  const delta = e.clientX - redimensionandoColuna.xInicial;
  const novaLargura = Math.max(50, redimensionandoColuna.larguraInicial + delta);

  if (redimensionandoColuna.tipo === 'desc') {
    larguraColunas.desc = novaLargura;
    const col = document.querySelector('#colgroupPlanilha col[data-col-desc]');
    if (col) col.style.width = novaLargura + 'px';
  } else {
    larguraColunas.meses[redimensionandoColuna.indice] = novaLargura;
    const col = document.querySelector(`#colgroupPlanilha col[data-col-mes="${redimensionandoColuna.indice}"]`);
    if (col) col.style.width = novaLargura + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (!redimensionandoColuna) return;
  redimensionandoColuna = null;
  salvarLarguraColunas();
});

function renderPlanilha() {
  const aba  = abas[abaAtiva];
  const head = document.getElementById('tabelaHead');
  const body = document.getElementById('tabelaBody');

  if (!larguraColunas) larguraColunas = carregarLarguraColunas();
  
  // Captura os meses já traduzidos baseados no idioma atual do sistema
  const mesesAtuais = obterMesesPlanilha(); 
  
  // Captura os cabeçalhos fixos traduzidos do seu dicionário
  const idiomaGuardado = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const dicionarioAtivo = traducoes[idiomaGuardado] || {};
  const textoDespesas = dicionarioAtivo["planilha.despesas"] || 'Despesas';
  const textoDescricao = dicionarioAtivo["planilha.descricao"] || 'Descrição...';

  // Define a largura real de cada coluna (colgroup) — é isso que o arrasto altera.
  const colgroup = document.getElementById('colgroupPlanilha');
  if (colgroup) {
    colgroup.innerHTML = `
      <col style="width:38px">
      <col data-col-desc style="width:${larguraColunas.desc}px">
      ${mesesAtuais.map((m, mi) => `<col data-col-mes="${mi}" style="width:${larguraColunas.meses[mi] || 90}px">`).join('')}
    `;
  }

  // Renderização do Cabeçalho da Tabela (thead) usando o array dinâmico.
  // Cada cabeçalho (menos o "#") ganha uma alcinha na borda direita pra
  // arrastar e mudar a largura, igual no Excel.
  head.innerHTML = `
    <tr style="position:sticky; top:0; z-index:2;">
      <th style="width:38px; background:#1a5c42; border:1px solid #155a3a; padding:7px 6px; text-align:center; color:#a7f3d0; font-weight:600; font-size:0.75rem;">#</th>
      <th style="position:relative; background:#1a5c42; border:1px solid #155a3a; padding:7px 14px; text-align:left; color:#fff; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${textoDespesas}
        <div onmousedown="iniciarRedimensionamentoColuna(event, 'desc', null)"
             onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='transparent'"
             style="position:absolute; top:0; right:0; width:6px; height:100%; cursor:col-resize;"></div>
      </th>
      ${mesesAtuais.map((m, mi) => `
        <th style="position:relative; background:#1a5c42; border:1px solid #155a3a; padding:7px 10px; text-align:center; color:#fff; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${m}
          <div onmousedown="iniciarRedimensionamentoColuna(event, 'mes', ${mi})"
               onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='transparent'"
               style="position:absolute; top:0; right:0; width:6px; height:100%; cursor:col-resize;"></div>
        </th>
      `).join('')}
    </tr>
  `;

  body.innerHTML = '';
  aba.mesclas = aba.mesclas || []; // compatibilidade com planilhas salvas antes da mesclagem existir

  CATEGORIAS.forEach((cat, i) => {
    const rowNum  = i + 1;
    const isFirst = i === 0;
    const tr = document.createElement('tr');
    tr.style.background = isFirst ? '#fff8f0' : (i % 2 === 0 ? '#fff' : '#fafafa');

    let cells = `
      <td style="border:1px solid #e5e7eb; padding:6px; text-align:center; color:#9ca3af; font-size:0.75rem; font-weight:600;">${rowNum}</td>
      <td style="border:1px solid #e5e7eb; padding:3px 6px;">
        <input type="text" data-key="cat_r${i}" value="${aba.dados['cat_r'+i] || ''}" placeholder="${textoDescricao}"
          style="width:100%; border:none; background:transparent; font-size:0.82rem; font-family:'Sora',sans-serif; outline:none; padding:4px 8px; color:#374151; font-weight:${isFirst?'700':'400'};"
          onfocus="this.parentElement.style.background='#f0f4f2'"
          onblur="this.parentElement.style.background=''" />
      </td>
    `;

    // Varre os meses dinâmicos para montar as células de entrada de dados (inputs).
    // Nenhuma célula da grade é afetada por mesclagem — todas são desenhadas
    // sempre do mesmo jeito, iguais a antes da funcionalidade existir.
    mesesAtuais.forEach((m, mi) => {
      const key = `r${i}_c${mi}`;
      const val = aba.dados[key] || '';
      cells += `
        <td data-row="${i}" data-col="${mi}" style="border:1px solid #e5e7eb; padding:3px 4px;">
          <input type="text" data-key="${key}" value="${val}"
            style="width:100%; border:none; background:transparent; font-size:0.8rem; font-family:'Sora',sans-serif; outline:none; padding:4px 6px; text-align:right; color:#1a1a1a;"
            oninput="atualizarLinhaTotal()"
            onfocus="this.parentElement.style.background='#e8f5e9'"
            onblur="this.parentElement.style.background=''"
            onmousedown="iniciarSelecaoPlanilha(event, ${i}, ${mi})"
            onmouseenter="estenderSelecaoPlanilha(${i}, ${mi})" />
        </td>
      `;
    });

    tr.innerHTML = cells;
    body.appendChild(tr);
  });

  // Linha de Total: soma os valores numéricos de cada mês, em todas as linhas.
  // Colunas mescladas (aba.mesclas) aparecem como uma célula só, com colspan,
  // somando o total combinado de todos os meses daquele intervalo.
  const somaPorMes = mesesAtuais.map((m, mi) => {
    let soma = 0;
    CATEGORIAS.forEach((cat, i) => {
      const val = parseFloat((aba.dados[`r${i}_c${mi}`] || '').toString().replace(',', '.'));
      if (!isNaN(val)) soma += val;
    });
    return soma;
  });

  const linhaTotal = document.createElement('tr');
  linhaTotal.style.cssText = 'position:sticky; bottom:0; background:#e8f5e9; font-weight:700;';
  let celulasTotal = `
    <td style="border:1px solid #cfe8d8; padding:6px; text-align:center;"></td>
    <td style="border:1px solid #cfe8d8; padding:6px 14px; color:#1a5c42;">${dicionarioAtivo["planilha.total"] || 'Total'}</td>
  `;
  for (let mi = 0; mi < mesesAtuais.length; mi++) {
    const mescla = obterMesclaDaColuna(aba, mi);

    if (!mescla) {
      celulasTotal += `<td data-total-mes="${mi}" style="border:1px solid #cfe8d8; padding:6px; text-align:right; color:#1a5c42;">${formatBRL(somaPorMes[mi])}</td>`;
      continue;
    }

    // Só desenha a célula mesclada uma vez, na primeira coluna do intervalo;
    // as demais colunas cobertas por ela são puladas (fazem parte do colspan).
    if (mescla.c1 !== mi) continue;

    const valoresIntervalo = [];
    for (let c = mescla.c1; c <= mescla.c2; c++) valoresIntervalo.push(somaPorMes[c]);
    const somaCombinada = calcularMescla(valoresIntervalo, mescla.operacao);
    const colspan = mescla.c2 - mescla.c1 + 1;

    celulasTotal += `
      <td data-total-mes="${mi}" colspan="${colspan}" style="border:1px solid #f59e0b; padding:6px; color:#92400e; background:#fef3c7;">
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; line-height:normal;">
          <span title="${mescla.operacao || 'soma'}" style="opacity:0.6; font-size:0.7rem;">${simboloOperacao(mescla.operacao)}</span>
          <span>${formatBRL(somaCombinada)}</span>
          <span onclick="desmesclarColunas(${mescla.c1}, ${mescla.c2})" title="Desmesclar" style="font-size:0.7rem; color:#b45309; opacity:0.55; cursor:pointer;">✕</span>
        </div>
      </td>
    `;
  }
  linhaTotal.innerHTML = celulasTotal;
  body.appendChild(linhaTotal);
}

// Recalcula só a linha de Total (chamada a cada edição de célula, sem re-renderizar a tabela toda)
function atualizarLinhaTotal() {
  const aba = abas[abaAtiva];
  if (!aba) return;
  const mesesAtuais = obterMesesPlanilha();

  const somaPorMes = mesesAtuais.map((m, mi) => {
    let soma = 0;
    document.querySelectorAll(`#tabelaBody input[data-key$="_c${mi}"]`).forEach(inp => {
      const val = parseFloat((inp.value || '').replace(',', '.'));
      if (!isNaN(val)) soma += val;
    });
    return soma;
  });

  for (let mi = 0; mi < mesesAtuais.length; mi++) {
    const mescla = obterMesclaDaColuna(aba, mi);
    if (mescla && mescla.c1 !== mi) continue; // só a 1ª coluna do intervalo tem célula própria

    const chaveCelula = mescla ? mescla.c1 : mi;
    const soma = mescla
      ? calcularMescla(somaPorMes.slice(mescla.c1, mescla.c2 + 1), mescla.operacao)
      : somaPorMes[mi];

    const celula = document.querySelector(`#tabelaBody td[data-total-mes="${chaveCelula}"]`);
    if (!celula) continue;

    if (mescla) {
      // Reconstrói a célula mesclada com o mesmo layout (número + "✕" lado a lado).
      celula.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; line-height:normal;">
          <span title="${mescla.operacao || 'soma'}" style="opacity:0.6; font-size:0.7rem;">${simboloOperacao(mescla.operacao)}</span>
          <span>${formatBRL(soma)}</span>
          <span onclick="desmesclarColunas(${mescla.c1}, ${mescla.c2})" title="Desmesclar" style="font-size:0.7rem; color:#b45309; opacity:0.55; cursor:pointer;">✕</span>
        </div>
      `;
    } else {
      celula.textContent = formatBRL(soma);
    }
  }
}


function pesquisarData() {
  const val = document.getElementById('inputDataPesquisa').value;
  if (!val) return;

  const data = new Date(val + 'T00:00:00');
  if (isNaN(data.getTime())) {
    alert('Data inválida.');
    return;
  }
  const mesIndice = data.getMonth();

  // Remove destaque anterior
  document.querySelectorAll('#tabelaHead th, #tabelaBody td').forEach(el => {
    el.classList.remove('coluna-destacada');
  });

  // Destaca a coluna inteira do mês pesquisado (cabeçalho + células)
  const colunaIndex = mesIndice + 2; // +2 por causa das colunas fixas "#" e "Descrição"
  document.querySelectorAll(`#tabelaHead tr th:nth-child(${colunaIndex + 1}), #tabelaBody tr td:nth-child(${colunaIndex + 1})`)
    .forEach(el => el.classList.add('coluna-destacada'));

  // Mostra o total já calculado daquele mês
  const celulaTotal = document.querySelector(`#tabelaBody td[data-total-mes="${mesIndice}"]`);
  const mesesAtuais = obterMesesPlanilha();
  const totalTexto = celulaTotal ? celulaTotal.textContent : formatBRL(0);
  alert(`Total de despesas em ${mesesAtuais[mesIndice]}: ${totalTexto}`);
}

function toggleFullscreen() {
  const modalDialog   = document.querySelector('#modalRegistro .modal-dialog');
  const modalContent  = document.querySelector('#modalRegistro .modal-content');
  const planilhaArea  = document.getElementById('planilhaArea');
  const icone         = document.getElementById('iconeFullscreen');
  const isFullscreen  = modalDialog.dataset.fullscreen === 'true';

  if (!isFullscreen) {
    modalDialog.dataset.fullscreen = 'true';
    modalDialog.style.cssText   = 'max-width:100vw; width:100vw; margin:0; height:100vh;';
    modalContent.style.cssText  = 'border-radius:0; height:100vh; display:flex; flex-direction:column;';
    planilhaArea.style.maxHeight = 'calc(100vh - 220px)';
    icone.className = 'bi bi-fullscreen-exit';
  } else {
    modalDialog.dataset.fullscreen = 'false';
    modalDialog.style.cssText   = 'max-width:95vw; width:1100px;';
    modalContent.style.cssText  = 'border-radius:16px; height:auto;';
    planilhaArea.style.maxHeight = '55vh';
    icone.className = 'bi bi-fullscreen';
  }
}

function salvarDados() {
  salvarEstadoFinanceiro();
  const btn = document.querySelector('[onclick="salvarDados()"]');
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Salvo!';
  btn.style.background = '#fff';
  btn.style.color = '#1a5c42';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = '#4ade80'; btn.style.color = '#0a2e1f'; }, 1500);
}

// Garante que edições feitas na planilha não se percam se o usuário fechar
// o modal (X ou clicar fora) sem clicar explicitamente em "Save".
document.getElementById('modalRegistro').addEventListener('hide.bs.modal', () => {
  salvarEstadoFinanceiro();
});

document.getElementById('modalRegistro').addEventListener('shown.bs.modal', () => {
  // 1. Descobre o idioma que o usuário configurou no momento
  const idiomaGuardado = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const dicionarioAtivo = traducoes[idiomaGuardado] || traducoes['pt'];

  if (abas.length === 0) {
    // 2. Captura o ano atual do relógio do computador (ex: 2026)
    const anoAtual = new Date().getFullYear();

    // 3. Busca o nome do mês traduzido (ex: 'Janeiro', 'January', 'Janvier')
    // Se a chave não existir na tabela, ele usa 'Janeiro' como plano de fundo (fallback)
    const mesTraduzido = dicionarioAtivo["grafico.meses.janeiroLong"] || 'Janeiro';

    // 4. Cria a aba combinando o mês traduzido com o ano dinâmico
    criarAba(`${mesTraduzido} ${anoAtual}`);
    
  } else {
    renderAbas();
    renderPlanilha();

    // 5. Traduz também o texto informativo da paginação das abas (ex: "Planilha 1 de 3")
    const textoPlanilha = dicionarioAtivo["planilha.info.aba"] || 'Planilha';
    const textoDe = dicionarioAtivo["planilha.info.de"] || 'de';
    
    document.getElementById('infoAba').textContent = `${textoPlanilha} ${abaAtiva + 1} ${textoDe} ${abas.length}`;
  }
});

// ── INICIALIZAÇÃO ────────────────────────────────────────────────────
// Restaura entradas, saídas, gráfico, planilha e meta salvos anteriormente
// para esta conta (localStorage, isolado por "id" — nunca vai pro banco).
carregarEstadoFinanceiro();
























































































































































































































































































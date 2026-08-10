// ── CONFIGURAÇÃO DA API ───────────────────────────────────────────
  const API = 'http://127.0.0.1:8080/api';

  // ── FUNÇÃO DE CODELING/ESCAPE RECOMENDADA PELA MDN ──
  // Converte metacaracteres HTML perigosos em entidades de texto seguras e estáticas
  function sanitizarTexto(textoInseguro) {
    if (!textoInseguro) return '';
    return String(textoInseguro)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  // ── ISOLAMENTO DE DADOS POR CONTA ──
  // Mesma lógica do login.js: cada preferência salva no localStorage é
  // prefixada pelo "id" da conta (vindo do MySQL), pra contas diferentes
  // nunca lerem/escreverem uma na outra.
  function chaveUsuario(nomeBase, idUsuario = sessionStorage.getItem('usuarioId')) {
    return `${nomeBase}_${idUsuario}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Recupera a sessão da conta logada (gravada pelo login.js)
    const idUsuario = sessionStorage.getItem('usuarioId');
    const nome  = sanitizarTexto(sessionStorage.getItem('usuarioNome') || '');
    const email = sanitizarTexto(sessionStorage.getItem('usuarioEmail') || '');

    // 2. Sem sessão ativa, volta pro login (não há mais base local de usuários)
    if (!idUsuario || !email) {
      window.location.href = 'login.html';
      return;
    }

    // 3. Preenche os elementos do DOM com validação de existência
    const campoNome = document.getElementById('perfilNome');
    const campoEmail = document.getElementById('perfilEmail');
    const avatar = document.getElementById('avatarInicial');

    if (campoNome) campoNome.value = nome;
    if (campoEmail) campoEmail.value = email;

    if (avatar) {
      const nomeLimpo = nome || 'U';
      avatar.textContent = nomeLimpo[0].toUpperCase();
      avatar.style.fontSize = '1.8rem';
    }

    // 4. Gerencia o toggle de notificações (preferência isolada por conta)
    const toggleNotif = document.getElementById('toggleNotif');
    if (toggleNotif) {
      toggleNotif.checked = localStorage.getItem(chaveUsuario('notificacoesAtivas')) !== 'false';
      toggleNotif.addEventListener('change', () => {
        localStorage.setItem(chaveUsuario('notificacoesAtivas'), toggleNotif.checked ? 'true' : 'false');
      });
    }

    // 5. Gerencia o toggle e o status da Autenticação de Dois Fatores (idem)
    const toggle2FA = document.getElementById('toggle2FA');
    const status2FA = document.getElementById('status2FA');
    const dois_fatores = localStorage.getItem(chaveUsuario('dois_fatores')) === 'true';
    if (toggle2FA) {
      toggle2FA.checked = dois_fatores;
      if (status2FA) status2FA.style.display = dois_fatores ? 'block' : 'none';
    }
  });

  // ── AUTENTICAÇÃO DE DOIS FATORES (CÓDIGO POR E-MAIL) ──
  // Liga/desliga o 2FA para a conta logada (preferência isolada por conta,
  // não depende mais de uma base local de usuários).
  function gerenciar2FA(checkbox) {
    localStorage.setItem(chaveUsuario('dois_fatores'), checkbox.checked ? 'true' : 'false');

    const status2FA = document.getElementById('status2FA');
    if (status2FA) status2FA.style.display = checkbox.checked ? 'block' : 'none';
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  

// ====================== TRADUÇÃO (i18n) ======================


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM totalmente carregado. Iniciando traduções...");
    aplicarTraducaoAtual();

    const selectIdioma = document.getElementById('selectIdioma');
    if (selectIdioma) {
        selectIdioma.value = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
    } else {
        console.warn("Aviso: Elemento #selectIdioma não foi encontrado na página.");
    }
});

function aplicarTraducaoAtual() {
    const idiomaGuardado = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
    console.log(`Idioma atual detectado: ${idiomaGuardado}`);

    // Verificar se o objeto global 'traducoes' existe
    if (typeof traducoes === 'undefined') {
        console.error("Erro crítico: O objeto 'traducoes' não está definido! Certifique-se de que o seu arquivo de idiomas (i18n.js) está sendo carregado ANTES deste script.");
        return;
    }

    // 1. Traduz os elementos normais do HTML
    document.querySelectorAll('[data-i18n]').forEach(elemento => {
        const chave = elemento.getAttribute('data-i18n');
        if (traducoes[idiomaGuardado] && traducoes[idiomaGuardado][chave]) {
            elemento.textContent = traducoes[idiomaGuardado][chave];
        } else {
            console.warn(`Chave de tradução não encontrada ou incompleta para: "${chave}" no idioma "${idiomaGuardado}"`);
        }
    });
    // 2. CONEXÃO DA PLANILHA (CORRIGIDO: Colocado no escopo correto da função)
    // Só manda a planilha redesenhar se a função existir e se o Bootstrap já tiver criado as abas de dados
    if (typeof renderPlanilha === 'function' && typeof abas !== 'undefined' && abas.length > 0) {
        console.log("Planilha ativa encontrada! Redesenhando tabela com o novo idioma...");
        renderPlanilha(); 
    }
    
    // 4. CONEXÃO MÁGICA: Avisa o gráfico para se traduzir também
    if (window.myChart) {
        console.log("Gráfico encontrado! Atualizando idioma do gráfico...");
        atualizarIdiomaDoGrafico(idiomaGuardado);
    } else {
        console.log("O gráfico ainda não foi criado na memória (window.myChart está undefined). Ele será traduzido assim que for renderizado.");
    }
}

function mudarIdioma(idiomaSelecionado) {                                             
    localStorage.setItem(chaveUsuario('idiomaPreferido'), idiomaSelecionado);
    // Também grava uma chave "global" (sem id de conta), pra tela de login
    // conseguir mostrar o último idioma escolhido mesmo antes de autenticar
    // (sessionStorage.usuarioId ainda não existe nesse momento).
    localStorage.setItem('idiomaPreferido_global', idiomaSelecionado);
    aplicarTraducaoAtual();                                                              
}                                                                                         
                                                                                         
                                                                                         
                                                                                                                                                                           function atualizarIdiomaDoGrafico(idiomaSelecionado) {
  idiomaAtualGrafico = idiomaSelecionado; 

  const dicionarioAtivo = traducoes[idiomaSelecionado] || traducoes['pt'];
  if (!dicionarioAtivo) {
      console.error(`Não foi possível encontrar o dicionário para o idioma: ${idiomaSelecionado}`);
      return;
  }

  let localeCanvas = 'pt-BR';
  if (idiomaSelecionado === 'en') localeCanvas = 'en-US';
  else if (idiomaSelecionado === 'es') localeCanvas = 'es-ES';
  else if (idiomaSelecionado === 'fr') localeCanvas = 'fr-FR';
  else if (idiomaSelecionado === 'de') localeCanvas = 'de-DE';

  // 1. Atualiza os meses no eixo X
  myChart.data.labels = [
    dicionarioAtivo["grafico.meses.jan"] || 'Jan', dicionarioAtivo["grafico.meses.fev"] || 'Fev',
    dicionarioAtivo["grafico.meses.mar"] || 'Mar', dicionarioAtivo["grafico.meses.abr"] || 'Abr',
    dicionarioAtivo["grafico.meses.mai"] || 'Mai', dicionarioAtivo["grafico.meses.jun"] || 'Jun',
    dicionarioAtivo["grafico.meses.jul"] || 'Jul', dicionarioAtivo["grafico.meses.ago"] || 'Ago',
    dicionarioAtivo["grafico.meses.set"] || 'Set', dicionarioAtivo["grafico.meses.out"] || 'Out',
    dicionarioAtivo["grafico.meses.nov"] || 'Nov', dicionarioAtivo["grafico.meses.dez"] || 'Dez'
  ];

  // 2. Atualiza as legendas (Garante que o dataset exista antes de traduzir)
  if (myChart.data.datasets[0]) myChart.data.datasets[0].label = dicionarioAtivo["grafico.entrada"] || 'Entrada';
  if (myChart.data.datasets[1]) myChart.data.datasets[1].label = dicionarioAtivo["grafico.saida"] || 'Saída';

  // 3. Atualiza as configurações de formato do gráfico
  myChart.options.locale = localeCanvas;

  if (myChart.options.scales && myChart.options.scales.y && myChart.options.scales.y.title) {
    myChart.options.scales.y.title.text = dicionarioAtivo["grafico.tituloEixoY"] || 'Valor';
    myChart.options.scales.y.ticks.callback = v => v.toLocaleString(localeCanvas, { maximumFractionDigits: 0 });
  }

  myChart.options.plugins.tooltip.callbacks.label = function(context) {
    const v = context.parsed.r ?? context.parsed.y ?? context.parsed;
    const val = typeof v === 'number' ? v : 0;
    const numFormatado = val.toLocaleString(localeCanvas, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return ` ${context.dataset.label} — ${context.label}: ${numFormatado}`;
  };

  myChart.update();
  console.log("Gráfico atualizado e renderizado com sucesso!");
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ====================== CONTROLE DE CONFIGURAÇÕES (Tema e Notificações) ======================



// DOMContentLoaded responsável pelo carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando configurações do sistema...");

    // 1. Aplica o tema visual salvo no localStorage logo ao abrir a página
    aplicarTema();

    // 2. Traduz todo o HTML, a planilha e o gráfico baseando-se no idioma salvo
    if (typeof aplicarTraducaoAtual === 'function') {
        aplicarTraducaoAtual();
    }
});






// 1. Função executada automaticamente pelo 'onchange' do seu class="select-custom" HTML ao clicar no select
function mudarTema(novoTema) {
    console.log(`Usuário clicou e escolheu o tema: ${novoTema}`);
    
    // Grava a escolha no "disco" do navegador (localStorage)
    localStorage.setItem(chaveUsuario('temaPreferido'), novoTema);
    
    // Chama a função abaixo para pintar a tela imediatamente sem precisar dar F5
    aplicarTema();
}



// 2. Função responsável por aplicar visualmente o tema e as cores na tela
function aplicarTema() {
    const containerPrincipal = document.body; 
    const selectTema = document.getElementById('selectTema');
    
    // Busca o tema salvo ou assume 'claro' como padrão (Fallback)
    const temaSalvo = localStorage.getItem(chaveUsuario('temaPreferido')) || 'claro';

    
    if (!containerPrincipal) return; // Cláusula de segurança

    // 1. Configuração de cores lógicas do Gráfico para cada tema
    let corTextoGrafico, corGradeGrafico;

    // 2. Aplica os estilos de cores baseado no valor salvo no localStorage
    if (temaSalvo === 'claro') {
    
     const temaEntrada = document.getElementById('cardEntrada');
     const temaSaida = document.getElementById('cardSaida');
     const temaCard = document.querySelectorAll('.card-secao');
        
        temaCard.forEach(card =>{
        card.style.backgroundColor = '#f3f8f5'; //AQUI
        });
     
     // Perfil-header(cabeçalho) h1 refere ao elemento perfil contida na página de perfil.
     const headerTituloClaro = document.querySelector('.perfil-header h1');
        if (headerTituloClaro) {
        headerTituloClaro.style.color = '#0a2e1f';
        }
     
     // Garante que o título e elementos contidos ficam na cor cinza meio escuro.
     const titulosClaro = document.querySelectorAll('.secao-titulo');
        titulosClaro.forEach(titulo => {
        titulo.style.color = '#111827';
        });
     
    // Garante alteração de elementos contidos na secao-sub  
    const subtitulosClaro = document.querySelectorAll('.secao-sub');
        subtitulosClaro.forEach(subtitulo => {
        subtitulo.style.color = '#6b7280';
        });

    // Garante alteração de elementos contidos no campo-label  
    const labelsClaro = document.querySelectorAll('.campo-label');
        labelsClaro.forEach(label => {
        label.style.color = '#111827';
        });
    
    // Aqui, garante alteração de todos os elementos contidos dentro perfil.idioma e perfil.aparencia.
    const textosApoioClaro = document.querySelectorAll('[data-i18n="perfil.idioma.sub"], [data-i18n="perfil.aparencia.sub"]');
        textosApoioClaro.forEach(apoio => {
        apoio.style.color = '#6b7280';
        });
        
        // Garante o padrão das cores conforme as regras de negócio
        if(temaEntrada && temaSaida){
          temaEntrada.style.color = '#1a5c42';
          temaSaida.style.color = '#e53935';
        }
        
        // Mudança de fundo da tela do sistema.
        containerPrincipal.style.backgroundColor = '#f0f4f2';
        containerPrincipal.style.color = '#1a5c42';
        
        // Cores do gráfico para o modo claro
        corTextoGrafico = '#374151'; // Textos escuros para dar leitura no fundo claro
        corGradeGrafico = '#f0f0f0'; // Linhas de grade bem suaves
         
        // Realiza alterações nos elementos contidos na toggle-titulo 
        const toggleTitulosClaro = document.querySelectorAll('.toggle-titulo');
        toggleTitulosClaro.forEach(toggleTitulo => {
        toggleTitulo.style.color = '#111827';
        });
        
        /* A MESMA LÓGICA SE APLICA AO TEMA ESCURO, FAZ VALIDAÇÃO DE TEMA SALVO E
        EXECUTA MODIFICAÇÕES DE ELEMENTOS E TEXTOS CONTIDOS NOS PARÂMETROS DAS VARIÁVEIS (CONST).*/
        
        
    } else if (temaSalvo === 'escuro') {
        
        const tema = document.querySelectorAll('.card-financeiro');
        const temaEntrada = document.getElementById('cardEntrada');
        const temaSaida = document.getElementById('cardSaida');
        
        const headerTitulo = document.querySelector('.perfil-header h1');
        if (headerTitulo) {
        headerTitulo.style.color = '#ffffff';
        }
        
        const pagina = document.querySelectorAll('.secao-titulo');
        pagina.forEach(pagina =>{
        pagina.style.color = '#ffffff';
        pagina.style.fontWeight = '700';
        });
        
        // Subtítulos dos cards (ex: "Gerencie suas informações pessoais e preferências")
        const subtitulos = document.querySelectorAll('.secao-sub');
        subtitulos.forEach(subtitulo => {
        subtitulo.style.color = '#d1d5db';
        });

        // Labels dos campos (ex: "Nome", "Email", "Idioma", "Aparência")
        const labels = document.querySelectorAll('.campo-label');
        labels.forEach(label => {
        label.style.color = '#ffffff';
        });

        // Textos de apoio abaixo do label (ex: "Selecione o idioma da interface", "Selecione o tema da interface")
        const textosApoio = document.querySelectorAll('[data-i18n="perfil.idioma.sub"], [data-i18n="perfil.aparencia.sub"]');
        textosApoio.forEach(apoio => {
        apoio.style.color = '#d1d5db';
        });
        
        const toggleTitulos = document.querySelectorAll('.toggle-titulo');
        toggleTitulos.forEach(toggleTitulo => {
        toggleTitulo.style.color = '#ffffff';
        });
        
        const temaCard = document.querySelectorAll('.card-secao');
        temaCard.forEach(card =>{
        card.style.backgroundColor = '#1e1e1e';
        });
        
       
    // 1. Busca direto o rótulo que está dentro do card de entrada
       const rotuloEntrada = document.querySelector('.card-financeiro .rotulo-entrada');
       if (rotuloEntrada) {
           rotuloEntrada.style.color = '#00e676'; // Verde forte para Entrada
          }

    // 2. Busca direto o rótulo que está dentro do card de saída
       const rotuloSaida = document.querySelector('.card-financeiro .rotulo-saida');
          if (rotuloSaida) {
              rotuloSaida.style.color = '#ff5252'; // Vermelho forte para Saída
             }
        
        if(temaEntrada && temaSaida){
          temaEntrada.style.color = '#00e676';
          temaSaida.style.color = '#ff5252';
        }
        
        // Garante que o tema de entrada e saída estejam no modo escuro.
        tema.forEach(card => {
        card.style.backgroundColor = '#1e1e1e';
    });
        // Tema de fundo do sistema, neste caso modo escuro.
        containerPrincipal.style.backgroundColor = '#141414';
        containerPrincipal.style.color = '#FFFFFF';
        
        // Cores do gráfico para o modo escuro (Inversão de contraste)
        const fundoTema = document.querySelector('.chart-card');
        if(fundoTema){
          fundoTema.style.backgroundColor = '#1e1e1e';
        }
        corTextoGrafico = '#FFFFFF'; // Textos brancos para dar leitura no fundo escuro
        corGradeGrafico = '#9ca3af'; // Linhas de grade escuras discretas
    }

    // 3. CONEXÃO MÁGICA DO GRÁFICO: Altera o estilo do Chart.js se ele existir na tela
    if (typeof myChart !== 'undefined' && myChart !== null) {
        // Altera a cor das legendas superiores (Entrada / Saída)
        myChart.options.plugins.legend.labels.color = corTextoGrafico;

        // Altera as cores do Eixo X (Meses e linhas verticais)
        if (myChart.options.scales && myChart.options.scales.x) {
            myChart.options.scales.x.ticks.color = corTextoGrafico;
            myChart.options.scales.x.grid.color = corGradeGrafico;
        }

        // Altera as cores do Eixo Y (Valores e linhas horizontais)
        if (myChart.options.scales && myChart.options.scales.y) {
            myChart.options.scales.y.ticks.color = corTextoGrafico;
            myChart.options.scales.y.grid.color = corGradeGrafico;
            if (myChart.options.scales.y.title) {
                myChart.options.scales.y.title.color = corTextoGrafico; // Título lateral "Valor"
            }
        }
        
        
        // Altera as cores da Escala Radial (gráfico Radar: números do centro e indicadores dos meses)
        if (myChart.options.scales && myChart.options.scales.r) {
            if (!myChart.options.scales.r.ticks) myChart.options.scales.r.ticks = {};
            if (!myChart.options.scales.r.pointLabels) myChart.options.scales.r.pointLabels = {};
            if (!myChart.options.scales.r.grid) myChart.options.scales.r.grid = {};
            if (!myChart.options.scales.r.angleLines) myChart.options.scales.r.angleLines = {};

            myChart.options.scales.r.ticks.color = corTextoGrafico;        // números que saem do centro
            myChart.options.scales.r.ticks.backdropColor = 'transparent';  // remove a caixinha branca padrão atrás de cada número
            myChart.options.scales.r.pointLabels.color = corTextoGrafico;  // indicadores (nomes dos meses) ao redor
            myChart.options.scales.r.grid.color = corGradeGrafico;        // teia do radar
            myChart.options.scales.r.angleLines.color = corGradeGrafico;  // linhas que saem do centro
        }
        

        // Força o Chart.js a re-renderizar internamente os pixels com as novas cores
        myChart.update();
        console.log(`Gráfico adaptado visualmente para o tema: ${temaSalvo}`);
    }

    // Mantém o elemento <select> visualmente sincronizado com o tema ativo
    if (selectTema) {
        selectTema.value = temaSalvo; 
    }
}



// (função inicializarNotificacoes removida — duplicava a lógica que já
// existe no primeiro DOMContentLoaded deste arquivo, agora isolada por conta)

async function salvarPerfil() {
  // 1. Lê os campos do formulário
  const campoNome  = document.getElementById('perfilNome');
  const campoEmail = document.getElementById('perfilEmail');

  if (!campoNome || !campoEmail) return;

  // Limpa estilos de erro anteriores
  campoNome.style.borderColor = '';
  campoEmail.style.borderColor = '';

  // 2. Sanitiza os dados
  const novoNome  = sanitizarTexto(campoNome.value.trim());
  const novoEmail = sanitizarTexto(campoEmail.value.trim());

  // 3. Valida os campos
  if (!novoNome) {
    campoNome.style.borderColor = '#e53935';
    return;
  }
  if (!novoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
    campoEmail.style.borderColor = '#e53935';
    return;
  }

  const btn = document.querySelector('.btn-salvar');
  const idUsuario = sessionStorage.getItem('usuarioId');

  // Dicionário com a chave "sucesso" adicionada
  const textosPerfil = {
    pt: { salvando: "Salvando...", 
    sucesso: "✓ Salvo!", 
    salvar: "Salvar Alterações", 
    erroSalvar: "Não foi possível salvar as alterações.", 
    erroConexao: "Não foi possível conectar ao servidor. Verifique sua conexão." },
    
    en: { 
    salvando: "Saving...", 
    sucesso: "✓ Saved!", 
    salvar: "Save Changes", 
    erroSalvar: "Could not save changes.", 
    erroConexao: "Could not connect to the server. Check your connection." 
    },
    
    es: { 
    salvando: "Guardando...", 
    sucesso: "✓ ¡Guardado!", 
    salvar: "Guardar Cambios", 
    erroSalvar: "No se pudieron guardar los cambios.", 
    erroConexao: "No se pudo conectar al servidor. Verifique su conexión." 
    },
    fr: { 
    salvando: "Enregistrement...", 
    sucesso: "✓ Enregistré !", 
    salvar: "Enregistrer les modifications", 
    erroSalvar: "Impossible d'enregistrer les modifications.", 
    erroConexao: "Impossible de se connecter au serveur. Vérifiez votre connexion." 
    },
    
    de: { 
    salvando: "Speichern...", 
    sucesso: "✓ Gespeichert!", 
    salvar: "Änderungen speichern", 
    erroSalvar: "Änderungen konnten nicht gespeichert werden.", 
    erroConexao: "Keine Verbindung zum Server möglich. Überprüfen Sie Ihre Verbindung." 
    },
    
    jp: { 
    salvando: "保存中...", 
    sucesso: "✓ 保存しました！", 
    salvar: "変更を保存", 
    erroSalvar: "変更を保存できませんでした。", 
    erroConexao: "サーバーに接続できませんでした。接続を確認してください。" 
    },
    
    it: { 
    salvando: "Salvataggio...", 
    sucesso: "✓ Salvato!", 
    salvar: "Salva Modifiche", 
    erroSalvar: "Impossibile salvare le modifiche.", 
    erroConexao: "Impossibile connettersi al server. Controlla la tua connessione." 
    },
    po: { 
    salvando: "Zapisywanie...", 
    sucesso: "✓ Zapisano!", 
    salvar: "Zapisz zmiany", 
    erroSalvar: "Nie można zapisać zmian.", 
    erroConexao: "Nie można połączyć się z serwerem. Sprawdź swoje połączenie."
    },
    
    ne: { 
    salvando: "Opslaan...", 
    sucesso: "✓ Opgeslagen!", 
    salvar: "Wijzigingen opslaan", 
    erroSalvar: "Kon wijzigingen niet opslaan.", 
    erroConexao: "Kan geen verbinding maken met de server. Controleer uw verbinding." 
    }
  };

  const rawLang = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const lang = rawLang.slice(0, 2).toLowerCase();
  const t = textosPerfil[lang] || textosPerfil['pt'];

  // Guarda a cor original do botão para restaurar depois
  const corOriginal = btn ? btn.style.background : '';

  // Estado 1: "Salvando..."
  if (btn) { 
    btn.textContent = t.salvando; 
    btn.disabled = true; 
  }

  try {
    // Garante tempo mínimo de 800ms para a animação "Salvando..." ser visível
    const tempoMinimo = new Promise(resolve => setTimeout(resolve, 800));

    const [resposta] = await Promise.all([
      fetch(`${API}/usuarios/${idUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome, email: novoEmail }),
        signal: AbortSignal.timeout(8000)
      }),
      tempoMinimo
    ]);

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      campoEmail.style.borderColor = '#e53935';
      alert(dados.erro || t.erroSalvar);

      // Restauração imediata em caso de erro no servidor
      if (btn) {
        btn.textContent = t.salvar;
        btn.disabled = false;
      }
      return;
    }

    // 4. Atualiza a sessão local
    sessionStorage.setItem('usuarioNome', dados.nome);
    sessionStorage.setItem('usuarioEmail', dados.email);

    // Estado 2: "✓ Salvo!" (Sucesso)
    if (btn) {
      btn.textContent = t.sucesso;
      btn.style.background = '#0a2e1f'; // Verde escuro de sucesso
    }

    // Estado 3: Aguarda 2 segundos e volta ao botão padrão
    setTimeout(() => {
      if (btn) {
        btn.textContent = t.salvar;
        btn.style.background = corOriginal;
        btn.disabled = false;
      }
    }, 2000);

  } catch (e) {
    alert(t.erroConexao);

    // Restauração imediata em caso de erro de rede
    if (btn) {
      btn.textContent = t.salvar;
      btn.style.background = corOriginal;
      btn.disabled = false;
    }
  }
}


// Executa a exclusão definitiva: apaga a conta no banco (via API), depois
// apaga tudo o que resta no localStorage e na sessão, e volta para o login.

// ====================== EXCLUSÃO PERMANENTE DE CONTA ======================

let _modalExcluirContaInstancia = null;

// Abre o modal de confirmação (chamado pelo botão "Excluir minha conta")
function abrirModalExclusaoConta() {
  const modalEl = document.getElementById('modalExcluirConta');
  if (!modalEl) return;

  const input = document.getElementById('confirmacaoExclusaoInput');
  const btnConfirmar = document.getElementById('btnConfirmarExclusao');
  if (input) input.value = '';
  if (btnConfirmar) btnConfirmar.disabled = true;

  _modalExcluirContaInstancia = bootstrap.Modal.getOrCreateInstance(modalEl);
  _modalExcluirContaInstancia.show();
}

function fecharModalExclusaoConta() {
  if (_modalExcluirContaInstancia) _modalExcluirContaInstancia.hide();
}

function validarConfirmacaoExclusao() {
  const input = document.getElementById('confirmacaoExclusaoInput');
  const btnConfirmar = document.getElementById('btnConfirmarExclusao');
  if (!input || !btnConfirmar) return;
  btnConfirmar.disabled = input.value.trim().toUpperCase() !== 'EXCLUIR';
}

function limparLocalStorageDaConta(idUsuario) {
  const sufixo = `_${idUsuario}`;
  const chavesParaRemover = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.endsWith(sufixo)) {
      chavesParaRemover.push(chave);
    }
  }
  chavesParaRemover.forEach(chave => localStorage.removeItem(chave));
}

// Executa a exclusão definitiva
async function confirmarExclusaoConta() {
  const idUsuario = sessionStorage.getItem('usuarioId');
  const btnConfirmar = document.getElementById('btnConfirmarExclusao');

  const textosExclusao = {
    pt: { excluindo: "Excluindo...", 
    excluirPermanentemente: "Excluir permanentemente", 
    erroExcluir: "Não foi possível excluir a conta. Tente novamente.", 
    erroConexao: "Não foi possível conectar ao servidor. Verifique sua conexão.", 
    sucesso: "Sua conta foi excluída permanentemente. Um e-mail de confirmação foi enviado." 
    },
    en: { 
    excluindo: "Deleting...", 
    excluirPermanentemente: "Delete permanently", 
    erroExcluir: "Could not delete the account. Please try again.", 
    erroConexao: "Could not connect to the server. Check your connection.", 
    sucesso: "Your account has been permanently deleted. A confirmation email has been sent." 
    },
    es: { 
    excluindo: "Eliminando...", 
    excluirPermanentemente: "Eliminar permanentemente", 
    erroExcluir: "No se pudo eliminar la cuenta. Inténtalo de nuevo.", 
    erroConexao: "No se pudo conectar al servidor. Verifique su conexión.", 
    sucesso: "Tu cuenta ha sido eliminada permanentemente. Se ha enviado un correo de confirmación." 
    },
    fr: { excluindo: "Suppression...", 
    excluirPermanentemente: "Supprimer définitivement", 
    erroExcluir: "Impossible de supprimer le compte. Veuillez réessayer.", 
    erroConexao: "Impossible de se connecter au serveur. Vérifiez votre connexion.", 
    sucesso: "Votre compte a été supprimé définitivement. Un e-mail de confirmation a été envoyé." 
    },
    de: { excluindo: "Wird gelöscht...", 
    excluirPermanentemente: "Endgültig löschen", 
    erroExcluir: "Das Konto konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.", 
    erroConexao: "Keine Verbindung zum Server möglich. Überprüfen Sie Ihre Verbindung.", 
    sucesso: "Ihr Konto wurde endgültig gelöscht. Eine Bestätigungs-E-Mail wurde gesendet." 
    },
    jp: { 
    excluindo: "削除中...", 
    excluirPermanentemente: "完全に削除", 
    erroExcluir: "アカウントを削除できませんでした。もう一度お試しください。", 
    erroConexao: "サーバーに接続できませんでした。接続を確認してください。", 
    sucesso: "アカウントは完全に削除されました。確認メールが送信されました。" 
    },
    it: { 
    excluindo: "Eliminazione...", 
    excluirPermanentemente: "Elimina definitivamente", 
    erroExcluir: "Impossibile eliminare l'account. Riprova.", 
    erroConexao: "Impossibile connettersi al server. Controlla la tua connessione.", 
    sucesso: "Il tuo account è stato eliminato definitivamente. È stata inviata un'e-mail di conferma." 
    },
    po: { 
    excluindo: "Usuwanie...", 
    excluirPermanentemente: "Usuń trwale", 
    erroExcluir: "Nie można usunąć konta. Spróbuj ponownie.", 
    erroConexao: "Nie można połączyć się z serwerem. Sprawdź swoje połączenie.", 
    sucesso: "Twoje konto zostało trwale usunięte. Wysłano e-mail z potwierdzeniem." 
    },
    ne: { excluindo: "Verwijderen...", 
    excluirPermanentemente: "Permanent verwijderen", 
    erroExcluir: "Kon het account niet verwijderen. Probeer het opnieuw.", 
    erroConexao: "Kan geen verbinding maken met de server. Controleer uw verbinding.", 
    sucesso: "Je account is permanent verwijderd. Er is een bevestigingsmail verzonden." 
    }
  };

  const rawLang = localStorage.getItem(chaveUsuario('idiomaPreferido')) || 'pt';
  const lang = rawLang.slice(0, 2).toLowerCase();
  const t = textosExclusao[lang] || textosExclusao['pt'];

  if (!idUsuario) {
    window.location.href = 'login.html';
    return;
  }

  if (btnConfirmar) {
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = t.excluindo;
  }

  try {
    const resposta = await fetch(`${API}/usuarios/${idUsuario}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(8000)
    });

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      alert(dados.erro || t.erroExcluir);
      if (btnConfirmar) {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = t.excluirPermanentemente;
      }
      return;
    }
  } catch (e) {
    alert(t.erroConexao);
    if (btnConfirmar) {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = t.excluirPermanentemente;
    }
    return;
  }

  limparLocalStorageDaConta(idUsuario);
  sessionStorage.clear();
  fecharModalExclusaoConta();
  alert(t.sucesso);
  window.location.href = 'login.html';
}



  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

/*
  O que cada tela é, em texto curto.

  Isto é o conteúdo do botão de interrogação — não documentação de produto.
  A diferença é prática: quem abre esse painel está com a tela na frente e
  uma dúvida específica, não querendo ler um manual. Então cada verbete tem,
  no máximo:

    resumo   → o que essa tela é, em uma ou duas frases
    passos   → o que se faz aqui, na ordem em que se faz
    atencao  → a pegadinha que só se descobre errando

  E "atencao" só existe onde existe pegadinha de verdade. Aviso em toda tela
  vira paisagem, e aí ninguém lê o que importa.

  A CHAVE é a rota, e opcionalmente a aba: "/tracking", "/tracking:pessoas",
  "/tracking:configuracoes/automacoes". Quem resolve isso é `tutorialDaTela`,
  que cai da chave mais específica pra mais genérica — então uma aba sem
  verbete próprio mostra o da página, em vez de nada.
*/

export interface Tutorial {
  titulo: string;
  resumo: string;
  passos?: string[];
  atencao?: string;
}

const TUTORIAIS: Record<string, Tutorial> = {
  /* ─────────────────────────── início ─────────────────────────── */

  "/dashboard": {
    titulo: "Dashboard",
    resumo:
      "O resumo do dia. Os números de hoje comparados com ontem, o que está fora do lugar e o que acabou de entrar — na ordem de quem abre o app de manhã e precisa decidir o que fazer.",
    passos: [
      "Leia a faixa de cima: leads, checkout, compras, receita, corretora e depositado, cada um com a diferença em relação a ontem.",
      "Em “Precisa de atenção”, clique no cartão: ele abre a tela onde aquilo se resolve, já com o filtro aplicado.",
      "“Acontecendo hoje” lista compra, contrato, cadastro e depósito na ordem de chegada.",
    ],
    atencao:
      "Cartão de atenção só aparece quando existe algo pra fazer. Lista vazia com “nada pedindo atenção” é boa notícia, não erro.",
  },

  "/comunidade": {
    titulo: "Comunidade",
    resumo:
      "As salas da equipe. A sala e o chat são permanentes — ficam guardados e a conversa continua de onde parou. A chamada de voz/vídeo é temporária: ela acontece dentro da sala e acaba quando a última pessoa sai.",
    passos: [
      "Escolha a sala na coluna da esquerda. O número ao lado do nome é o que você ainda não leu.",
      "Pra falar, use o botão azul no rodapé, à direita do campo de mensagem. Ele vira vermelho (“Sair da chamada”) no mesmo lugar.",
      "Dentro da chamada: microfone, câmera, compartilhar tela e dispositivos ficam na faixa de cima.",
    ],
    atencao:
      "Abrir a sala nunca pede microfone — só o botão de entrar na chamada pede. E a chamada não cai se você navegar pelo app: ela vira uma barra no canto, justamente pra dar pra mostrar uma tela do próprio ENGINE.",
  },

  "/tarefas": {
    titulo: "Tarefas",
    resumo:
      "O quadro da equipe, por projeto. Colunas que você mesmo define, cartões arrastáveis e anexos em cada cartão.",
    passos: [
      "Arraste o cartão entre as colunas pra mudar o estado.",
      "Abra o cartão pra escrever a descrição e anexar arquivo ou imagem.",
    ],
    atencao: "O quadro é do projeto selecionado na barra de cima — trocar de projeto troca o quadro.",
  },

  "/calendario": {
    titulo: "Calendário",
    resumo:
      "O que está acontecendo em cada dia, com a notícia do nicho do projeto ao lado. Serve pra decidir o assunto do conteúdo do dia.",
    passos: [
      "Clique num dia pra ver a notícia do momento.",
      "De lá, siga pra Dinâmicas do Dia ou Mensagens X1 já com o contexto daquele dia.",
    ],
  },

  "/dinamicas-do-dia": {
    titulo: "Dinâmicas do Dia",
    resumo:
      "As mensagens do dia para o grupo, com os cálculos reais de performance por trás. Dá pra rodar uma dinâmica pronta, gerar variações por IA em cada mensagem, ou gerar livre sem partir de template.",
    passos: [
      "Escolha a dinâmica do dia (ou gere livre).",
      "Em cada mensagem, gere variações e escolha a que ficou melhor.",
      "Marque o dia como concluído: é isso que alimenta o Analytics.",
    ],
    atencao:
      "Os números que entram nos textos vêm de Configurações → Performance de Trading. Número errado lá sai como promessa errada aqui.",
  },

  "/dinamicas-do-dia/gerenciar": {
    titulo: "Gerenciar dinâmicas",
    resumo:
      "O cadastro das dinâmicas: quais existem, quais mensagens cada uma tem e em que horário cada mensagem entra.",
    passos: [
      "Crie a dinâmica e defina os slots (horário + tipo de mensagem).",
      "O que você cadastra aqui é o que aparece pra rodar em Dinâmicas do Dia.",
    ],
  },

  /* ─────────────────────────── criação ─────────────────────────── */

  "/gerador-de-criativos": {
    titulo: "Gerador de Criativos",
    resumo: "Descreva o criativo e gere a imagem. A referência existe pra manter o estilo de algo que já funciona.",
    passos: [
      "Escreva o que quer ver. Quanto mais concreto (enquadramento, luz, cena), menos tentativa.",
      "Suba uma referência quando quiser o mesmo estilo de uma peça anterior.",
      "Tudo que sai aqui fica guardado na Biblioteca de Imagens.",
    ],
  },

  "/blog": {
    titulo: "Blog",
    resumo:
      "Gera o post a partir de um tema ou de uma slug — texto, capa e dados de SEO — e guarda como rascunho no domínio escolhido. Tem duas abas: Posts (o conteúdo) e Domínios (onde ele vai morar).",
    passos: [
      "Em Posts: preencha o tema OU a slug (quando a URL já está decidida) e gere.",
      "Abra o post pra editar à mão: título, texto, e a capa — dá pra mexer no prompt e gerar de novo, mandar outra imagem, ou jogar a imagem pro meio do texto.",
      "Em Domínios: cadastre onde o blog fica e prove a posse por registro TXT no DNS.",
      "Nada vai pro ar sem você marcar como publicado.",
    ],
    atencao:
      "O domínio escolhido define idioma, público e tom de voz que entram no prompt. Sem domínio, o texto sai genérico.",
  },

  "/emails": {
    titulo: "E-mails",
    resumo:
      "Escreve a campanha do dia a partir das notícias do calendário — assunto, preview e corpo — e guarda com status.",
    passos: ["Escolha o assunto do dia.", "Gere, ajuste o texto e salve.", "O status diz o que já foi usado."],
  },

  "/conversas": {
    titulo: "Simulador de Conversas",
    resumo:
      "Monta conversas fictícias de WhatsApp, Instagram Direct ou CRM pra usar como prova social, e exporta como imagem.",
    passos: [
      "Escolha a plataforma — o visual muda junto.",
      "Escreva as mensagens ou gere por IA.",
      "Exporte como imagem.",
    ],
    atencao: "É conversa fictícia pra material de marketing. Não use nome, foto ou print de pessoa real sem autorização.",
  },

  "/mensagens-x1": {
    titulo: "Mensagens X1",
    resumo:
      "Mensagens individuais pra alunos, segmentadas por perfil, com geração por IA e histórico do que já foi mandado.",
    passos: ["Escolha o perfil do aluno.", "Gere a mensagem e ajuste.", "O histórico evita mandar a mesma coisa duas vezes."],
  },

  /* ─────────────────────────── dados ─────────────────────────── */

  "/tracking": {
    titulo: "Tracking",
    resumo:
      "O funil completo do lead: anúncio → landing → checkout → área de membros → corretora → depósito. Ele existe pra responder o que painel de anúncio nenhum responde — de onde veio quem chegou até o fim.",
    passos: [
      "Visão geral: o resultado e o funil.",
      "Performance: o resultado por campanha.",
      "Pessoas: quem comprou e em que pé está.",
      "Eventos: o log cru do que chegou.",
      "Ferramentas: o gerador de link e o script do site.",
      "Configurações: webhooks, contas de anúncio e automações.",
    ],
    atencao:
      "O filtro de período e de fonte, no topo, vale pra tudo que está abaixo dele — inclusive as outras abas.",
  },

  "/tracking:visao": {
    titulo: "Tracking · Visão geral",
    resumo:
      "O painel do funil. De cima pra baixo: quanto entrou, as oito etapas em pessoas, de onde vieram os resultados, quando acontecem e os detalhes da venda.",
    passos: [
      "Clique numa etapa do funil: a tabela de origem reordena por ela e os gráficos de horário passam a contar aquela etapa.",
      "Na matriz de origem, clique na origem pra abrir as campanhas dela.",
      "A etiqueta “maior queda” marca onde o funil perde mais gente.",
    ],
    atencao:
      "O número grande de cada etapa é de PESSOAS; a contagem de eventos vem do lado quando os dois diferem. Acesso à área de membros, por exemplo, repete a mesma pessoa várias vezes por dia — por isso a etapa mostra as duas coisas. Onde o evento chegou sem casar com um lead, a conversão aparece como “—”, nunca como porcentagem estimada.",
  },

  "/tracking:performance": {
    titulo: "Tracking · Performance",
    resumo: "O resultado por campanha: gasto, leads, compras, receita, depósitos e o retorno de cada uma.",
    atencao:
      "ROI, ROAS e lucro só aparecem depois de conectar Meta Ads / Google Ads e sincronizar o gasto. Sem gasto, a tela mostra faturamento — que já é conhecido — em vez de inventar um retorno.",
  },

  "/tracking:pessoas": {
    titulo: "Tracking · Pessoas",
    resumo:
      "Quem comprou e em que pé está: plano, contrato assinado, conta no Pepe e depósito na corretora. É a lista de cobrança — existe pra achar quem ficou pelo caminho.",
    passos: [
      "Escolha a fila pelos botões: sem contrato, sem Pepe, sem corretora, conta sem depósito. O número no botão é o tamanho da fila.",
      "Clique no telefone pra abrir a conversa no WhatsApp.",
      "“Conta sem depósito” é a fila mais quente: a pessoa já abriu conta na corretora e só não pôs dinheiro.",
    ],
    atencao:
      "O casamento é por e-mail. Quem comprou com um e-mail e se cadastrou na corretora com outro aparece como “sem conta” mesmo tendo depositado — confira antes de cobrar.",
  },

  "/tracking:eventos": {
    titulo: "Tracking · Eventos",
    resumo:
      "O log cru: cada evento que chegou, de qual origem, com qual e-mail e valor. É onde se confere se a integração está entregando.",
    atencao:
      "“Não atribuído” quer dizer que o evento chegou mas não casou com nenhum lead — ele conta nos totais e fica fora do resultado por campanha. Muito disso significa que o link do checkout está perdendo o parâmetro de rastreio.",
  },

  "/tracking:ferramentas": {
    titulo: "Tracking · Ferramentas",
    resumo: "As duas peças que fazem o rastreio funcionar do lado de fora: o gerador de link e o script do site.",
  },

  "/tracking:ferramentas/utms": {
    titulo: "Tracking · Gerador de link",
    resumo:
      "Monta o link com as UTMs e com o parâmetro que carrega o lead até o checkout. É esse parâmetro que liga a venda ao anúncio.",
    passos: [
      "Preencha origem, campanha e o resto das UTMs (ou use um preset).",
      "Para link de checkout, marque a opção correspondente: o link sai pronto pro script preencher o lead no clique.",
    ],
  },

  "/tracking:ferramentas/rastreamento": {
    titulo: "Tracking · Script do site",
    resumo:
      "O código que se cola na landing. Ele cria o lead na primeira visita, guarda as UTMs e carimba o lead no link do checkout.",
    atencao:
      "Sem esse script no site, o funil começa vazio: a compra chega por webhook mas não tem de onde ter vindo.",
  },

  "/tracking:configuracoes": {
    titulo: "Tracking · Configurações",
    resumo: "Onde as integrações são ligadas: fontes de dados, contas de anúncio e automações de mensagem.",
  },

  "/tracking:configuracoes/fontes": {
    titulo: "Tracking · Fontes de dados",
    resumo:
      "Os endpoints de webhook, um por origem (checkout, área de membros, corretora, ferramenta, contrato). Cada um tem endereço e token próprios, e um botão de teste.",
    passos: [
      "Crie o endpoint da origem, copie o endereço e o token.",
      "Cole os dois no painel da plataforma.",
      "Use “Testar” pra confirmar que o formato do payload é entendido antes de depender dele.",
    ],
    atencao:
      "Chamada “não reconhecida” no log não é erro: é a plataforma mandando um tipo de evento que a gente não escuta. Muitas delas seguidas, porém, é sinal de que a plataforma mudou o formato.",
  },

  "/tracking:configuracoes/anuncios": {
    titulo: "Tracking · Anúncios",
    resumo:
      "As contas de Meta Ads e Google Ads. É a conexão delas que traz o gasto e destrava ROI, ROAS e lucro no resto do módulo.",
  },

  "/tracking:configuracoes/automacoes": {
    titulo: "Tracking · Automações",
    resumo:
      "Os disparos automáticos de mensagem (boas-vindas e pós-contrato) e o histórico de cada tentativa.",
    atencao:
      "“Não saiu por regra” é diferente de “não chegou”. Por regra é o sistema barrando de propósito (funil desligado, sem telefone, e-mail sem compra casada); não chegou é falha de entrega. O histórico separa os dois.",
  },

  "/analytics": {
    titulo: "Analytics",
    resumo:
      "O resultado de cada dia marcado como concluído em Dinâmicas do Dia: faturamento, depósitos, volume de Pepe/Live/Copy e qual dinâmica performou melhor.",
    atencao:
      "Os números vêm do preenchimento manual do dia, não do Tracking. São duas leituras diferentes da mesma operação — se divergirem muito, uma das duas está desatualizada.",
  },

  /* ─────────────────────────── biblioteca ─────────────────────────── */

  "/prompts": {
    titulo: "Biblioteca de Prompts",
    resumo:
      "Prompts reutilizáveis nos módulos de conversas, calendário de engajamento e e-mails. Qualquer pessoa da equipe cria, edita e organiza as colunas.",
  },

  "/biblioteca-imagens": {
    titulo: "Biblioteca de Imagens",
    resumo:
      "Todas as imagens geradas por qualquer pessoa da equipe, em qualquer dispositivo. Arraste pra dentro das pastas pra organizar.",
  },

  "/numeros": {
    titulo: "Números",
    resumo:
      "Registro manual dos números de WhatsApp/SendPulse usados pra falar com o cliente — sem função ativa, é só pra organizar quem cuida de qual número.",
    passos: [
      "Cadastre o número, dê um nome pra ele e escolha uma cor pra identificar rápido na lista.",
      "Função é Suporte ou Comercial — separa os dois grupos na tela.",
      "O responsável vem da lista de usuários aprovados do app, não de texto livre.",
    ],
  },

  "/egi": {
    titulo: "Egi — IA de atendimento",
    resumo:
      "Cole a pergunta do aluno como ele escreveu e a Egi devolve a resposta pronta, com o nível de alerta, com base no manual de atendimento.",
    passos: [
      "Confira o selo antes de enviar: 🟢 pode responder, 🟡 acolha primeiro, 🔴 não envie sem aprovação.",
      "“Copiar resposta pro aluno” copia só o texto que vai pro aluno — sem os cuidados e o resto que é pra equipe.",
      "Resposta boa? “Salvar no FAQ”: ela vira referência pra toda a equipe e a Egi passa a usá-la nas próximas.",
      "Suas conversas são só suas. O FAQ é da equipe inteira.",
      "O prompt e o manual ficam em Configurações → Egi — IA.",
    ],
  },

  /* ─────────────────────────── operação ─────────────────────────── */

  "/acessos": {
    titulo: "Acessos",
    resumo:
      "Onde a equipe entra: login de cada conta, em qual celular está o segundo fator e quanto as assinaturas custam por mês.",
    passos: [
      "“Ver senha” abre a senha na tela e ela some sozinha em 30 segundos; “Copiar” leva direto pro seu clipboard.",
      "Marque “Entra com o login do Google” nas contas que não têm senha própria.",
      "O total mensal converte dólar e divide anuidade por 12 — o número é comparável.",
    ],
    atencao:
      "Área restrita a admin, e por um motivo: além da senha, aqui está anotado onde mora o 2FA de cada conta.",
  },

  "/projetos": {
    titulo: "Configurações de Projeto",
    resumo:
      "Cada projeto é um espaço de trabalho próprio: tarefas, prompts, tracking e imagens são separados por projeto.",
    atencao:
      "O PROFITX é o projeto padrão e não pode ser excluído — é pra ele que o app volta quando alguém perde acesso a um projeto ou quando um projeto é desativado.",
  },

  "/perfil": {
    titulo: "Configurações do Perfil",
    resumo: "Seu nome, que aparece pra equipe na Comunidade e nas tarefas, e sua senha de acesso.",
  },

  "/configuracoes": {
    titulo: "Configurações da Plataforma",
    resumo:
      "As chaves de API que a geração usa (OpenAI/Anthropic), qual modelo cada módulo chama, e os números reais de performance de trading.",
    atencao:
      "Performance de Trading alimenta os cálculos das dinâmicas de grupo e o contexto do Direct. Número errado aqui sai como promessa errada pro aluno.",
  },

  "/admin": {
    titulo: "Admin",
    resumo:
      "Quem entra no ENGINE: aprovar cadastro novo, definir o papel de cada pessoa e liberar quais projetos ela vê.",
    atencao:
      "Cadastro novo nasce como pendente e não entra em nada até alguém aprovar aqui — inclusive quem entra pelo Google.",
  },
};

/**
 * O verbete da tela atual.
 *
 * Cai do mais específico pro mais genérico: aba com sub-aba → aba → rota →
 * rota-mãe (pra /dinamicas-do-dia/gerenciar cair em /dinamicas-do-dia se um
 * dia o verbete sair). Sem isso, tela nova nasceria com o botão morto.
 */
export function tutorialDaTela(
  pathname: string,
  aba?: string | null,
  sub?: string | null
): Tutorial | null {
  const caminho = pathname.replace(/\/+$/, "") || "/dashboard";

  const tentativas = [
    aba && sub ? `${caminho}:${aba}/${sub}` : null,
    aba ? `${caminho}:${aba}` : null,
    caminho,
  ].filter((c): c is string => !!c);

  for (const chave of tentativas) {
    if (TUTORIAIS[chave]) return TUTORIAIS[chave];
  }

  // Rota filha sem verbete próprio herda o da mãe: /a/b/c → /a/b → /a.
  const partes = caminho.split("/").filter(Boolean);
  for (let i = partes.length - 1; i > 0; i--) {
    const mae = `/${partes.slice(0, i).join("/")}`;
    if (TUTORIAIS[mae]) return TUTORIAIS[mae];
  }

  return null;
}

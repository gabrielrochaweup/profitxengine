import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { carregarAlunos, resumoDeAlunos } from "@/lib/tracking/alunos";

/*
  O resumo do dia.

  A pergunta que esta tela responde é "o que eu preciso fazer agora?", e não
  "quais ferramentas existem?" — por isso ela junta número do dia, o que
  está pedindo atenção e o que acabou de acontecer, em vez de listar atalhos
  que a barra lateral já lista.

  Duas regras valem pra tudo aqui:

  1. NADA DE ALERTA INVENTADO. Cada aviso sai de uma tabela que alguém
     escreve de verdade: disparo que falhou, webhook recusado, aluno sem
     contrato. Onde não existe fonte, não existe cartão.

  2. ALERTA QUE SEMPRE APARECE VIRA PAISAGEM. Contador zerado não vira
     cartão — a lista só mostra o que está fora do lugar, e quando não há
     nada ela diz isso em uma linha.
*/

export type NivelDeAlerta = "critico" | "atencao" | "neutro";

export interface Alerta {
  chave: string;
  nivel: NivelDeAlerta;
  titulo: string;
  detalhe: string;
  href: string;
  acao: string;
}

export interface NumeroDoDia {
  chave: string;
  rotulo: string;
  valor: string;
  /** Comparação com ontem, já escrita. null quando não há o que comparar. */
  delta: { texto: string; positivo: boolean } | null;
  destaque?: boolean;
}

export interface Movimento {
  id: string;
  quando: string;
  tipo: string;
  quem: string;
  valor: string | null;
}

export interface ResumoDoDia {
  numeros: NumeroDoDia[];
  alertas: Alerta[];
  movimentos: Movimento[];
  /** Nenhum evento hoje ainda — muda o texto da seção, não esconde ela. */
  diaVazio: boolean;
  /**
   * O que não deu pra ler, com o motivo.
   *
   * Existe porque a primeira versão tinha um try/catch só em volta de tudo:
   * uma consulta falhando apagava o painel inteiro e deixava na tela
   * "não deu pra montar o resumo", sem dizer o que falhou nem onde olhar.
   * Foi exatamente o que aconteceu no servidor da VPS — e, de fora, era
   * indistinguível de "o dia não tem dados".
   *
   * Agora cada bloco falha sozinho: o resto do painel continua de pé e o
   * motivo aparece pra quem é admin.
   */
  problemas: string[];
}

/** Janela de um dia no fuso de Brasília (o app é só pra time no Brasil). */
function diaDeBrasilia(diasAtras = 0) {
  const base = new Date(Date.now() - diasAtras * 86_400_000);
  const dia = base.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const de = new Date(`${dia}T00:00:00-03:00`);
  const ate = new Date(de.getTime() + 86_400_000 - 1);
  return { de: de.toISOString(), ate: ate.toISOString() };
}

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 3_600_000).toISOString();
}

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function usd(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Os eventos que valem uma linha no "acontecendo".
 *
 * Fica de fora o members_access: são milhares por dia, e uma lista de
 * "fulano entrou na área de membros" enterraria a compra que aconteceu às
 * 14h. Ele conta no funil, não aqui.
 */
const TIPOS_QUE_IMPORTAM = [
  "purchase",
  "contract_signed",
  "tool_signup",
  "broker_signup",
  "broker_deposit",
] as const;

const ROTULO_DO_EVENTO: Record<(typeof TIPOS_QUE_IMPORTAM)[number], string> = {
  purchase: "Compra do curso",
  contract_signed: "Contrato assinado",
  tool_signup: "Cadastro no Pepe",
  broker_signup: "Cadastro na corretora",
  broker_deposit: "Depósito",
};

interface LinhaDoRelatorio {
  leads: number;
  initiate_checkouts: number;
  purchases: number;
  purchase_revenue_cents: number;
  broker_signups: number;
  deposits: number;
  deposits_total_cents: number;
}

function somar(linhas: LinhaDoRelatorio[] | null) {
  const zero = {
    leads: 0,
    checkouts: 0,
    compras: 0,
    receita: 0,
    corretora: 0,
    depositos: 0,
    depositado: 0,
  };
  for (const l of linhas ?? []) {
    zero.leads += Number(l.leads) || 0;
    zero.checkouts += Number(l.initiate_checkouts) || 0;
    zero.compras += Number(l.purchases) || 0;
    zero.receita += Number(l.purchase_revenue_cents) || 0;
    zero.corretora += Number(l.broker_signups) || 0;
    zero.depositos += Number(l.deposits) || 0;
    zero.depositado += Number(l.deposits_total_cents) || 0;
  }
  return zero;
}

export async function carregarResumoDoDia(productId: string): Promise<ResumoDoDia> {
  const supabase = createClient();
  const hoje = diaDeBrasilia(0);
  const ontem = diaDeBrasilia(1);

  /*
    Tudo com a sessão de quem está olhando, e não com a chave de serviço: o
    RLS é quem decide o que cada pessoa enxerga.

    Este painel é o resumo do dia pra QUEM TRABALHA no produto, então ele não
    filtra mais por papel: os cartões de alunos (sem contrato, sem Pepe, sem
    corretora, sem depósito) e o de disparos aparecem pra toda a equipe. O
    contrário deixava o editor olhando uma tela que dizia "está tudo certo"
    enquanto o alerta existia e estava escondido dele.
  */
  const [relatorioHoje, relatorioOntem, eventosDeHoje, semAtribuicao, disparos, webhooks] = await Promise.all([
    supabase.rpc("tracking_campaign_report", { p_product_id: productId, p_from: hoje.de, p_to: hoje.ate }),
    supabase.rpc("tracking_campaign_report", { p_product_id: productId, p_from: ontem.de, p_to: ontem.ate }),
    supabase
      .from("tracking_events")
      .select("id, event_type, email, amount_cents, currency, occurred_at")
      .eq("product_id", productId)
      .in("event_type", TIPOS_QUE_IMPORTAM)
      .gte("occurred_at", hoje.de)
      .order("occurred_at", { ascending: false })
      .limit(12),
    supabase
      .from("tracking_events")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)
      .is("lead_id", null)
      .gte("occurred_at", hoje.de),
    supabase
      .from("sendpulse_dispatch_log")
      .select("id, tipo, email, status, erro, created_at")
      .eq("product_id", productId)
      .eq("teste", false)
      .in("status", ["falhou", "enviando"])
      .gte("created_at", horasAtras(24 * 7))
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("tracking_webhook_log")
      .select("id, error, received_at, tracking_webhook_endpoints!inner(product_id, kind)")
      .eq("tracking_webhook_endpoints.product_id", productId)
      .eq("accepted", false)
      .gte("received_at", horasAtras(24))
      .order("received_at", { ascending: false })
      .limit(50),
  ]);

  /*
    Cada leitura responde por si.

    O supabase-js devolve { data, error } em vez de lançar, então sem
    recolher esses erros eles passavam em silêncio — e o painel só dizia
    "sem dados", que é a mesma cara de um dia parado.
  */
  const problemas: string[] = [];
  const anotar = (rotulo: string, erro: { message: string } | null) => {
    if (erro) problemas.push(`${rotulo}: ${erro.message}`);
  };
  anotar("números de hoje", relatorioHoje.error);
  anotar("números de ontem", relatorioOntem.error);
  anotar("eventos de hoje", eventosDeHoje.error);
  anotar("eventos sem atribuição", semAtribuicao.error);
  anotar("disparos", disparos.error);
  anotar("chamadas de webhook", webhooks.error);

  const numerosHoje = somar(relatorioHoje.data as LinhaDoRelatorio[] | null);
  const numerosOntem = somar(relatorioOntem.data as LinhaDoRelatorio[] | null);

  /**
   * "vs ontem" em número absoluto, não em porcentagem.
   *
   * Com os volumes daqui, porcentagem mente: sair de 1 compra pra 3 vira
   * "+200%", que soa como tendência quando são duas compras de diferença.
   */
  const compara = (hoje: number, ontem: number, formatar: (n: number) => string) => {
    const delta = hoje - ontem;
    if (delta === 0) return { texto: "igual a ontem", positivo: true };
    return { texto: `${delta > 0 ? "+" : "−"}${formatar(Math.abs(delta))} vs ontem`, positivo: delta > 0 };
  };
  const inteiro = (n: number) => String(n);

  const numeros: NumeroDoDia[] = [
    {
      chave: "leads",
      rotulo: "Leads",
      valor: String(numerosHoje.leads),
      delta: compara(numerosHoje.leads, numerosOntem.leads, inteiro),
    },
    {
      chave: "checkouts",
      rotulo: "Checkout",
      valor: String(numerosHoje.checkouts),
      delta: compara(numerosHoje.checkouts, numerosOntem.checkouts, inteiro),
    },
    {
      chave: "compras",
      rotulo: "Compras",
      valor: String(numerosHoje.compras),
      delta: compara(numerosHoje.compras, numerosOntem.compras, inteiro),
    },
    {
      chave: "receita",
      rotulo: "Receita do curso",
      valor: brl(numerosHoje.receita),
      delta: compara(numerosHoje.receita, numerosOntem.receita, brl),
      destaque: true,
    },
    {
      chave: "corretora",
      rotulo: "Cadastros corretora",
      valor: String(numerosHoje.corretora),
      delta: compara(numerosHoje.corretora, numerosOntem.corretora, inteiro),
    },
    {
      chave: "depositado",
      rotulo: "Depositado",
      valor: usd(numerosHoje.depositado),
      delta: compara(numerosHoje.depositado, numerosOntem.depositado, usd),
      destaque: true,
    },
  ];

  /* ─────────────────────────── o que pede atenção ─────────────────────────── */

  const alertas: Alerta[] = [];

  /*
    "falhou" no log também guarda duas coisas:

    - ENTREGA que quebrou: o SendPulse respondeu erro, não respondeu, ou a
      chamada estourou. Ninguém foi avisado e o motivo é técnico.
    - REGRA que barrou: funil desligado, sem telefone, e-mail sem compra
      casada. O disparo não saiu porque não era pra sair.

    Jogar os dois no mesmo cartão vermelho faria o painel apitar todo dia
    por causa do segundo, que é o comportamento correto do sistema. Então
    são dois avisos, com pesos diferentes — e o segundo continua valendo,
    porque "17 contratos assinados que não casaram com compra nenhuma" é
    justamente o tipo de coisa que se quer descobrir.
  */
  const falhaDeEntrega = (erro: string) =>
    erro.startsWith("HTTP ") || erro.includes("Sem resposta em") || erro.includes("Falha ao chamar o SendPulse");

  const falhas = (disparos.data ?? []).filter((d) => d.status === "falhou");
  const naoEntregues = falhas.filter((d) => falhaDeEntrega(d.erro ?? ""));
  const barrados = falhas.filter((d) => !falhaDeEntrega(d.erro ?? ""));

  const descreve = (d: { tipo: string; email: string; erro: string | null }) =>
    `${d.tipo === "contrato" ? "Pós-contrato" : "Boas-vindas"} pra ${d.email}${d.erro ? ` — ${d.erro.slice(0, 120)}` : ""}`;

  if (naoEntregues.length > 0) {
    alertas.push({
      chave: "disparos-nao-entregues",
      nivel: "critico",
      titulo: `${naoEntregues.length} ${naoEntregues.length === 1 ? "disparo não chegou" : "disparos não chegaram"} no SendPulse (7 dias)`,
      // O erro do último é mais útil que a contagem: quase sempre os outros
      // falharam pelo mesmo motivo.
      detalhe: descreve(naoEntregues[0]),
      href: "/tracking?aba=configuracoes&sub=automacoes",
      acao: "Ver automações",
    });
  }

  if (barrados.length > 0) {
    alertas.push({
      chave: "disparos-barrados",
      nivel: "atencao",
      titulo: `${barrados.length} ${barrados.length === 1 ? "disparo não saiu" : "disparos não saíram"} por regra (7 dias)`,
      detalhe: descreve(barrados[0]),
      href: "/tracking?aba=configuracoes&sub=automacoes",
      acao: "Ver automações",
    });
  }

  // "Enviando" é estado de passagem: o disparo grava assim e atualiza logo
  // em seguida. Parado há mais de meia hora, ninguém foi avisado e ninguém
  // sabe disso.
  const travados = (disparos.data ?? []).filter(
    (d) => d.status === "enviando" && d.created_at < horasAtras(0.5)
  );
  if (travados.length > 0) {
    alertas.push({
      chave: "disparos-travados",
      nivel: "critico",
      titulo: `${travados.length} ${travados.length === 1 ? "disparo travado" : "disparos travados"} em "enviando"`,
      detalhe: "Começaram e não terminaram — quem comprou não recebeu a mensagem.",
      href: "/tracking?aba=configuracoes&sub=automacoes",
      acao: "Ver automações",
    });
  }

  /*
    `accepted = false` no log guarda duas coisas muito diferentes, e tratar
    as duas como falha faria o painel gritar todo dia:

    - "…— ignorado.": a plataforma mandou um payload que nenhum adapter
      reconhece. Não quebrou nada (é o caminho normal pra evento que a gente
      não escuta), mas vale saber — é assim que se percebe que a plataforma
      mudou o formato e parou de virar evento.
    - qualquer outro texto: recusa de verdade.

    Token errado e JSON inválido nem chegam aqui: a rota devolve erro antes
    de gravar linha nenhuma.
  */
  const recusadas = (webhooks.data ?? []).filter((w) => !(w.error ?? "").includes("ignorado"));
  const naoReconhecidas = (webhooks.data ?? []).filter((w) => (w.error ?? "").includes("ignorado"));

  if (recusadas.length > 0) {
    const ultima = recusadas[0];
    alertas.push({
      chave: "webhooks-recusados",
      nivel: "critico",
      titulo: `${recusadas.length} ${recusadas.length === 1 ? "chamada recusada" : "chamadas recusadas"} nas últimas 24h`,
      detalhe: ultima.error ? ultima.error.slice(0, 140) : "Webhook chegou e não virou evento.",
      href: "/tracking?aba=configuracoes&sub=fontes",
      acao: "Ver fontes de dados",
    });
  }

  if (naoReconhecidas.length > 0) {
    alertas.push({
      chave: "webhooks-nao-reconhecidos",
      nivel: "neutro",
      titulo: `${naoReconhecidas.length} ${naoReconhecidas.length === 1 ? "chamada não reconhecida" : "chamadas não reconhecidas"} nas últimas 24h`,
      detalhe: "A plataforma mandou um payload que nenhum adapter entende — não virou evento.",
      href: "/tracking?aba=configuracoes&sub=fontes",
      acao: "Ver fontes de dados",
    });
  }

  /*
    A lista de alunos é a parte mais frágil: precisa da chave de serviço
    (que pode não existir num servidor novo) e varre várias páginas de
    eventos. Isolada, o painel sobrevive à queda dela.
  */
  const alunos = await lerAlunos(productId, problemas);

  if (alunos) {
    if (alunos.semContrato > 0) {
      alertas.push({
        chave: "sem-contrato",
        nivel: "critico",
        titulo: `${alunos.semContrato} de ${alunos.total} alunos sem contrato assinado`,
        // Este é o único da lista que trava o produto: sem assinatura o
        // acesso nem abre.
        detalhe: "Sem assinatura o acesso à área de membros não abre.",
        href: "/tracking?aba=pessoas&filtro=sem-contrato",
        acao: "Ver quem falta",
      });
    }
    if (alunos.semPepe > 0) {
      alertas.push({
        chave: "sem-pepe",
        nivel: "atencao",
        titulo: `${alunos.semPepe} alunos sem cadastro no Pepe`,
        detalhe: "Compraram e ainda não criaram conta na ferramenta.",
        href: "/tracking?aba=pessoas&filtro=sem-pepe",
        acao: "Ver quem falta",
      });
    }
    if (alunos.semCorretora > 0) {
      alertas.push({
        chave: "sem-corretora",
        nivel: "atencao",
        titulo: `${alunos.semCorretora} alunos sem cadastro na corretora`,
        detalhe: "Nem abriram conta — é o degrau antes do depósito.",
        href: "/tracking?aba=pessoas&filtro=sem-corretora",
        acao: "Ver quem falta",
      });
    }
    const soFaltaDepositar = alunos.semDeposito - alunos.semCorretora;
    if (soFaltaDepositar > 0) {
      alertas.push({
        chave: "sem-deposito",
        nivel: "atencao",
        titulo: `${soFaltaDepositar} ${soFaltaDepositar === 1 ? "aluno abriu conta" : "alunos abriram conta"} na corretora e não depositaram`,
        detalhe: "Conta aberta, sem dinheiro dentro. É a lista mais quente pra chamar.",
        href: "/tracking?aba=pessoas&filtro=sem-deposito",
        acao: "Chamar pra depositar",
      });
    }
  }

  const naoAtribuidos = semAtribuicao.count ?? 0;
  if (naoAtribuidos > 0) {
    alertas.push({
      chave: "sem-atribuicao",
      nivel: "neutro",
      titulo: `${naoAtribuidos} ${naoAtribuidos === 1 ? "evento de hoje" : "eventos de hoje"} sem atribuição`,
      detalhe: "Chegaram sem bater com nenhum lead — ficam de fora do resultado por campanha.",
      href: "/tracking?aba=eventos",
      acao: "Ver eventos",
    });
  }

  /* ─────────────────────────── o que já aconteceu ─────────────────────────── */

  const movimentos: Movimento[] = (eventosDeHoje.data ?? []).map((e) => ({
    id: e.id,
    quando: hora(e.occurred_at),
    tipo: ROTULO_DO_EVENTO[e.event_type as (typeof TIPOS_QUE_IMPORTAM)[number]] ?? e.event_type,
    quem: e.email ?? "sem e-mail",
    valor:
      e.amount_cents == null
        ? null
        : e.event_type === "broker_deposit" || e.currency === "USD"
          ? usd(e.amount_cents)
          : brl(e.amount_cents),
  }));

  return {
    numeros,
    alertas,
    movimentos,
    diaVazio: movimentos.length === 0 && numerosHoje.leads === 0,
    problemas,
  };
}

async function lerAlunos(productId: string, problemas: string[]) {
  try {
    return resumoDeAlunos(await carregarAlunos(createAdminClient(), productId));
  } catch (erro) {
    // createAdminClient() joga quando SUPABASE_SERVICE_ROLE_KEY não está no
    // ambiente — o caso mais provável num servidor recém-configurado.
    problemas.push(`lista de alunos: ${erro instanceof Error ? erro.message : String(erro)}`);
    return null;
  }
}

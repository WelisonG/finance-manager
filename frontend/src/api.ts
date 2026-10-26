export type TipoMovimentacao = 'receita' | 'despesa'

export type ResumoFinanceiro = {
  total_receitas: number
  total_despesas: number
  saldo: number
}

export type NovaMovimentacao = {
  descricao: string
  valor: number
  categoria: string
  data: string
}

// A API não expõe as categorias de receita; esta lista espelha CATEGORIAS_RECEITAS em schemas/categorias.py.
export const CATEGORIAS_RECEITAS = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Reembolsos',
  'Outros',
]

export class ErroApi extends Error {}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof TypeError) {
    return 'Não foi possível conectar à API. Verifique se o backend está rodando na porta 8000.'
  }
  if (erro instanceof Error) {
    return erro.message
  }
  return 'Erro inesperado. Tente novamente.'
}

async function extrairMensagem(resposta: Response): Promise<string> {
  try {
    const corpo: { detail?: unknown } = await resposta.json()

    if (typeof corpo.detail === 'string') {
      return corpo.detail
    }

    // Erros de validação do FastAPI chegam como lista de { msg, loc }.
    if (Array.isArray(corpo.detail)) {
      return corpo.detail
        .map((item: { msg?: unknown }) => String(item.msg).replace(/^Value error, /, ''))
        .join(' ')
    }
  } catch {
    // Corpo sem JSON: usa a mensagem padrão abaixo.
  }

  return `A API respondeu com status ${resposta.status}.`
}

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, init)

  if (!resposta.ok) {
    throw new ErroApi(await extrairMensagem(resposta))
  }

  return (await resposta.json()) as T
}

export function buscarResumo(signal: AbortSignal) {
  return requisitar<ResumoFinanceiro>('/financeiro/resumo', { signal })
}

export function buscarCategoriasDespesa(signal: AbortSignal) {
  return requisitar<string[]>('/categorias', { signal })
}

export function cadastrarMovimentacao(tipo: TipoMovimentacao, dados: NovaMovimentacao) {
  const url = tipo === 'receita' ? '/receitas' : '/gastos'

  return requisitar<{ mensagem: string }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
}

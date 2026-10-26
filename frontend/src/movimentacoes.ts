import { CATEGORIAS_RECEITAS, type TipoMovimentacao } from './api'

export type CampoErro = 'descricao' | 'valor' | 'categoria' | 'data'
export type Erros = Partial<Record<CampoErro, string>>
export type CamposFormulario = {
  descricao: string
  valor: string
  categoria: string
  data: string
}

export const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatadorMoedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

// Recebe a fração (0.125 vira 12,5%); a API devolve o percentual já multiplicado por 100.
export const formatadorPercentual = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

export const ANO_ATUAL = new Date().getFullYear()
export const ANOS = Array.from({ length: 12 }, (_, indice) => ANO_ATUAL - 10 + indice)

export function hojeEmIso(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

export function categoriasDoTipo(tipo: TipoMovimentacao, categoriasDespesa: string[] | null): string[] {
  return tipo === 'receita' ? CATEGORIAS_RECEITAS : (categoriasDespesa ?? [])
}

export function validar(campos: CamposFormulario, categorias: string[]): Erros {
  const erros: Erros = {}

  if (!campos.descricao.trim()) {
    erros.descricao = 'Informe a descrição.'
  }

  const valor = Number(campos.valor)
  if (!campos.valor.trim()) {
    erros.valor = 'Informe o valor.'
  } else if (!Number.isFinite(valor) || valor <= 0) {
    erros.valor = 'O valor deve ser maior que zero.'
  }

  if (!categorias.includes(campos.categoria)) {
    erros.categoria = 'Selecione uma categoria.'
  }

  if (!campos.data) {
    erros.data = 'Informe a data.'
  }

  return erros
}

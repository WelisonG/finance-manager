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

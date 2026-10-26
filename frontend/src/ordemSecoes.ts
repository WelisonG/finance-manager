export type SecaoId = 'visao-geral' | 'evolucao' | 'comparativo' | 'formulario' | 'movimentacoes'

export const ORDEM_PADRAO: SecaoId[] = [
  'visao-geral',
  'evolucao',
  'comparativo',
  'formulario',
  'movimentacoes',
]

const CHAVE_ARMAZENAMENTO = 'finance-manager.ordemSecoes'

// Descarta ids desconhecidos e duplicados e acrescenta seções novas no fim, na ordem padrão.
function normalizar(valores: unknown[]): SecaoId[] {
  const reconhecidos = valores.filter(
    (valor): valor is SecaoId => typeof valor === 'string' && (ORDEM_PADRAO as string[]).includes(valor),
  )
  const unicos = reconhecidos.filter((id, indice) => reconhecidos.indexOf(id) === indice)
  return [...unicos, ...ORDEM_PADRAO.filter((id) => !unicos.includes(id))]
}

export function carregarOrdem(): SecaoId[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (!bruto) return [...ORDEM_PADRAO]

    const salva: unknown = JSON.parse(bruto)
    return Array.isArray(salva) ? normalizar(salva) : [...ORDEM_PADRAO]
  } catch {
    // localStorage indisponível ou JSON inválido: usa a ordem padrão.
    return [...ORDEM_PADRAO]
  }
}

export function salvarOrdem(ordem: SecaoId[]) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(ordem))
  } catch {
    // Sem persistência disponível: a ordem continua válida só nesta sessão.
  }
}

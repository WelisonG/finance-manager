import type { TipoMovimentacao } from '../api'
import type { CamposFormulario, Erros } from '../movimentacoes'
import './FormularioMovimentacao.css'

type CamposMovimentacaoProps = {
  // Prefixo dos ids, para não colidir quando o formulário e a edição estiverem na tela juntos.
  idPrefixo: string
  tipo: TipoMovimentacao
  campos: CamposFormulario
  erros: Erros
  categorias: string[]
  carregandoCategorias: boolean
  erroCategorias: string | null
  aoAlterar: (campo: keyof CamposFormulario, valor: string) => void
}

export function CamposMovimentacao({
  idPrefixo,
  tipo,
  campos,
  erros,
  categorias,
  carregandoCategorias,
  erroCategorias,
  aoAlterar,
}: CamposMovimentacaoProps) {
  return (
    <>
      <div className="campo campo-largo">
        <label htmlFor={`${idPrefixo}-descricao`}>Descrição</label>
        <input
          id={`${idPrefixo}-descricao`}
          type="text"
          placeholder={tipo === 'receita' ? 'Ex.: Salário de outubro' : 'Ex.: Conta de luz'}
          value={campos.descricao}
          onChange={(evento) => aoAlterar('descricao', evento.target.value)}
          aria-invalid={Boolean(erros.descricao)}
          aria-describedby={erros.descricao ? `${idPrefixo}-erro-descricao` : undefined}
        />
        {erros.descricao && (
          <span id={`${idPrefixo}-erro-descricao`} className="erro-campo">{erros.descricao}</span>
        )}
      </div>

      <div className="campo">
        <label htmlFor={`${idPrefixo}-valor`}>Valor (R$)</label>
        <input
          id={`${idPrefixo}-valor`}
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          value={campos.valor}
          onChange={(evento) => aoAlterar('valor', evento.target.value)}
          aria-invalid={Boolean(erros.valor)}
          aria-describedby={erros.valor ? `${idPrefixo}-erro-valor` : undefined}
        />
        {erros.valor && (
          <span id={`${idPrefixo}-erro-valor`} className="erro-campo">{erros.valor}</span>
        )}
      </div>

      <div className="campo">
        <label htmlFor={`${idPrefixo}-categoria`}>Categoria</label>
        <select
          id={`${idPrefixo}-categoria`}
          value={campos.categoria}
          disabled={carregandoCategorias || Boolean(erroCategorias)}
          onChange={(evento) => aoAlterar('categoria', evento.target.value)}
          aria-invalid={Boolean(erros.categoria)}
          aria-describedby={erros.categoria ? `${idPrefixo}-erro-categoria` : undefined}
        >
          <option value="">
            {carregandoCategorias ? 'Carregando categorias…' : 'Selecione'}
          </option>
          {categorias.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {erroCategorias && <span className="erro-campo">{erroCategorias}</span>}
        {erros.categoria && (
          <span id={`${idPrefixo}-erro-categoria`} className="erro-campo">{erros.categoria}</span>
        )}
      </div>

      <div className="campo">
        <label htmlFor={`${idPrefixo}-data`}>Data</label>
        <input
          id={`${idPrefixo}-data`}
          type="date"
          value={campos.data}
          onChange={(evento) => aoAlterar('data', evento.target.value)}
          aria-invalid={Boolean(erros.data)}
          aria-describedby={erros.data ? `${idPrefixo}-erro-data` : undefined}
        />
        {erros.data && (
          <span id={`${idPrefixo}-erro-data`} className="erro-campo">{erros.data}</span>
        )}
      </div>
    </>
  )
}

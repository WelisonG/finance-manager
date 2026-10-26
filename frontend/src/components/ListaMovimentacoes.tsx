import { useEffect, useState } from 'react'
import {
  excluirMovimentacao,
  listarMovimentacoes,
  mensagemDeErro,
  type Movimentacao,
  type TipoMovimentacao,
} from '../api'
import { formatadorMoeda } from '../movimentacoes'
import { EditarMovimentacao } from './EditarMovimentacao'
import './FormularioMovimentacao.css'
import './ListaMovimentacoes.css'

type Estado =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'sucesso'; itens: Movimentacao[] }

type Filtro = 'todas' | TipoMovimentacao

const opcoesFiltro: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'receita', rotulo: 'Receitas' },
  { valor: 'despesa', rotulo: 'Despesas' },
]

function chaveDe(item: Movimentacao): string {
  return `${item.tipo}-${item.id}`
}

// Data mais recente primeiro; empates pelo id mais novo.
function compararPorDataDesc(a: Movimentacao, b: Movimentacao): number {
  if (a.dataIso !== b.dataIso) {
    return a.dataIso < b.dataIso ? 1 : -1
  }
  return b.id - a.id
}

function textoListaVazia(filtro: Filtro, total: number): string {
  if (total === 0) return 'Nenhuma movimentação cadastrada ainda.'
  if (filtro === 'receita') return 'Nenhuma receita cadastrada.'
  if (filtro === 'despesa') return 'Nenhuma despesa cadastrada.'
  return 'Nenhuma movimentação encontrada.'
}

type ListaMovimentacoesProps = {
  // Muda quando o dashboard precisa ser atualizado (cadastro, edição ou exclusão).
  versao: number
  aoAlterar: () => void
}

export function ListaMovimentacoes({ versao, aoAlterar }: ListaMovimentacoesProps) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [editando, setEditando] = useState<Movimentacao | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  useEffect(() => {
    const controlador = new AbortController()

    Promise.all([
      listarMovimentacoes('receita', controlador.signal),
      listarMovimentacoes('despesa', controlador.signal),
    ])
      .then(([receitas, despesas]) => {
        setEstado({
          status: 'sucesso',
          itens: [...receitas, ...despesas].sort(compararPorDataDesc),
        })
      })
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return
        setEstado({ status: 'erro', mensagem: mensagemDeErro(erro) })
      })

    return () => controlador.abort()
  }, [versao])

  const itens = estado.status === 'sucesso' ? estado.itens : []
  const visiveis = filtro === 'todas' ? itens : itens.filter((item) => item.tipo === filtro)

  function tentarNovamente() {
    setEstado({ status: 'carregando' })
    aoAlterar()
  }

  function salvouEdicao() {
    setEditando(null)
    setErroAcao(null)
    setMensagem('Movimentação atualizada com sucesso.')
    aoAlterar()
  }

  async function excluir(item: Movimentacao) {
    const chave = chaveDe(item)
    setExcluindo(chave)
    setErroAcao(null)
    setMensagem(null)

    try {
      await excluirMovimentacao(item.tipo, item.id)
      setConfirmandoExclusao(null)
      setMensagem('Movimentação excluída com sucesso.')
      aoAlterar()
    } catch (erro) {
      setErroAcao(mensagemDeErro(erro))
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <>
      <div className="lista-cabecalho">
        <div className="alternador" role="group" aria-label="Filtrar movimentações">
          {opcoesFiltro.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={filtro === opcao.valor ? 'ativa' : ''}
              aria-pressed={filtro === opcao.valor}
              onClick={() => setFiltro(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {mensagem && <p className="feedback sucesso" role="status">{mensagem}</p>}
      {erroAcao && <p className="feedback erro" role="alert">{erroAcao}</p>}

      {estado.status === 'carregando' && (
        <p className="lista-estado" role="status">Carregando movimentações…</p>
      )}

      {estado.status === 'erro' && (
        <div className="alerta" role="alert">
          <p>{estado.mensagem}</p>
          <button type="button" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado.status === 'sucesso' && visiveis.length === 0 && (
        <p className="lista-estado">{textoListaVazia(filtro, itens.length)}</p>
      )}

      {estado.status === 'sucesso' && visiveis.length > 0 && (
        <ul className="lista">
          {visiveis.map((item) => {
            const chave = chaveDe(item)
            const confirmando = confirmandoExclusao === chave
            const excluindoEste = excluindo === chave

            return (
              <li key={chave} className={`item item-${item.tipo}`}>
                <div className="item-info">
                  <span className={`etiqueta ${item.tipo}`}>
                    {item.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </span>
                  <strong className="item-descricao">{item.descricao}</strong>
                  <span className="item-meta">
                    {item.categoria} · {item.data}
                  </span>
                </div>

                <div className="item-valor">{formatadorMoeda.format(item.valor)}</div>

                <div className="item-acoes">
                  {confirmando ? (
                    <>
                      <span className="confirmar-texto">Excluir esta movimentação?</span>
                      <button
                        type="button"
                        className="botao-perigo"
                        disabled={excluindoEste}
                        onClick={() => excluir(item)}
                      >
                        {excluindoEste ? 'Excluindo…' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        className="botao-secundario"
                        disabled={excluindoEste}
                        onClick={() => setConfirmandoExclusao(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="botao-secundario"
                        onClick={() => setEditando(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="botao-secundario botao-perigo-texto"
                        onClick={() => setConfirmandoExclusao(chave)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editando && (
        <EditarMovimentacao
          key={chaveDe(editando)}
          movimentacao={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={salvouEdicao}
        />
      )}
    </>
  )
}

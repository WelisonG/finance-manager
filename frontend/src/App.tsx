import { useEffect, useState, type ChangeEvent } from 'react'
import './App.css'
import { buscarResumo, mensagemDeErro, type ResumoFinanceiro } from './api'
import { FormularioMovimentacao } from './components/FormularioMovimentacao'
import { GraficoEvolucao, TabelaComparativo } from './components/GraficosFinanceiros'
import { ListaMovimentacoes } from './components/ListaMovimentacoes'
import { SecoesOrdenaveis, type SecaoItem } from './components/SecoesOrdenaveis'
import { ORDEM_PADRAO, carregarOrdem, salvarOrdem, type SecaoId } from './ordemSecoes'
import { ANOS, ANO_ATUAL, formatadorMoeda } from './movimentacoes'

type Estado =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'sucesso'; resumo: ResumoFinanceiro }

function App() {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  // Incrementado para refazer a busca do resumo e das listas (retry, cadastro, edição e exclusão).
  const [versao, setVersao] = useState(0)
  const [ano, setAno] = useState(ANO_ATUAL)
  const [ordem, setOrdem] = useState<SecaoId[]>(carregarOrdem)

  useEffect(() => {
    salvarOrdem(ordem)
  }, [ordem])

  useEffect(() => {
    const controlador = new AbortController()

    buscarResumo(controlador.signal)
      .then((resumo) => setEstado({ status: 'sucesso', resumo }))
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return
        setEstado({ status: 'erro', mensagem: mensagemDeErro(erro) })
      })

    return () => controlador.abort()
  }, [versao])

  function tentarNovamente() {
    setEstado({ status: 'carregando' })
    atualizarDados()
  }

  function atualizarDados() {
    setVersao((valor) => valor + 1)
  }

  function trocarAno(evento: ChangeEvent<HTMLSelectElement>) {
    setAno(Number(evento.target.value))
  }

  const resumo = estado.status === 'sucesso' ? estado.resumo : null
  const saldoNegativo = resumo !== null && resumo.saldo < 0

  const secoes: SecaoItem[] = [
    {
      id: 'visao-geral',
      titulo: 'Visão geral',
      inicialmenteAberto: true,
      conteudo: (
        <>
          {estado.status === 'erro' && (
            <div className="alerta" role="alert">
              <p>{estado.mensagem}</p>
              <button type="button" onClick={tentarNovamente}>
                Tentar novamente
              </button>
            </div>
          )}

          <section
            className="cards"
            aria-label="Resumo financeiro"
            aria-busy={estado.status === 'carregando'}
          >
            <article className="card card-receitas">
              <h2>Receitas</h2>
              {resumo ? (
                <p className="valor">{formatadorMoeda.format(resumo.total_receitas)}</p>
              ) : (
                <div className="esqueleto" aria-label="Carregando receitas" />
              )}
            </article>

            <article className="card card-despesas">
              <h2>Despesas</h2>
              {resumo ? (
                <p className="valor">{formatadorMoeda.format(resumo.total_despesas)}</p>
              ) : (
                <div className="esqueleto" aria-label="Carregando despesas" />
              )}
            </article>

            <article className={`card card-saldo ${saldoNegativo ? 'negativo' : ''}`}>
              <h2>Saldo</h2>
              {resumo ? (
                <p className="valor">{formatadorMoeda.format(resumo.saldo)}</p>
              ) : (
                <div className="esqueleto" aria-label="Carregando saldo" />
              )}
            </article>
          </section>
        </>
      ),
    },
    {
      id: 'evolucao',
      titulo: 'Evolução mensal',
      inicialmenteAberto: true,
      className: 'graficos-card',
      // key por ano: trocar o ano remonta o gráfico e volta ao carregamento.
      conteudo: <GraficoEvolucao key={ano} ano={ano} versao={versao} />,
    },
    {
      id: 'comparativo',
      titulo: 'Comparativo mensal',
      className: 'graficos-card',
      conteudo: <TabelaComparativo key={ano} ano={ano} versao={versao} />,
    },
    {
      id: 'formulario',
      titulo: 'Nova movimentação',
      className: 'formulario-card',
      conteudo: <FormularioMovimentacao aoCadastrar={atualizarDados} />,
    },
    {
      id: 'movimentacoes',
      titulo: 'Movimentações',
      className: 'lista-card',
      conteudo: <ListaMovimentacoes versao={versao} aoAlterar={atualizarDados} />,
    },
  ]

  return (
    <div className="app">
      <header className="cabecalho">
        <div>
          <p className="rotulo">Finance Manager</p>
          <h1>Visão geral</h1>
        </div>
      </header>

      <div className="barra-dashboard">
        <label className="seletor-ano">
          <span>Ano</span>
          <select value={ano} onChange={trocarAno}>
            {ANOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="restaurar-ordem" onClick={() => setOrdem([...ORDEM_PADRAO])}>
          Restaurar ordem padrão
        </button>
      </div>

      <SecoesOrdenaveis itens={secoes} ordem={ordem} aoReordenar={setOrdem} />
    </div>
  )
}

export default App

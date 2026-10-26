import { useEffect, useState } from 'react'
import './App.css'
import { buscarResumo, mensagemDeErro, type ResumoFinanceiro } from './api'
import { FormularioMovimentacao } from './components/FormularioMovimentacao'

type Estado =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'sucesso'; resumo: ResumoFinanceiro }

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function App() {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  // Incrementado para refazer a busca do resumo (retry e após cadastro).
  const [versao, setVersao] = useState(0)

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
    setVersao((valor) => valor + 1)
  }

  function atualizarResumo() {
    setVersao((valor) => valor + 1)
  }

  const resumo = estado.status === 'sucesso' ? estado.resumo : null
  const saldoNegativo = resumo !== null && resumo.saldo < 0

  return (
    <div className="app">
      <header className="cabecalho">
        <div>
          <p className="rotulo">Finance Manager</p>
          <h1>Visão geral</h1>
        </div>
      </header>

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

      <FormularioMovimentacao aoCadastrar={atualizarResumo} />
    </div>
  )
}

export default App

import { useEffect, useState } from 'react'
import './App.css'

type ResumoFinanceiro = {
  total_receitas: number
  total_despesas: number
  saldo: number
}

type Estado =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'sucesso'; resumo: ResumoFinanceiro }

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

async function buscarResumo(signal: AbortSignal): Promise<ResumoFinanceiro> {
  const resposta = await fetch('/financeiro/resumo', { signal })

  if (!resposta.ok) {
    throw new Error(`A API respondeu com status ${resposta.status}.`)
  }

  return (await resposta.json()) as ResumoFinanceiro
}

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof TypeError) {
    return 'Não foi possível conectar à API. Verifique se o backend está rodando na porta 8000.'
  }
  if (erro instanceof Error) {
    return erro.message
  }
  return 'Erro inesperado ao carregar o resumo financeiro.'
}

function App() {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()

    buscarResumo(controlador.signal)
      .then((resumo) => setEstado({ status: 'sucesso', resumo }))
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return
        setEstado({ status: 'erro', mensagem: mensagemDeErro(erro) })
      })

    return () => controlador.abort()
  }, [tentativa])

  function tentarNovamente() {
    setEstado({ status: 'carregando' })
    setTentativa((valor) => valor + 1)
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
    </div>
  )
}

export default App

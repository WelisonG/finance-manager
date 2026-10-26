import { useEffect, useState, type FormEvent } from 'react'
import {
  CATEGORIAS_RECEITAS,
  buscarCategoriasDespesa,
  cadastrarMovimentacao,
  mensagemDeErro,
  type TipoMovimentacao,
} from '../api'
import './FormularioMovimentacao.css'

type CampoErro = 'descricao' | 'valor' | 'categoria' | 'data'
type Erros = Partial<Record<CampoErro, string>>
type Feedback = { tipo: 'sucesso' | 'erro'; mensagem: string }

type FormularioMovimentacaoProps = {
  aoCadastrar: () => void
}

function hojeEmIso(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

function validar(
  campos: { descricao: string; valor: string; categoria: string; data: string },
  categorias: string[],
): Erros {
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

export function FormularioMovimentacao({ aoCadastrar }: FormularioMovimentacaoProps) {
  const [tipo, setTipo] = useState<TipoMovimentacao>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [data, setData] = useState(hojeEmIso)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [categoriasDespesa, setCategoriasDespesa] = useState<string[] | null>(null)
  const [erroCategorias, setErroCategorias] = useState<string | null>(null)

  useEffect(() => {
    const controlador = new AbortController()

    buscarCategoriasDespesa(controlador.signal)
      .then(setCategoriasDespesa)
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return
        setErroCategorias(mensagemDeErro(erro))
      })

    return () => controlador.abort()
  }, [])

  const categorias = tipo === 'receita' ? CATEGORIAS_RECEITAS : (categoriasDespesa ?? [])
  const carregandoCategorias = tipo === 'despesa' && categoriasDespesa === null && !erroCategorias

  function trocarTipo(novoTipo: TipoMovimentacao) {
    setTipo(novoTipo)
    setCategoria('')
    setErros((atuais) => ({ ...atuais, categoria: undefined }))
    setFeedback(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setFeedback(null)

    const novosErros = validar({ descricao, valor, categoria, data }, categorias)
    setErros(novosErros)

    if (Object.keys(novosErros).length > 0) return

    setEnviando(true)
    try {
      const resposta = await cadastrarMovimentacao(tipo, {
        descricao: descricao.trim(),
        valor: Number(valor),
        categoria,
        data,
      })
      setFeedback({ tipo: 'sucesso', mensagem: resposta.mensagem })
      setDescricao('')
      setValor('')
      aoCadastrar()
    } catch (erro) {
      setFeedback({ tipo: 'erro', mensagem: mensagemDeErro(erro) })
    } finally {
      setEnviando(false)
    }
  }

  const rotuloTipo = tipo === 'receita' ? 'receita' : 'despesa'

  return (
    <section className="formulario-card" aria-labelledby="titulo-formulario">
      <div className="formulario-cabecalho">
        <h2 id="titulo-formulario">Nova movimentação</h2>
        <div className="alternador" role="group" aria-label="Tipo de movimentação">
          <button
            type="button"
            className={`opcao-receita ${tipo === 'receita' ? 'ativa' : ''}`}
            aria-pressed={tipo === 'receita'}
            onClick={() => trocarTipo('receita')}
          >
            Receita
          </button>
          <button
            type="button"
            className={`opcao-despesa ${tipo === 'despesa' ? 'ativa' : ''}`}
            aria-pressed={tipo === 'despesa'}
            onClick={() => trocarTipo('despesa')}
          >
            Despesa
          </button>
        </div>
      </div>

      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="campo campo-largo">
          <label htmlFor="mov-descricao">Descrição</label>
          <input
            id="mov-descricao"
            type="text"
            placeholder={tipo === 'receita' ? 'Ex.: Salário de outubro' : 'Ex.: Conta de luz'}
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            aria-invalid={Boolean(erros.descricao)}
            aria-describedby={erros.descricao ? 'erro-descricao' : undefined}
          />
          {erros.descricao && (
            <span id="erro-descricao" className="erro-campo">{erros.descricao}</span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="mov-valor">Valor (R$)</label>
          <input
            id="mov-valor"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0,00"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            aria-invalid={Boolean(erros.valor)}
            aria-describedby={erros.valor ? 'erro-valor' : undefined}
          />
          {erros.valor && <span id="erro-valor" className="erro-campo">{erros.valor}</span>}
        </div>

        <div className="campo">
          <label htmlFor="mov-categoria">Categoria</label>
          <select
            id="mov-categoria"
            value={categoria}
            disabled={carregandoCategorias || Boolean(erroCategorias)}
            onChange={(evento) => setCategoria(evento.target.value)}
            aria-invalid={Boolean(erros.categoria)}
            aria-describedby={erros.categoria ? 'erro-categoria' : undefined}
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
            <span id="erro-categoria" className="erro-campo">{erros.categoria}</span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="mov-data">Data</label>
          <input
            id="mov-data"
            type="date"
            value={data}
            onChange={(evento) => setData(evento.target.value)}
            aria-invalid={Boolean(erros.data)}
            aria-describedby={erros.data ? 'erro-data' : undefined}
          />
          {erros.data && <span id="erro-data" className="erro-campo">{erros.data}</span>}
        </div>

        <div className="acoes campo-largo">
          <button type="submit" className={`botao-principal ${tipo}`} disabled={enviando}>
            {enviando ? 'Salvando…' : `Cadastrar ${rotuloTipo}`}
          </button>
        </div>
      </form>

      {feedback && (
        <p
          className={`feedback ${feedback.tipo}`}
          role={feedback.tipo === 'erro' ? 'alert' : 'status'}
        >
          {feedback.mensagem}
        </p>
      )}
    </section>
  )
}

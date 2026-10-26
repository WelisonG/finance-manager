import { useState, type FormEvent } from 'react'
import { cadastrarMovimentacao, mensagemDeErro, type TipoMovimentacao } from '../api'
import { useCategoriasDespesa } from '../useCategoriasDespesa'
import {
  categoriasDoTipo,
  hojeEmIso,
  validar,
  type CamposFormulario,
  type Erros,
} from '../movimentacoes'
import { CamposMovimentacao } from './CamposMovimentacao'
import './FormularioMovimentacao.css'

type Feedback = { tipo: 'sucesso' | 'erro'; mensagem: string }

type FormularioMovimentacaoProps = {
  aoCadastrar: () => void
}

export function FormularioMovimentacao({ aoCadastrar }: FormularioMovimentacaoProps) {
  const [tipo, setTipo] = useState<TipoMovimentacao>('despesa')
  const [campos, setCampos] = useState<CamposFormulario>(() => ({
    descricao: '',
    valor: '',
    categoria: '',
    data: hojeEmIso(),
  }))
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const { categorias: categoriasDespesa, erro: erroCategorias } = useCategoriasDespesa()

  const categorias = categoriasDoTipo(tipo, categoriasDespesa)
  const carregandoCategorias = tipo === 'despesa' && categoriasDespesa === null && !erroCategorias

  function alterarCampo(campo: keyof CamposFormulario, valor: string) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }))
  }

  function trocarTipo(novoTipo: TipoMovimentacao) {
    setTipo(novoTipo)
    setCampos((atuais) => ({ ...atuais, categoria: '' }))
    setErros((atuais) => ({ ...atuais, categoria: undefined }))
    setFeedback(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setFeedback(null)

    const novosErros = validar(campos, categorias)
    setErros(novosErros)

    if (Object.keys(novosErros).length > 0) return

    setEnviando(true)
    try {
      const resposta = await cadastrarMovimentacao(tipo, {
        descricao: campos.descricao.trim(),
        valor: Number(campos.valor),
        categoria: campos.categoria,
        data: campos.data,
      })
      setFeedback({ tipo: 'sucesso', mensagem: resposta.mensagem })
      setCampos((atuais) => ({ ...atuais, descricao: '', valor: '' }))
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
        <CamposMovimentacao
          idPrefixo="cad"
          tipo={tipo}
          campos={campos}
          erros={erros}
          categorias={categorias}
          carregandoCategorias={carregandoCategorias}
          erroCategorias={erroCategorias}
          aoAlterar={alterarCampo}
        />

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

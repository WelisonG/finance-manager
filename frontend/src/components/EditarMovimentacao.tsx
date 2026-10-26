import { useEffect, useRef, useState, type FormEvent } from 'react'
import { atualizarMovimentacao, mensagemDeErro, type Movimentacao } from '../api'
import { useCategoriasDespesa } from '../useCategoriasDespesa'
import {
  categoriasDoTipo,
  validar,
  type CamposFormulario,
  type Erros,
} from '../movimentacoes'
import { CamposMovimentacao } from './CamposMovimentacao'
import './FormularioMovimentacao.css'
import './ListaMovimentacoes.css'

type EditarMovimentacaoProps = {
  movimentacao: Movimentacao
  aoFechar: () => void
  aoSalvar: () => void
}

export function EditarMovimentacao({ movimentacao, aoFechar, aoSalvar }: EditarMovimentacaoProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { categorias: categoriasDespesa, erro: erroCategorias } = useCategoriasDespesa()
  const [campos, setCampos] = useState<CamposFormulario>(() => ({
    descricao: movimentacao.descricao,
    valor: String(movimentacao.valor),
    categoria: movimentacao.categoria,
    data: movimentacao.dataIso,
  }))
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)
  const [erroApi, setErroApi] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  const categorias = categoriasDoTipo(movimentacao.tipo, categoriasDespesa)
  const carregandoCategorias =
    movimentacao.tipo === 'despesa' && categoriasDespesa === null && !erroCategorias
  const rotuloTipo = movimentacao.tipo === 'receita' ? 'receita' : 'despesa'

  function alterarCampo(campo: keyof CamposFormulario, valor: string) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroApi(null)

    const novosErros = validar(campos, categorias)
    setErros(novosErros)

    if (Object.keys(novosErros).length > 0) return

    setSalvando(true)
    try {
      await atualizarMovimentacao(movimentacao.tipo, movimentacao.id, {
        descricao: campos.descricao.trim(),
        valor: Number(campos.valor),
        categoria: campos.categoria,
        data: campos.data,
      })
      aoSalvar()
    } catch (erro) {
      setErroApi(mensagemDeErro(erro))
      setSalvando(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialogo"
      aria-labelledby="titulo-edicao"
      onClose={aoFechar}
    >
      <h2 id="titulo-edicao">Editar {rotuloTipo}</h2>

      <form className="formulario" onSubmit={salvar} noValidate>
        <CamposMovimentacao
          idPrefixo="edi"
          tipo={movimentacao.tipo}
          campos={campos}
          erros={erros}
          categorias={categorias}
          carregandoCategorias={carregandoCategorias}
          erroCategorias={erroCategorias}
          aoAlterar={alterarCampo}
        />

        {erroApi && (
          <p className="feedback erro campo-largo" role="alert">
            {erroApi}
          </p>
        )}

        <div className="acoes campo-largo">
          <button
            type="button"
            className="botao-secundario"
            disabled={salvando}
            onClick={() => dialogRef.current?.close()}
          >
            Cancelar
          </button>
          <button type="submit" className={`botao-principal ${movimentacao.tipo}`} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

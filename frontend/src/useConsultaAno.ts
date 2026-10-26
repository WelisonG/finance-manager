import { useEffect, useState } from 'react'
import { mensagemDeErro } from './api'

export type Consulta<T> =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'sucesso'; dados: T }

// Busca os dados de um ano. `versao` refaz a busca sem voltar ao carregamento (após cadastro, edição ou exclusão).
// Quem usa deve remontar o componente (key) ao trocar de ano, para que o estado comece em carregando.
export function useConsultaAno<T>(
  buscar: (ano: number, signal: AbortSignal) => Promise<T>,
  ano: number,
  versao: number,
) {
  const [tentativa, setTentativa] = useState(0)
  const [consulta, setConsulta] = useState<Consulta<T>>({ status: 'carregando' })

  useEffect(() => {
    const controlador = new AbortController()

    buscar(ano, controlador.signal)
      .then((dados) => setConsulta({ status: 'sucesso', dados }))
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return
        setConsulta({ status: 'erro', mensagem: mensagemDeErro(erro) })
      })

    return () => controlador.abort()
  }, [buscar, ano, versao, tentativa])

  function tentarNovamente() {
    setConsulta({ status: 'carregando' })
    setTentativa((valor) => valor + 1)
  }

  return { consulta, tentarNovamente }
}

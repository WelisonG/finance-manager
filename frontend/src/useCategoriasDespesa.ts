import { useEffect, useState } from 'react'
import { buscarCategoriasDespesa, mensagemDeErro } from './api'

export function useCategoriasDespesa() {
  const [categorias, setCategorias] = useState<string[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const controlador = new AbortController()

    buscarCategoriasDespesa(controlador.signal)
      .then(setCategorias)
      .catch((erroRequisicao: unknown) => {
        if (controlador.signal.aborted) return
        setErro(mensagemDeErro(erroRequisicao))
      })

    return () => controlador.abort()
  }, [])

  return { categorias, erro }
}

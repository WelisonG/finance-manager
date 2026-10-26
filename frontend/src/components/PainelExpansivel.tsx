import { useId, useState, type ReactNode } from 'react'
import './PainelExpansivel.css'

type PainelExpansivelProps = {
  titulo: string
  inicialmenteAberto?: boolean
  className?: string
  // Elemento exibido antes do título, fora do botão de expandir (ex.: alça de arraste).
  alca?: ReactNode
  children: ReactNode
}

export function PainelExpansivel({
  titulo,
  inicialmenteAberto = false,
  className = '',
  alca,
  children,
}: PainelExpansivelProps) {
  const [aberto, setAberto] = useState(inicialmenteAberto)
  const id = useId()
  const idTitulo = `${id}-titulo`
  const idCorpo = `${id}-corpo`

  return (
    <section className={`painel ${className}`}>
      <div className="painel-cabecalho">
        {alca}
        <h2 className="painel-titulo">
          <button
            type="button"
            id={idTitulo}
            className="painel-botao"
            aria-expanded={aberto}
            aria-controls={idCorpo}
            onClick={() => setAberto((valor) => !valor)}
          >
            <span>{titulo}</span>
            <svg
              className={`painel-seta ${aberto ? 'aberta' : ''}`}
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </h2>
      </div>

      {/* Mantido no DOM quando fechado (hidden) para preservar estado de formulários e gráficos. */}
      <div id={idCorpo} role="region" aria-labelledby={idTitulo} className="painel-corpo" hidden={!aberto}>
        {children}
      </div>
    </section>
  )
}

import { useState, type DragEvent, type ReactNode } from 'react'
import type { SecaoId } from '../ordemSecoes'
import { PainelExpansivel } from './PainelExpansivel'
import './SecoesOrdenaveis.css'

export type SecaoItem = {
  id: SecaoId
  titulo: string
  inicialmenteAberto?: boolean
  className?: string
  conteudo: ReactNode
}

type Posicao = 'antes' | 'depois'
type Destino = { id: SecaoId; posicao: Posicao }

type SecoesOrdenaveisProps = {
  itens: SecaoItem[]
  ordem: SecaoId[]
  aoReordenar: (novaOrdem: SecaoId[]) => void
}

function posicaoNoAlvo(evento: DragEvent<HTMLElement>): Posicao {
  const retangulo = evento.currentTarget.getBoundingClientRect()
  return evento.clientY < retangulo.top + retangulo.height / 2 ? 'antes' : 'depois'
}

// Arraste iniciado somente pela alça: a alça é o único elemento draggable.
export function SecoesOrdenaveis({ itens, ordem, aoReordenar }: SecoesOrdenaveisProps) {
  const [arrastando, setArrastando] = useState<SecaoId | null>(null)
  const [destino, setDestino] = useState<Destino | null>(null)

  const itensPorId = new Map(itens.map((item) => [item.id, item] as const))

  function iniciarArraste(evento: DragEvent<HTMLSpanElement>, id: SecaoId) {
    const secao = evento.currentTarget.closest<HTMLElement>('.secao-ordenavel')

    if (secao) {
      // Mostra a seção inteira como imagem do arraste, não só a alça.
      const retangulo = secao.getBoundingClientRect()
      evento.dataTransfer.setDragImage(
        secao,
        evento.clientX - retangulo.left,
        evento.clientY - retangulo.top,
      )
    }

    evento.dataTransfer.effectAllowed = 'move'
    // Firefox só inicia o arraste se algum dado for definido.
    evento.dataTransfer.setData('text/plain', id)
    setArrastando(id)
  }

  function finalizarArraste() {
    setArrastando(null)
    setDestino(null)
  }

  function sobreSecao(evento: DragEvent<HTMLDivElement>, id: SecaoId) {
    if (arrastando === null) return

    if (arrastando === id) {
      setDestino(null)
      return
    }

    evento.preventDefault()
    evento.dataTransfer.dropEffect = 'move'

    const posicao = posicaoNoAlvo(evento)
    setDestino((atual) =>
      atual?.id === id && atual.posicao === posicao ? atual : { id, posicao },
    )
  }

  function mover(origem: SecaoId, alvo: SecaoId, posicao: Posicao) {
    if (origem === alvo) return

    const semOrigem = ordem.filter((id) => id !== origem)
    const indiceAlvo = semOrigem.indexOf(alvo)
    const inicio = posicao === 'antes' ? indiceAlvo : indiceAlvo + 1

    aoReordenar([...semOrigem.slice(0, inicio), origem, ...semOrigem.slice(inicio)])
  }

  function soltar(evento: DragEvent<HTMLDivElement>, id: SecaoId) {
    evento.preventDefault()

    if (arrastando !== null) {
      mover(arrastando, id, posicaoNoAlvo(evento))
    }

    finalizarArraste()
  }

  return (
    <div className="secoes-ordenaveis">
      {ordem.map((id) => {
        const item = itensPorId.get(id)
        if (!item) return null

        const classes = [
          'secao-ordenavel',
          arrastando === id ? 'arrastando' : '',
          destino?.id === id ? `drop-${destino.posicao}` : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div
            key={id}
            className={classes}
            onDragOver={(evento) => sobreSecao(evento, id)}
            onDrop={(evento) => soltar(evento, id)}
          >
            <PainelExpansivel
              titulo={item.titulo}
              inicialmenteAberto={item.inicialmenteAberto}
              className={item.className}
              alca={
                <span
                  className="alca-arrasto"
                  draggable
                  title="Arrastar para reordenar"
                  aria-hidden="true"
                  onDragStart={(evento) => iniciarArraste(evento, id)}
                  onDragEnd={finalizarArraste}
                >
                  <svg viewBox="0 0 16 20" width="16" height="20" focusable="false">
                    <circle cx="5" cy="4" r="1.5" fill="currentColor" />
                    <circle cx="11" cy="4" r="1.5" fill="currentColor" />
                    <circle cx="5" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="11" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="5" cy="16" r="1.5" fill="currentColor" />
                    <circle cx="11" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                </span>
              }
            >
              {item.conteudo}
            </PainelExpansivel>
          </div>
        )
      })}
    </div>
  )
}

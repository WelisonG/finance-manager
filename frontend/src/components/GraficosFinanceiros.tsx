import { useSyncExternalStore } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { buscarComparativo, buscarMensal, type MesComparativo, type MesFinanceiro } from '../api'
import { formatadorMoeda, formatadorMoedaCompacta, formatadorPercentual } from '../movimentacoes'
import { useConsultaAno, type Consulta } from '../useConsultaAno'
import './GraficosFinanceiros.css'

// Cores espelham as variáveis de index.css para o gráfico (SVG não resolve var() nos atributos).
const CORES = {
  claro: {
    receitas: '#059669',
    despesas: '#dc2626',
    saldo: '#2563eb',
    grade: '#e5e7eb',
    eixo: '#6b7280',
    superficie: '#ffffff',
    texto: '#111827',
  },
  escuro: {
    receitas: '#34d399',
    despesas: '#f87171',
    saldo: '#60a5fa',
    grade: '#2a2e3a',
    eixo: '#8b93a1',
    superficie: '#181b24',
    texto: '#f3f4f6',
  },
}

type Paleta = (typeof CORES)['claro']

const CONSULTA_TEMA_ESCURO = '(prefers-color-scheme: dark)'

function assinarTema(aoMudar: () => void) {
  const consulta = window.matchMedia(CONSULTA_TEMA_ESCURO)
  consulta.addEventListener('change', aoMudar)
  return () => consulta.removeEventListener('change', aoMudar)
}

function temaEscuroAtivo() {
  return window.matchMedia(CONSULTA_TEMA_ESCURO).matches
}

function usePaleta(): Paleta {
  const escuro = useSyncExternalStore(assinarTema, temaEscuroAtivo, () => false)
  return escuro ? CORES.escuro : CORES.claro
}

const ROTULOS_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatarVariacao(variacao: number | null) {
  if (variacao === null) {
    return <span className="indisponivel">Indisponível</span>
  }
  return formatadorPercentual.format(variacao / 100)
}

type EstadoGraficosProps = {
  consulta: Consulta<unknown>
  ano: number
  semDados: boolean
  aoTentar: () => void
}

// Mostra carregamento, erro ou ausência de dados; com dados, não renderiza nada.
function EstadoGraficos({ consulta, ano, semDados, aoTentar }: EstadoGraficosProps) {
  if (consulta.status === 'carregando') {
    return (
      <div className="graficos-estado" role="status">
        Carregando gráficos…
      </div>
    )
  }

  if (consulta.status === 'erro') {
    return (
      <div className="alerta" role="alert">
        <p>{consulta.mensagem}</p>
        <button type="button" onClick={aoTentar}>
          Tentar novamente
        </button>
      </div>
    )
  }

  if (semDados) {
    return <p className="graficos-estado">Sem movimentações em {ano}.</p>
  }

  return null
}

type GraficoProps = {
  ano: number
  // Muda quando receitas ou despesas mudam (cadastro, edição ou exclusão).
  versao: number
}

export function GraficoEvolucao({ ano, versao }: GraficoProps) {
  const { consulta, tentarNovamente } = useConsultaAno(buscarMensal, ano, versao)
  const paleta = usePaleta()

  const mensal = consulta.status === 'sucesso' ? consulta.dados : null
  const semDados =
    mensal !== null && mensal.every((mes) => mes.receitas === 0 && mes.despesas === 0)

  const dadosMensais = (mensal ?? []).map((mes: MesFinanceiro) => ({
    ...mes,
    rotulo: ROTULOS_MESES[mes.mes - 1],
  }))

  const tooltipEstilo = {
    backgroundColor: paleta.superficie,
    border: `1px solid ${paleta.grade}`,
    borderRadius: 8,
    color: paleta.texto,
  }

  return (
    <>
      <EstadoGraficos consulta={consulta} ano={ano} semDados={semDados} aoTentar={tentarNovamente} />

      {mensal && !semDados && (
        <div className="graficos-grid">
          <div className="grafico-bloco">
            <h3>Receitas e despesas por mês</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosMensais} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={paleta.grade} vertical={false} />
                <XAxis dataKey="rotulo" stroke={paleta.eixo} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={paleta.eixo}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tickFormatter={(valor: number) => formatadorMoedaCompacta.format(valor)}
                />
                <Tooltip
                  formatter={(valor) => formatadorMoeda.format(Number(valor))}
                  contentStyle={tooltipEstilo}
                  labelStyle={{ color: paleta.texto }}
                />
                <Legend wrapperStyle={{ color: paleta.eixo }} />
                <Bar dataKey="receitas" name="Receitas" fill={paleta.receitas} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill={paleta.despesas} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-bloco">
            <h3>Evolução do saldo</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dadosMensais} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={paleta.grade} vertical={false} />
                <XAxis dataKey="rotulo" stroke={paleta.eixo} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={paleta.eixo}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tickFormatter={(valor: number) => formatadorMoedaCompacta.format(valor)}
                />
                <ReferenceLine y={0} stroke={paleta.eixo} />
                <Tooltip
                  formatter={(valor) => formatadorMoeda.format(Number(valor))}
                  contentStyle={tooltipEstilo}
                  labelStyle={{ color: paleta.texto }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke={paleta.saldo}
                  strokeWidth={2}
                  dot={{ r: 3, fill: paleta.saldo }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  )
}

export function TabelaComparativo({ ano, versao }: GraficoProps) {
  const { consulta, tentarNovamente } = useConsultaAno(buscarComparativo, ano, versao)

  const comparativo = consulta.status === 'sucesso' ? consulta.dados : null
  const semDados =
    comparativo !== null &&
    comparativo.every((mes: MesComparativo) => mes.receitas === 0 && mes.despesas === 0)

  return (
    <>
      <EstadoGraficos consulta={consulta} ano={ano} semDados={semDados} aoTentar={tentarNovamente} />

      {comparativo && !semDados && (
        <div className="tabela-bloco">
          <div className="tabela-wrapper">
            <table className="tabela-variacoes">
              <caption className="sr-only">Comparativo mensal com variações em relação ao mês anterior</caption>
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">Receitas</th>
                  <th scope="col">Var. receitas</th>
                  <th scope="col">Despesas</th>
                  <th scope="col">Var. despesas</th>
                  <th scope="col">Saldo</th>
                  <th scope="col">Var. saldo</th>
                </tr>
              </thead>
              <tbody>
                {comparativo.map((mes) => (
                  <tr key={mes.mes}>
                    <th scope="row">{ROTULOS_MESES[mes.mes - 1]}</th>
                    <td>{formatadorMoeda.format(mes.receitas)}</td>
                    <td>{formatarVariacao(mes.variacao_receitas)}</td>
                    <td>{formatadorMoeda.format(mes.despesas)}</td>
                    <td>{formatarVariacao(mes.variacao_despesas)}</td>
                    <td>{formatadorMoeda.format(mes.saldo)}</td>
                    <td>{formatarVariacao(mes.variacao_saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

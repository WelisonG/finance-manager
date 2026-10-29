from fastapi import FastAPI, HTTPException, Query
from database.gastos import atualizar_gasto, buscar_datas_valores_gastos, buscar_valores_gastos, criar_gasto, excluir_gasto, listar_gastos
from database.receitas import atualizar_receita, buscar_datas_valores_receitas, buscar_valores_receitas, criar_receita, excluir_receita, listar_receitas
from schemas.gastos import Gasto
from schemas.receitas import Receita
from schemas.categorias import CATEGORIAS
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal
import database.connection


CENTAVOS = Decimal("0.01")

app = FastAPI()

def validar_periodo(data_inicio, data_fim):
    if data_inicio and data_fim and data_inicio > data_fim:
        raise HTTPException(
            status_code=422,
            detail="data_inicio não pode ser posterior a data_fim",
        )

def arredondar(valor: Decimal) -> float:
    return float(valor.quantize(CENTAVOS, rounding=ROUND_HALF_UP))

@app.get("/gastos")
def consultar_gastos(
    categoria: str | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
):
    validar_periodo(data_inicio, data_fim)

    gastos = listar_gastos(
        categoria,
        data_inicio.isoformat() if data_inicio else None,
        data_fim.isoformat() if data_fim else None,
    )
    return [
        {
            "id": gasto[0],
            "descricao": gasto[1],
            "valor": gasto[2],
            "categoria": gasto[3],
            "data": datetime.strptime(gasto[4], "%Y-%m-%d").strftime("%d/%m/%Y")

        }
        for gasto in gastos
    ]

@app.get("/gastos/resumo")
def consultar_resumo(
    data_inicio: date | None = None,
    data_fim: date | None = None,
):
    validar_periodo(data_inicio, data_fim)

    valores = buscar_valores_gastos(
        data_inicio.isoformat() if data_inicio else None,
        data_fim.isoformat() if data_fim else None,
    )

    totais = {}
    for categoria, valor in valores:
        total_categoria, quantidade = totais.get(categoria, (Decimal("0"), 0))
        totais[categoria] = (total_categoria + Decimal(str(valor)), quantidade + 1)

    total = sum((t for t, _ in totais.values()), Decimal("0"))
    quantidade = sum(q for _, q in totais.values())

    por_categoria = sorted(
        (
            {"categoria": categoria, "total": arredondar(t), "quantidade": q}
            for categoria, (t, q) in totais.items()
        ),
        key=lambda item: item["total"],
        reverse=True,
    )

    return {
        "total": arredondar(total),
        "quantidade": quantidade,
        "por_categoria": por_categoria,
    }

@app.get("/financeiro/resumo")
def consultar_resumo_financeiro(
    data_inicio: date | None = None,
    data_fim: date | None = None,
):
    validar_periodo(data_inicio, data_fim)

    inicio = data_inicio.isoformat() if data_inicio else None
    fim = data_fim.isoformat() if data_fim else None

    total_receitas = sum(
        (Decimal(str(valor)) for _, valor in buscar_valores_receitas(inicio, fim)),
        Decimal("0"),
    )
    total_despesas = sum(
        (Decimal(str(valor)) for _, valor in buscar_valores_gastos(inicio, fim)),
        Decimal("0"),
    )

    return {
        "total_receitas": arredondar(total_receitas),
        "total_despesas": arredondar(total_despesas),
        "saldo": arredondar(total_receitas - total_despesas),
    }

@app.put("/receitas/{id_receita}")
def editar_receita(id_receita: int, receita: Receita):
    atualizado = atualizar_receita(
        id_receita,
        receita.descricao,
        receita.valor,
        receita.categoria,
        receita.data.isoformat()
    )

    if not atualizado:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    return {
        "mensagem": "Receita atualizada com sucesso!",
        "receita": {
            "id": id_receita,
            "descricao": receita.descricao,
            "valor": receita.valor,
            "categoria": receita.categoria,
            "data": receita.data.strftime("%d/%m/%Y"),
        },
    }

@app.delete("/receitas/{id_receita}")
def remover_receita(id_receita: int):
    excluido = excluir_receita(id_receita)

    if not excluido:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    return {"mensagem": "Receita excluída com sucesso!"}

def calcular_meses(ano):
    inicio = f"{ano:04d}-01-01"
    fim = f"{ano:04d}-12-31"

    receitas_por_mes = {mes: Decimal("0") for mes in range(1, 13)}
    despesas_por_mes = {mes: Decimal("0") for mes in range(1, 13)}

    for data, valor in buscar_datas_valores_receitas(inicio, fim):
        receitas_por_mes[int(data[5:7])] += Decimal(str(valor))

    for data, valor in buscar_datas_valores_gastos(inicio, fim):
        despesas_por_mes[int(data[5:7])] += Decimal(str(valor))

    return [
        {
            "mes": mes,
            "receitas": receitas_por_mes[mes],
            "despesas": despesas_por_mes[mes],
            "saldo": receitas_por_mes[mes] - despesas_por_mes[mes],
        }
        for mes in range(1, 13)
    ]

def calcular_variacao(atual, anterior):
    if anterior is None or anterior == 0:
        return None
    return arredondar((atual - anterior) / abs(anterior) * 100)

@app.get("/financeiro/mensal")
def consultar_financeiro_mensal(ano: int = Query(..., ge=1900, le=9999)):
    meses = calcular_meses(ano)

    return {
        "ano": ano,
        "meses": [
            {
                "mes": mes["mes"],
                "receitas": arredondar(mes["receitas"]),
                "despesas": arredondar(mes["despesas"]),
                "saldo": arredondar(mes["saldo"]),
            }
            for mes in meses
        ],
    }

@app.get("/financeiro/comparativo")
def consultar_comparativo_mensal(ano: int = Query(..., ge=1900, le=9999)):
    meses = calcular_meses(ano)

    comparativo = []
    for indice, mes in enumerate(meses):
        anterior = meses[indice - 1] if indice > 0 else None
        comparativo.append({
            "mes": mes["mes"],
            "receitas": arredondar(mes["receitas"]),
            "despesas": arredondar(mes["despesas"]),
            "saldo": arredondar(mes["saldo"]),
            "variacao_receitas": calcular_variacao(
                mes["receitas"], anterior["receitas"] if anterior else None
            ),
            "variacao_despesas": calcular_variacao(
                mes["despesas"], anterior["despesas"] if anterior else None
            ),
            "variacao_saldo": calcular_variacao(
                mes["saldo"], anterior["saldo"] if anterior else None
            ),
        })

    return {"ano": ano, "meses": comparativo}

@app.get("/categorias")
def consultar_categorias():
    return CATEGORIAS

@app.get("/")
def home():
    return {"mensagem": "Minha API está funcionando!"}

@app.post("/gastos")
def cadastrar_gasto(gasto: Gasto):


    criar_gasto(
       gasto.descricao,
       gasto.valor,
       gasto.categoria,
       gasto.data.isoformat()
    )

    return {"mensagem": "Gasto criado com sucesso!", "gasto": gasto}

@app.put("/gastos/{id_gasto}")
def editar_gasto(id_gasto: int, gasto: Gasto):
    atualizado = atualizar_gasto(
        id_gasto,
        gasto.descricao,
        gasto.valor,
        gasto.categoria,
        gasto.data.isoformat()
    )

    if not atualizado:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")

    return {
        "mensagem": "Gasto atualizado com sucesso!",
        "gasto": {
            "id": id_gasto,
            "descricao": gasto.descricao,
            "valor": gasto.valor,
            "categoria": gasto.categoria,
            "data": gasto.data.strftime("%d/%m/%Y"),
        },
    }

@app.delete("/gastos/{id_gasto}")
def remover_gasto(id_gasto: int):
    excluido = excluir_gasto(id_gasto)

    if not excluido:
        raise HTTPException(status_code=404, detail="Gasto não encontrado")

    return {"mensagem": "Gasto excluído com sucesso!"}

@app.post("/receitas")
def cadastrar_receita(receita: Receita):
    criar_receita(
        receita.descricao,
        receita.valor,
        receita.categoria,
        receita.data.isoformat()
    )

    return {"mensagem": "Receita criada com sucesso!", "receita": receita}

@app.get("/receitas")
def consultar_receitas(
    data_inicio: date | None = None,
    data_fim: date | None = None,
):
    validar_periodo(data_inicio, data_fim)

    receitas = listar_receitas(
        data_inicio.isoformat() if data_inicio else None,
        data_fim.isoformat() if data_fim else None,
    )
    return [
        {
            "id": receita[0],
            "descricao": receita[1],
            "valor": receita[2],
            "categoria": receita[3],
            "data": datetime.strptime(receita[4], "%Y-%m-%d").strftime("%d/%m/%Y")
        }
        for receita in receitas
    ]

@app.get("/receitas/resumo")
def consultar_resumo_receitas(
    data_inicio: date | None = None,
    data_fim: date | None = None,
):
    validar_periodo(data_inicio, data_fim)

    valores = buscar_valores_receitas(
        data_inicio.isoformat() if data_inicio else None,
        data_fim.isoformat() if data_fim else None,
    )

    totais = {}
    for categoria, valor in valores:
        total_categoria, quantidade = totais.get(categoria, (Decimal("0"), 0))
        totais[categoria] = (total_categoria + Decimal(str(valor)), quantidade + 1)

    total = sum((t for t, _ in totais.values()), Decimal("0"))
    quantidade = sum(q for _, q in totais.values())

    por_categoria = sorted(
        (
            {"categoria": categoria, "total": arredondar(t), "quantidade": q}
            for categoria, (t, q) in totais.items()
        ),
        key=lambda item: item["total"],
        reverse=True,
    )

    return {
        "total": arredondar(total),
        "quantidade": quantidade,
        "por_categoria": por_categoria,
    }


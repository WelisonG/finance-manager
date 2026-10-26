from fastapi import FastAPI, HTTPException
from database.gastos import buscar_valores_gastos, criar_gasto, listar_gastos
from schemas.gastos import Gasto
from schemas.categorias import CATEGORIAS
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal


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


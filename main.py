from fastapi import FastAPI, HTTPException
from database.gastos import criar_gasto, listar_gastos
from schemas.gastos import Gasto
from schemas.categorias import CATEGORIAS
from datetime import date, datetime


app = FastAPI()

@app.get("/gastos")
def consultar_gastos(
    categoria: str | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
):
    if data_inicio and data_fim and data_inicio > data_fim:
        raise HTTPException(
            status_code=422,
            detail="data_inicio não pode ser posterior a data_fim",
        )

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


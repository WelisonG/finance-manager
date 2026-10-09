from fastapi import FastAPI
from database.gastos import criar_gasto, listar_gastos
from schemas.gastos import Gasto
from datetime import datetime


app = FastAPI()

@app.get("/gastos")
def consultar_gastos():
    gastos = listar_gastos()
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


from fastapi import FastAPI
from database.gastos import criar_gasto, listar_gastos


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
            "data": gasto[4]
        }
        for gasto in gastos
    ]

@app.get("/")
def home():
    return {"mensagem": "Minha API está funcionando!"}

@app.post("/gastos")
def cadastrar_gasto(gasto: dict):


    criar_gasto(
       gasto["descricao"],
       gasto["valor"],
       gasto["categoria"],
       gasto["data"]
    )

    return {"mensagem": "Gasto criado com sucesso!", "gasto": gasto}


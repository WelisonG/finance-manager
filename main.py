from fastapi import FastAPI
from database.gastos import criar_gasto


app = FastAPI()


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


from datetime import date
from pydantic import BaseModel


class Gasto(BaseModel):
    descricao: str
    valor: float
    categoria: str
    data: date
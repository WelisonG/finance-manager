from datetime import date
from pydantic import BaseModel, Field, field_validator


class Gasto(BaseModel):
    descricao: str
    valor: float = Field(gt=0)
    categoria: str
    data: date

    @field_validator("descricao")
    @classmethod
    def descricao_nao_vazia(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("descricao não pode ser vazia ou conter apenas espaços")
        return value
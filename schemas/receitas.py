from datetime import date
from pydantic import BaseModel, Field, field_validator
from schemas.categorias import CATEGORIAS_RECEITAS


class Receita(BaseModel):
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

    @field_validator("categoria")
    @classmethod
    def categoria_valida(cls, value: str) -> str:
        if value not in CATEGORIAS_RECEITAS:
            raise ValueError(f"categoria deve ser uma das opções: {', '.join(CATEGORIAS_RECEITAS)}")
        return value

import pytest


GASTO_VALIDO = {
    "descricao": "Almoço executivo",
    "valor": 30.0,
    "categoria": "Alimentação",
    "data": "2026-01-11",
}


@pytest.mark.usefixtures("gastos_iniciais")
def test_edita_gasto_existente(cliente):
    resposta = cliente.put("/gastos/1", json=GASTO_VALIDO)

    assert resposta.status_code == 200
    assert resposta.json() == {
        "mensagem": "Gasto atualizado com sucesso!",
        "gasto": {
            "id": 1,
            "descricao": "Almoço executivo",
            "valor": 30.0,
            "categoria": "Alimentação",
            "data": "11/01/2026",
        },
    }

    gastos = cliente.get("/gastos").json()
    assert gastos[-1] == {
        "id": 1,
        "descricao": "Almoço executivo",
        "valor": 30.0,
        "categoria": "Alimentação",
        "data": "11/01/2026",
    }


@pytest.mark.usefixtures("gastos_iniciais")
def test_edicao_reflete_no_resumo(cliente):
    cliente.put("/gastos/1", json=GASTO_VALIDO)

    resumo = cliente.get("/gastos/resumo").json()

    assert resumo["total"] == 374.4
    assert resumo["por_categoria"][0] == {
        "categoria": "Alimentação",
        "total": 330.0,
        "quantidade": 2,
    }


@pytest.mark.usefixtures("gastos_iniciais")
@pytest.mark.parametrize(
    "campo, valor",
    [
        ("valor", 0),
        ("valor", -5),
        ("descricao", ""),
        ("descricao", "   "),
        ("categoria", "Viagem"),
        ("data", "2026-13-01"),
    ],
)
def test_edicao_invalida_retorna_422_sem_alterar(cliente, campo, valor):
    antes = cliente.get("/gastos").json()

    resposta = cliente.put("/gastos/1", json={**GASTO_VALIDO, campo: valor})

    assert resposta.status_code == 422
    assert cliente.get("/gastos").json() == antes


@pytest.mark.usefixtures("gastos_iniciais")
def test_editar_id_inexistente_retorna_404(cliente):
    resposta = cliente.put("/gastos/999", json=GASTO_VALIDO)

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Gasto não encontrado"}


@pytest.mark.usefixtures("gastos_iniciais")
def test_exclui_gasto_existente(cliente):
    resposta = cliente.delete("/gastos/3")

    assert resposta.status_code == 200
    assert resposta.json() == {"mensagem": "Gasto excluído com sucesso!"}

    ids = [gasto["id"] for gasto in cliente.get("/gastos").json()]
    assert ids == [4, 2, 1]


@pytest.mark.usefixtures("gastos_iniciais")
def test_exclusao_reflete_no_resumo(cliente):
    cliente.delete("/gastos/3")

    resumo = cliente.get("/gastos/resumo").json()

    assert resumo["total"] == 329.9
    assert resumo["quantidade"] == 3
    assert [item["categoria"] for item in resumo["por_categoria"]] == [
        "Alimentação",
        "Transporte",
    ]


@pytest.mark.usefixtures("gastos_iniciais")
def test_excluir_id_inexistente_retorna_404(cliente):
    resposta = cliente.delete("/gastos/999")

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Gasto não encontrado"}


@pytest.mark.usefixtures("gastos_iniciais")
def test_excluir_mesmo_id_duas_vezes_retorna_404_na_segunda(cliente):
    assert cliente.delete("/gastos/2").status_code == 200

    resposta = cliente.delete("/gastos/2")

    assert resposta.status_code == 404

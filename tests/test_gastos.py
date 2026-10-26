import pytest


GASTO_VALIDO = {
    "descricao": "Livro",
    "valor": 50.0,
    "categoria": "Educação",
    "data": "2026-03-01",
}


def ids(resposta):
    return [gasto["id"] for gasto in resposta.json()]


@pytest.mark.usefixtures("gastos_iniciais")
def test_lista_todos_os_gastos_sem_filtros(cliente):
    resposta = cliente.get("/gastos")

    assert resposta.status_code == 200
    assert ids(resposta) == [4, 3, 2, 1]


@pytest.mark.usefixtures("gastos_iniciais")
def test_formata_gasto_com_data_brasileira(cliente):
    resposta = cliente.get("/gastos")

    assert resposta.json()[0] == {
        "id": 4,
        "descricao": "Mercado",
        "valor": 300.0,
        "categoria": "Alimentação",
        "data": "20/02/2026",
    }


@pytest.mark.usefixtures("gastos_iniciais")
@pytest.mark.parametrize(
    "params, ids_esperados",
    [
        ({"categoria": "Alimentação"}, [4, 1]),
        ({"categoria": "alimentação"}, [4, 1]),
        ({"data_inicio": "2026-02-01"}, [4, 3]),
        ({"data_fim": "2026-01-15"}, [2, 1]),
        ({"data_inicio": "2026-01-15", "data_fim": "2026-02-01"}, [3, 2]),
        ({"categoria": "Alimentação", "data_inicio": "2026-02-01"}, [4]),
        ({"categoria": "Lazer", "data_inicio": "2026-01-01", "data_fim": "2026-01-31"}, []),
    ],
)
def test_filtra_gastos(cliente, params, ids_esperados):
    resposta = cliente.get("/gastos", params=params)

    assert resposta.status_code == 200
    assert ids(resposta) == ids_esperados


@pytest.mark.usefixtures("gastos_iniciais")
def test_intervalo_invertido_retorna_422(cliente):
    resposta = cliente.get(
        "/gastos",
        params={"data_inicio": "2026-02-01", "data_fim": "2026-01-01"},
    )

    assert resposta.status_code == 422


@pytest.mark.parametrize(
    "params",
    [{"data_inicio": "01/01/2026"}, {"data_fim": "2026-13-01"}],
)
def test_data_em_formato_invalido_retorna_422(cliente, params):
    resposta = cliente.get("/gastos", params=params)

    assert resposta.status_code == 422


@pytest.mark.usefixtures("gastos_iniciais")
def test_post_gasto_valido_cadastra_gasto(cliente):
    resposta = cliente.post("/gastos", json=GASTO_VALIDO)

    assert resposta.status_code == 200
    assert resposta.json()["mensagem"] == "Gasto criado com sucesso!"

    gastos = cliente.get("/gastos").json()
    assert len(gastos) == 5
    assert gastos[0]["descricao"] == "Livro"


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
def test_post_gasto_invalido_retorna_422_sem_cadastrar(cliente, campo, valor):
    resposta = cliente.post("/gastos", json={**GASTO_VALIDO, campo: valor})

    assert resposta.status_code == 422
    assert len(cliente.get("/gastos").json()) == 4

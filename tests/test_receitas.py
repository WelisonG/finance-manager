import pytest


RECEITA_VALIDA = {
    "descricao": "Bônus",
    "valor": 200.0,
    "categoria": "Outros",
    "data": "2026-03-01",
}


def ids(resposta):
    return [receita["id"] for receita in resposta.json()]


@pytest.mark.usefixtures("receitas_iniciais")
def test_cadastra_receita_valida(cliente):
    resposta = cliente.post("/receitas", json=RECEITA_VALIDA)

    assert resposta.status_code == 200
    assert resposta.json()["mensagem"] == "Receita criada com sucesso!"

    receitas = cliente.get("/receitas").json()
    assert len(receitas) == 5
    assert receitas[0]["descricao"] == "Bônus"


@pytest.mark.usefixtures("receitas_iniciais")
@pytest.mark.parametrize(
    "campo, valor",
    [
        ("valor", 0),
        ("valor", -5),
        ("descricao", ""),
        ("descricao", "   "),
        ("categoria", "Alimentação"),
        ("data", "2026-13-01"),
    ],
)
def test_cadastro_receita_invalida_retorna_422_sem_cadastrar(cliente, campo, valor):
    resposta = cliente.post("/receitas", json={**RECEITA_VALIDA, campo: valor})

    assert resposta.status_code == 422
    assert len(cliente.get("/receitas").json()) == 4


@pytest.mark.usefixtures("receitas_iniciais")
def test_lista_receitas_sem_filtros(cliente):
    resposta = cliente.get("/receitas")

    assert resposta.status_code == 200
    assert ids(resposta) == [4, 3, 2, 1]


@pytest.mark.usefixtures("receitas_iniciais")
def test_formata_receita_com_data_brasileira(cliente):
    resposta = cliente.get("/receitas")

    assert resposta.json()[0] == {
        "id": 4,
        "descricao": "Reembolso viagem",
        "valor": 120.5,
        "categoria": "Reembolsos",
        "data": "18/02/2026",
    }


@pytest.mark.usefixtures("receitas_iniciais")
@pytest.mark.parametrize(
    "params, ids_esperados",
    [
        ({"data_inicio": "2026-02-01"}, [4, 3]),
        ({"data_fim": "2026-01-20"}, [2, 1]),
        ({"data_inicio": "2026-01-20", "data_fim": "2026-02-05"}, [3, 2]),
    ],
)
def test_filtra_receitas_por_periodo_inclusivo(cliente, params, ids_esperados):
    resposta = cliente.get("/receitas", params=params)

    assert resposta.status_code == 200
    assert ids(resposta) == ids_esperados


@pytest.mark.usefixtures("receitas_iniciais")
def test_receitas_intervalo_invertido_retorna_422(cliente):
    resposta = cliente.get(
        "/receitas",
        params={"data_inicio": "2026-02-01", "data_fim": "2026-01-01"},
    )

    assert resposta.status_code == 422


@pytest.mark.usefixtures("receitas_iniciais")
def test_resumo_receitas_sem_filtros(cliente):
    resposta = cliente.get("/receitas/resumo")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "total": 6620.5,
        "quantidade": 4,
        "por_categoria": [
            {"categoria": "Salário", "total": 6000.0, "quantidade": 2},
            {"categoria": "Freelance", "total": 500.0, "quantidade": 1},
            {"categoria": "Reembolsos", "total": 120.5, "quantidade": 1},
        ],
    }


@pytest.mark.usefixtures("receitas_iniciais")
def test_resumo_receitas_com_periodo(cliente):
    resposta = cliente.get("/receitas/resumo", params={"data_inicio": "2026-02-01"})

    assert resposta.status_code == 200
    assert resposta.json()["total"] == 3120.5
    assert resposta.json()["quantidade"] == 2


@pytest.mark.usefixtures("receitas_iniciais")
def test_resumo_receitas_intervalo_invertido_retorna_422(cliente):
    resposta = cliente.get(
        "/receitas/resumo",
        params={"data_inicio": "2026-02-01", "data_fim": "2026-01-01"},
    )

    assert resposta.status_code == 422


def test_resumo_receitas_sem_receitas(cliente):
    resposta = cliente.get("/receitas/resumo")

    assert resposta.status_code == 200
    assert resposta.json() == {"total": 0.0, "quantidade": 0, "por_categoria": []}


def test_resumo_receitas_soma_centavos_sem_erro_de_ponto_flutuante(cliente):
    for valor in (0.10, 0.20):
        resposta = cliente.post(
            "/receitas",
            json={
                "descricao": "Cashback",
                "valor": valor,
                "categoria": "Outros",
                "data": "2026-03-01",
            },
        )
        assert resposta.status_code == 200

    resposta = cliente.get("/receitas/resumo")

    assert resposta.json()["total"] == 0.3

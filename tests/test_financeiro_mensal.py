import pytest


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_mensal_retorna_ano_e_12_meses_em_ordem(cliente):
    resposta = cliente.get("/financeiro/mensal", params={"ano": 2026})

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["ano"] == 2026
    assert [mes["mes"] for mes in corpo["meses"]] == list(range(1, 13))


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_mensal_calcula_receitas_despesas_e_saldo(cliente):
    meses = cliente.get("/financeiro/mensal", params={"ano": 2026}).json()["meses"]

    assert meses[0] == {"mes": 1, "receitas": 3500.0, "despesas": 29.9, "saldo": 3470.1}
    assert meses[1] == {"mes": 2, "receitas": 3120.5, "despesas": 340.0, "saldo": 2780.5}


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_mensal_meses_sem_movimentacao_retornam_zero(cliente):
    meses = cliente.get("/financeiro/mensal", params={"ano": 2026}).json()["meses"]

    assert meses[2:] == [
        {"mes": mes, "receitas": 0.0, "despesas": 0.0, "saldo": 0.0}
        for mes in range(3, 13)
    ]


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_mensal_ano_sem_registros_retorna_zeros(cliente):
    resposta = cliente.get("/financeiro/mensal", params={"ano": 2030})

    assert resposta.status_code == 200
    assert resposta.json() == {
        "ano": 2030,
        "meses": [
            {"mes": mes, "receitas": 0.0, "despesas": 0.0, "saldo": 0.0}
            for mes in range(1, 13)
        ],
    }


def test_mensal_sem_ano_retorna_422(cliente):
    resposta = cliente.get("/financeiro/mensal")

    assert resposta.status_code == 422


@pytest.mark.parametrize("ano", ["abc", "0", "10000", "2026.5"])
def test_mensal_ano_invalido_retorna_422(cliente, ano):
    resposta = cliente.get("/financeiro/mensal", params={"ano": ano})

    assert resposta.status_code == 422


def test_mensal_precisao_monetaria(cliente):
    cliente.post(
        "/receitas",
        json={
            "descricao": "Cashback",
            "valor": 0.10,
            "categoria": "Outros",
            "data": "2026-03-01",
        },
    )
    cliente.post(
        "/gastos",
        json={
            "descricao": "Balinha",
            "valor": 0.20,
            "categoria": "Outros",
            "data": "2026-03-01",
        },
    )

    meses = cliente.get("/financeiro/mensal", params={"ano": 2026}).json()["meses"]

    assert meses[2] == {"mes": 3, "receitas": 0.1, "despesas": 0.2, "saldo": -0.1}


def test_mensal_considera_primeiro_e_ultimo_dia_do_ano(cliente):
    cliente.post(
        "/receitas",
        json={
            "descricao": "Fim de ano",
            "valor": 10.0,
            "categoria": "Outros",
            "data": "2026-12-31",
        },
    )
    cliente.post(
        "/gastos",
        json={
            "descricao": "Virada",
            "valor": 5.0,
            "categoria": "Outros",
            "data": "2027-01-01",
        },
    )

    meses_2026 = cliente.get("/financeiro/mensal", params={"ano": 2026}).json()["meses"]
    meses_2027 = cliente.get("/financeiro/mensal", params={"ano": 2027}).json()["meses"]

    assert meses_2026[11] == {"mes": 12, "receitas": 10.0, "despesas": 0.0, "saldo": 10.0}
    assert meses_2027[0] == {"mes": 1, "receitas": 0.0, "despesas": 5.0, "saldo": -5.0}

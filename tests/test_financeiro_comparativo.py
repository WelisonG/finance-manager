import pytest


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_comparativo_retorna_ano_e_12_meses_em_ordem(cliente):
    resposta = cliente.get("/financeiro/comparativo", params={"ano": 2026})

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["ano"] == 2026
    assert [mes["mes"] for mes in corpo["meses"]] == list(range(1, 13))


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_comparativo_janeiro_tem_variacoes_nulas(cliente):
    meses = cliente.get("/financeiro/comparativo", params={"ano": 2026}).json()["meses"]

    assert meses[0] == {
        "mes": 1,
        "receitas": 3500.0,
        "despesas": 29.9,
        "saldo": 3470.1,
        "variacao_receitas": None,
        "variacao_despesas": None,
        "variacao_saldo": None,
    }


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_comparativo_variacoes_positivas_e_negativas(cliente):
    meses = cliente.get("/financeiro/comparativo", params={"ano": 2026}).json()["meses"]

    fevereiro = meses[1]
    assert fevereiro["variacao_receitas"] == -10.84
    assert fevereiro["variacao_despesas"] == 1037.12
    assert fevereiro["variacao_saldo"] == -19.87


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_comparativo_mes_sem_movimentacao_apos_mes_com_valor_retorna_menos_cem(cliente):
    meses = cliente.get("/financeiro/comparativo", params={"ano": 2026}).json()["meses"]

    marco = meses[2]
    assert marco["receitas"] == 0.0
    assert marco["despesas"] == 0.0
    assert marco["variacao_receitas"] == -100.0
    assert marco["variacao_despesas"] == -100.0
    assert marco["variacao_saldo"] == -100.0


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_comparativo_anterior_zero_retorna_variacao_nula(cliente):
    meses = cliente.get("/financeiro/comparativo", params={"ano": 2026}).json()["meses"]

    abril = meses[3]
    assert abril == {
        "mes": 4,
        "receitas": 0.0,
        "despesas": 0.0,
        "saldo": 0.0,
        "variacao_receitas": None,
        "variacao_despesas": None,
        "variacao_saldo": None,
    }


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_comparativo_ano_sem_registros_retorna_zeros_e_variacoes_nulas(cliente):
    resposta = cliente.get("/financeiro/comparativo", params={"ano": 2030})

    assert resposta.status_code == 200
    meses = resposta.json()["meses"]
    assert len(meses) == 12
    for mes in meses:
        assert mes["receitas"] == 0.0
        assert mes["despesas"] == 0.0
        assert mes["saldo"] == 0.0
        assert mes["variacao_receitas"] is None
        assert mes["variacao_despesas"] is None
        assert mes["variacao_saldo"] is None


def test_comparativo_sem_ano_retorna_422(cliente):
    resposta = cliente.get("/financeiro/comparativo")

    assert resposta.status_code == 422


@pytest.mark.parametrize("ano", ["abc", "0", "10000", "2026.5"])
def test_comparativo_ano_invalido_retorna_422(cliente, ano):
    resposta = cliente.get("/financeiro/comparativo", params={"ano": ano})

    assert resposta.status_code == 422


def test_comparativo_precisao_monetaria_receitas(cliente):
    cliente.post(
        "/receitas",
        json={
            "descricao": "Cashback março",
            "valor": 0.10,
            "categoria": "Outros",
            "data": "2026-03-01",
        },
    )
    cliente.post(
        "/receitas",
        json={
            "descricao": "Cashback abril",
            "valor": 0.30,
            "categoria": "Outros",
            "data": "2026-04-01",
        },
    )

    meses = cliente.get("/financeiro/comparativo", params={"ano": 2026}).json()["meses"]

    assert meses[3]["receitas"] == 0.3
    assert meses[3]["variacao_receitas"] == 200.0


def test_comparativo_saldo_anterior_negativo_usa_valor_absoluto(cliente):
    cliente.post(
        "/gastos",
        json={
            "descricao": "Conta março",
            "valor": 50.0,
            "categoria": "Outros",
            "data": "2026-03-01",
        },
    )
    cliente.post(
        "/gastos",
        json={
            "descricao": "Conta abril",
            "valor": 50.0,
            "categoria": "Outros",
            "data": "2026-04-01",
        },
    )
    cliente.post(
        "/receitas",
        json={
            "descricao": "Entrada abril",
            "valor": 20.0,
            "categoria": "Outros",
            "data": "2026-04-01",
        },
    )

    meses = cliente.get("/financeiro/comparativo", params={"ano": 2026}).json()["meses"]

    assert meses[2]["saldo"] == -50.0
    assert meses[3]["saldo"] == -30.0
    assert meses[3]["variacao_saldo"] == 40.0
    assert meses[3]["variacao_despesas"] == 0.0

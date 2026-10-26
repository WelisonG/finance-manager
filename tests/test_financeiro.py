import pytest


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_resumo_financeiro_completo(cliente):
    resposta = cliente.get("/financeiro/resumo")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "total_receitas": 6620.5,
        "total_despesas": 369.9,
        "saldo": 6250.6,
    }


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
@pytest.mark.parametrize(
    "params, total_receitas, total_despesas, saldo",
    [
        ({"data_inicio": "2026-02-01"}, 3120.5, 340.0, 2780.5),
        ({"data_fim": "2026-01-15"}, 3000.0, 29.9, 2970.1),
        ({"data_inicio": "2026-01-15", "data_fim": "2026-02-05"}, 3500.0, 44.4, 3455.6),
    ],
)
def test_resumo_financeiro_filtra_por_periodo_inclusivo(
    cliente, params, total_receitas, total_despesas, saldo
):
    resposta = cliente.get("/financeiro/resumo", params=params)

    assert resposta.status_code == 200
    assert resposta.json() == {
        "total_receitas": total_receitas,
        "total_despesas": total_despesas,
        "saldo": saldo,
    }


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_resumo_financeiro_intervalo_invertido_retorna_422(cliente):
    resposta = cliente.get(
        "/financeiro/resumo",
        params={"data_inicio": "2026-02-01", "data_fim": "2026-01-01"},
    )

    assert resposta.status_code == 422


def test_resumo_financeiro_sem_movimentacoes(cliente):
    resposta = cliente.get("/financeiro/resumo")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "total_receitas": 0.0,
        "total_despesas": 0.0,
        "saldo": 0.0,
    }


def test_resumo_financeiro_precisao_monetaria(cliente):
    receita = cliente.post(
        "/receitas",
        json={
            "descricao": "Cashback",
            "valor": 0.10,
            "categoria": "Outros",
            "data": "2026-03-01",
        },
    )
    despesa = cliente.post(
        "/gastos",
        json={
            "descricao": "Balinha",
            "valor": 0.20,
            "categoria": "Outros",
            "data": "2026-03-01",
        },
    )
    assert receita.status_code == 200
    assert despesa.status_code == 200

    resposta = cliente.get("/financeiro/resumo")

    assert resposta.json() == {
        "total_receitas": 0.1,
        "total_despesas": 0.2,
        "saldo": -0.1,
    }

import pytest


@pytest.mark.usefixtures("gastos_iniciais")
def test_resumo_sem_filtros(cliente):
    resposta = cliente.get("/gastos/resumo")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "total": 369.9,
        "quantidade": 4,
        "por_categoria": [
            {"categoria": "Alimentação", "total": 325.5, "quantidade": 2},
            {"categoria": "Lazer", "total": 40.0, "quantidade": 1},
            {"categoria": "Transporte", "total": 4.4, "quantidade": 1},
        ],
    }


@pytest.mark.usefixtures("gastos_iniciais")
@pytest.mark.parametrize(
    "params, total, quantidade",
    [
        ({"data_inicio": "2026-02-01"}, 340.0, 2),
        ({"data_fim": "2026-01-15"}, 29.9, 2),
        ({"data_inicio": "2026-01-15", "data_fim": "2026-02-01"}, 44.4, 2),
    ],
)
def test_resumo_filtra_por_periodo_inclusivo(cliente, params, total, quantidade):
    resposta = cliente.get("/gastos/resumo", params=params)

    assert resposta.status_code == 200
    assert resposta.json()["total"] == total
    assert resposta.json()["quantidade"] == quantidade


@pytest.mark.usefixtures("gastos_iniciais")
def test_resumo_intervalo_invertido_retorna_422(cliente):
    resposta = cliente.get(
        "/gastos/resumo",
        params={"data_inicio": "2026-02-01", "data_fim": "2026-01-01"},
    )

    assert resposta.status_code == 422


def test_resumo_sem_gastos(cliente):
    resposta = cliente.get("/gastos/resumo")

    assert resposta.status_code == 200
    assert resposta.json() == {"total": 0.0, "quantidade": 0, "por_categoria": []}


def test_resumo_soma_centavos_sem_erro_de_ponto_flutuante(cliente):
    for valor in (0.10, 0.20):
        resposta = cliente.post(
            "/gastos",
            json={
                "descricao": "Balinha",
                "valor": valor,
                "categoria": "Outros",
                "data": "2026-03-01",
            },
        )
        assert resposta.status_code == 200

    resposta = cliente.get("/gastos/resumo")

    assert resposta.json()["total"] == 0.3

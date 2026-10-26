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


RECEITA_EDITADA = {
    "descricao": "Salário de janeiro (ajustado)",
    "valor": 3200.0,
    "categoria": "Salário",
    "data": "2026-01-06",
}


@pytest.mark.usefixtures("receitas_iniciais")
def test_edita_receita_existente(cliente):
    resposta = cliente.put("/receitas/1", json=RECEITA_EDITADA)

    assert resposta.status_code == 200
    assert resposta.json() == {
        "mensagem": "Receita atualizada com sucesso!",
        "receita": {
            "id": 1,
            "descricao": "Salário de janeiro (ajustado)",
            "valor": 3200.0,
            "categoria": "Salário",
            "data": "06/01/2026",
        },
    }

    receitas = cliente.get("/receitas").json()
    assert receitas[-1] == {
        "id": 1,
        "descricao": "Salário de janeiro (ajustado)",
        "valor": 3200.0,
        "categoria": "Salário",
        "data": "06/01/2026",
    }


@pytest.mark.usefixtures("receitas_iniciais")
def test_edicao_de_receita_reflete_no_resumo(cliente):
    cliente.put("/receitas/1", json=RECEITA_EDITADA)

    resumo = cliente.get("/receitas/resumo").json()

    assert resumo["total"] == 6820.5
    assert resumo["quantidade"] == 4
    assert resumo["por_categoria"][0] == {
        "categoria": "Salário",
        "total": 6200.0,
        "quantidade": 2,
    }


@pytest.mark.usefixtures("receitas_iniciais")
@pytest.mark.parametrize(
    "campo, valor",
    [
        ("valor", 0),
        ("valor", -5),
        ("descricao", ""),
        ("descricao", "   "),
        ("data", "2026-13-01"),
    ],
)
def test_edicao_de_receita_invalida_retorna_422_sem_alterar(cliente, campo, valor):
    antes = cliente.get("/receitas").json()

    resposta = cliente.put("/receitas/1", json={**RECEITA_EDITADA, campo: valor})

    assert resposta.status_code == 422
    assert cliente.get("/receitas").json() == antes


@pytest.mark.usefixtures("receitas_iniciais")
def test_edicao_de_receita_com_categoria_de_despesa_retorna_422(cliente):
    antes = cliente.get("/receitas").json()

    resposta = cliente.put(
        "/receitas/1",
        json={**RECEITA_EDITADA, "categoria": "Alimentação"},
    )

    assert resposta.status_code == 422
    assert cliente.get("/receitas").json() == antes


@pytest.mark.usefixtures("receitas_iniciais")
def test_editar_receita_id_inexistente_retorna_404(cliente):
    resposta = cliente.put("/receitas/999", json=RECEITA_EDITADA)

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Receita não encontrada"}


@pytest.mark.usefixtures("receitas_iniciais")
def test_exclui_receita_existente(cliente):
    resposta = cliente.delete("/receitas/2")

    assert resposta.status_code == 200
    assert resposta.json() == {"mensagem": "Receita excluída com sucesso!"}
    assert ids(cliente.get("/receitas")) == [4, 3, 1]


@pytest.mark.usefixtures("receitas_iniciais")
def test_excluir_receita_id_inexistente_retorna_404(cliente):
    resposta = cliente.delete("/receitas/999")

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Receita não encontrada"}


@pytest.mark.usefixtures("receitas_iniciais")
def test_exclusao_de_receita_persiste(cliente):
    cliente.delete("/receitas/2")

    assert ids(cliente.get("/receitas")) == [4, 3, 1]
    assert cliente.delete("/receitas/2").status_code == 404


@pytest.mark.usefixtures("receitas_iniciais")
def test_exclusao_de_receita_atualiza_resumo_de_receitas(cliente):
    cliente.delete("/receitas/2")

    resumo = cliente.get("/receitas/resumo").json()

    assert resumo["total"] == 6120.5
    assert resumo["quantidade"] == 3
    assert [item["categoria"] for item in resumo["por_categoria"]] == [
        "Salário",
        "Reembolsos",
    ]


@pytest.mark.usefixtures("gastos_iniciais", "receitas_iniciais")
def test_exclusao_de_receita_atualiza_resumo_financeiro(cliente):
    cliente.delete("/receitas/2")

    resposta = cliente.get("/financeiro/resumo")

    assert resposta.json() == {
        "total_receitas": 6120.5,
        "total_despesas": 369.9,
        "saldo": 5750.6,
    }

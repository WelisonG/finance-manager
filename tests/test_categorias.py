def test_lista_categorias_disponiveis(cliente):
    resposta = cliente.get("/categorias")

    assert resposta.status_code == 200
    assert resposta.json() == [
        "Alimentação",
        "Transporte",
        "Moradia",
        "Saúde",
        "Educação",
        "Lazer",
        "Contas e serviços",
        "Compras",
        "Outros",
    ]

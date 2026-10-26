import sqlite3

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def banco_teste(tmp_path, monkeypatch):
    caminho = tmp_path / "finance_teste.db"
    conectar_original = sqlite3.connect

    def conectar_teste(*args, **kwargs):
        return conectar_original(caminho, **kwargs)

    monkeypatch.setattr(sqlite3, "connect", conectar_teste)

    conexao = conectar_original(caminho)
    conexao.execute("""
        CREATE TABLE IF NOT EXISTS gastos
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT NOT NULL,
        data TEXT NOT NULL)
    """)
    conexao.execute("""
        CREATE TABLE IF NOT EXISTS receitas
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT NOT NULL,
        data TEXT NOT NULL)
    """)
    conexao.commit()
    conexao.close()

    return caminho


@pytest.fixture
def gastos_iniciais(banco_teste):
    gastos = [
        ("Almoço", 25.5, "Alimentação", "2026-01-10"),
        ("Ônibus", 4.4, "Transporte", "2026-01-15"),
        ("Cinema", 40.0, "Lazer", "2026-02-01"),
        ("Mercado", 300.0, "Alimentação", "2026-02-20"),
    ]

    conexao = sqlite3.connect(banco_teste)
    conexao.executemany(
        "INSERT INTO gastos (descricao, valor, categoria, data) VALUES (?, ?, ?, ?)",
        gastos,
    )
    conexao.commit()
    conexao.close()


@pytest.fixture
def receitas_iniciais(banco_teste):
    receitas = [
        ("Salário de janeiro", 3000.0, "Salário", "2026-01-05"),
        ("Freela site", 500.0, "Freelance", "2026-01-20"),
        ("Salário de fevereiro", 3000.0, "Salário", "2026-02-05"),
        ("Reembolso viagem", 120.5, "Reembolsos", "2026-02-18"),
    ]

    conexao = sqlite3.connect(banco_teste)
    conexao.executemany(
        "INSERT INTO receitas (descricao, valor, categoria, data) VALUES (?, ?, ?, ?)",
        receitas,
    )
    conexao.commit()
    conexao.close()


@pytest.fixture
def cliente(banco_teste):
    return TestClient(app)

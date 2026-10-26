import sqlite3


def criar_receita(descricao, valor, categoria, data):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO receitas (descricao, valor, categoria, data)
        VALUES (?, ?, ?, ?)
    """, (descricao, valor, categoria, data))

    connection.commit()

    connection.close()

def listar_receitas(data_inicio=None, data_fim=None):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, descricao, valor, categoria, data FROM receitas
        WHERE (? IS NULL OR data >= ?)
          AND (? IS NULL OR data <= ?)
        ORDER BY data DESC, id DESC
        """, (data_inicio, data_inicio, data_fim, data_fim))

    receitas = cursor.fetchall()

    connection.close()

    return receitas

def buscar_valores_receitas(data_inicio=None, data_fim=None):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT categoria, valor FROM receitas
        WHERE (? IS NULL OR data >= ?)
          AND (? IS NULL OR data <= ?)
        """, (data_inicio, data_inicio, data_fim, data_fim))

    valores = cursor.fetchall()

    connection.close()

    return valores

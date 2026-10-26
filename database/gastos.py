import sqlite3


def criar_gasto(descricao, valor, categoria, data):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO gastos (descricao, valor, categoria, data)
        VALUES (?, ?, ?, ?)
    """, (descricao, valor, categoria, data))

    connection.commit()

    connection.close()

def listar_gastos(categoria=None, data_inicio=None, data_fim=None):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, descricao, valor, categoria, data FROM gastos
        WHERE (? IS NULL OR LOWER(categoria) = LOWER(?))
          AND (? IS NULL OR data >= ?)
          AND (? IS NULL OR data <= ?)
        ORDER BY data DESC, id DESC
        """, (categoria, categoria, data_inicio, data_inicio, data_fim, data_fim))

    gastos = cursor.fetchall()

    connection.close()

    return gastos

def buscar_valores_gastos(data_inicio=None, data_fim=None):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT categoria, valor FROM gastos
        WHERE (? IS NULL OR data >= ?)
          AND (? IS NULL OR data <= ?)
        """, (data_inicio, data_inicio, data_fim, data_fim))

    valores = cursor.fetchall()

    connection.close()

    return valores

def atualizar_gasto(id_gasto, descricao, valor, categoria, data):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        UPDATE gastos
        SET descricao = ?, valor = ?, categoria = ?, data = ?
        WHERE id = ?
    """, (descricao, valor, categoria, data, id_gasto))

    connection.commit()

    atualizado = cursor.rowcount > 0

    connection.close()

    return atualizado

def excluir_gasto(id_gasto):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("DELETE FROM gastos WHERE id = ?", (id_gasto,))

    connection.commit()

    excluido = cursor.rowcount > 0

    connection.close()

    return excluido

def buscar_datas_valores_gastos(data_inicio=None, data_fim=None):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT data, valor FROM gastos
        WHERE (? IS NULL OR data >= ?)
          AND (? IS NULL OR data <= ?)
        """, (data_inicio, data_inicio, data_fim, data_fim))

    valores = cursor.fetchall()

    connection.close()

    return valores

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

def listar_gastos():
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, descricao, valor, categoria, data FROM gastos
        ORDER BY data DESC, id DESC
        """)

    gastos = cursor.fetchall()

    connection.close()

    return gastos

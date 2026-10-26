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

def atualizar_receita(id_receita, descricao, valor, categoria, data):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        UPDATE receitas
        SET descricao = ?, valor = ?, categoria = ?, data = ?
        WHERE id = ?
    """, (descricao, valor, categoria, data, id_receita))

    connection.commit()

    atualizado = cursor.rowcount > 0

    connection.close()

    return atualizado

def excluir_receita(id_receita):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("DELETE FROM receitas WHERE id = ?", (id_receita,))

    connection.commit()

    excluido = cursor.rowcount > 0

    connection.close()

    return excluido

def buscar_datas_valores_receitas(data_inicio=None, data_fim=None):
    connection = sqlite3.connect("finance.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT data, valor FROM receitas
        WHERE (? IS NULL OR data >= ?)
          AND (? IS NULL OR data <= ?)
        """, (data_inicio, data_inicio, data_fim, data_fim))

    valores = cursor.fetchall()

    connection.close()

    return valores

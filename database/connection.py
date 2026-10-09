import sqlite3


connection = sqlite3.connect("finance.db")

cursor = connection.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS gastos
    (id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    categoria TEXT NOT NULL,
    data TEXT NOT NULL
    
    )
""")

connection.commit()


print("Banco de dados e tabela gastos criados!")

connection.close()
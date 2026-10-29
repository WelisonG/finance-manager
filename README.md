# Finance Manager

A full-stack personal finance management application built with **Python, FastAPI, React, TypeScript, and SQLite**.

The project provides a web interface for managing income and expenses, tracking financial balances, and analysing monthly financial performance.

## Features

- Create, view, update, and delete income and expense records.
- Organise financial transactions by category.
- Track total income, expenses, and current balance.
- View monthly financial summaries.
- Compare monthly financial performance and percentage changes.
- Explore financial data through interactive charts.
- Validate input data and handle API errors.
- Access automatically generated API documentation through FastAPI.

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python, FastAPI, Pydantic |
| Frontend | React, TypeScript, Vite |
| Database | SQLite |
| Data Visualisation | Recharts |
| Testing | Pytest, HTTPX |
| Version Control | Git, GitHub |

## Architecture

The application follows a client-server architecture:

**React frontend → FastAPI REST API → SQLite database**

The frontend communicates with the backend through HTTP requests. During local development, Vite proxies API requests to the FastAPI server.

The backend is responsible for request validation, financial calculations, data access, and persistence.

## Getting Started

### Prerequisites

- Python 3
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/WelisonG/finance-manager.git
cd finance-manager
```

### 2. Set up the backend

Create and activate a Python virtual environment.

**Windows (Command Prompt):**

```cmd
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```cmd
python -m pip install -r requirements.txt
```

Start the API:

```cmd
python -m uvicorn main:app --reload
```

The backend will run at:

`http://localhost:8000`

Interactive API documentation:

`http://localhost:8000/docs`

The SQLite database tables are initialised automatically when the application is imported.

### 3. Set up the frontend

Open a second terminal:

```cmd
cd frontend
npm install
npm run dev
```

Open the local address displayed by Vite in your browser (typically `http://localhost:5173`).

Keep the backend running while using the frontend.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/gastos` | List expenses |
| POST | `/gastos` | Create an expense |
| PUT | `/gastos/{id_gasto}` | Update an expense |
| DELETE | `/gastos/{id_gasto}` | Delete an expense |
| GET | `/gastos/resumo` | Expense summary by category |
| GET | `/receitas` | List income records |
| POST | `/receitas` | Create an income record |
| PUT | `/receitas/{id_receita}` | Update an income record |
| DELETE | `/receitas/{id_receita}` | Delete an income record |
| GET | `/receitas/resumo` | Income summary by category |
| GET | `/categorias` | List expense categories |
| GET | `/financeiro/resumo` | Overall financial summary |
| GET | `/financeiro/mensal` | Monthly financial report |
| GET | `/financeiro/comparativo` | Monthly financial comparison |

## Automated Testing

The backend includes automated tests covering financial operations, validation, CRUD functionality, summaries, and reporting endpoints.

To install testing dependencies:

```cmd
python -m pip install -r requirements-dev.txt
```

Run the test suite:

```cmd
python -m pytest -q
```

**Latest verified result: 103 tests passed.**

## Project Status

This is an actively developed portfolio project focused on full-stack development, REST API design, database operations, financial reporting, and automated testing.

## Author

**Welison Pereira Gomes**

[LinkedIn](https://www.linkedin.com/in/welison-pereira-gomes/) | [GitHub](https://github.com/WelisonG)
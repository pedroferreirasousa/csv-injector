from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router

app = FastAPI(
    title="CSV Injector API",
    description="API profissional para tratamento de CSVs e geração de scripts SQL.",
    version="1.0.0"
)

# Configuração obrigatória de CORS para o Next.js (Porta 3000) conseguir consumir a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Injeta a estrutura de rotas inteira com o prefixo global
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "Online", "environment": "Development", "version": "v1"}
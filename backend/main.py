"""OdontoSoft API — Punto de entrada (capa de lógica de negocio)."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers.auth import router as auth_router
from routers.usuarios import router as usuarios_router
from routers.pacientes import router as pacientes_router
from routers.citas import router as citas_router
from routers.historias import router as historias_router
from routers.turnos import router as turnos_router
from routers.odontograma import router as odontograma_router
from routers.estructuras import router as estructuras_router

app = FastAPI(title="OdontoSoft API", version="1.0.0")

# CORS (desarrollo): permite que el frontend consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers de la API
app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(pacientes_router)
app.include_router(citas_router)
app.include_router(historias_router)
app.include_router(turnos_router)
app.include_router(odontograma_router)
app.include_router(estructuras_router)


@app.get("/api")
def root():
    return {"mensaje": "OdontoSoft funcionando"}


FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

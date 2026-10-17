from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.estructuras_service import (
    autocompletar_pacientes, pacientes_ordenados, buscar_en_bst,
    catalogo_procedimientos, grafo_procedimientos, ordenar_plan,
)
from core.security import get_current_user

router = APIRouter(prefix="/estructuras", tags=["Estructuras de datos"])


@router.get("/autocompletar")
def autocompletar(prefijo: str = "", limite: int = 10, user: dict = Depends(get_current_user)):
    return autocompletar_pacientes(prefijo, limite)


@router.get("/pacientes-bst")
def bst(user: dict = Depends(get_current_user)):
    return pacientes_ordenados()


@router.get("/pacientes-bst/buscar")
def bst_buscar(documento: str, user: dict = Depends(get_current_user)):
    return buscar_en_bst(documento)


@router.get("/procedimientos")
def procs(user: dict = Depends(get_current_user)):
    return catalogo_procedimientos()


@router.get("/grafo")
def grafo(user: dict = Depends(get_current_user)):
    return grafo_procedimientos()


class PlanRequest(BaseModel):
    procedimientos: List[str]


@router.post("/plan-orden")
def plan(datos: PlanRequest, user: dict = Depends(get_current_user)):
    return ordenar_plan(datos.procedimientos)

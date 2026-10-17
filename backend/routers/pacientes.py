from fastapi import APIRouter, Depends, HTTPException
from schemas.pacientes_schema import PacienteCreate, PacienteUpdate
from services.pacientes_service import (
    crear_paciente, buscar_pacientes, obtener_paciente, actualizar_paciente,
)
from core.security import get_current_user, requiere_roles

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])
gestion_clinica = requiere_roles("recepcionista", "odontologa")


@router.post("/")
def registrar(
    paciente: PacienteCreate,
    user: dict = Depends(gestion_clinica)
):
    resultado = crear_paciente(paciente)

    if resultado.get("error") == "Falta informacion":
        raise HTTPException(
            status_code=422,
            detail="Todos los campos obligatorios deben ser diligenciados"
        )

    if resultado.get("error") == "documento_duplicado":
        raise HTTPException(
            status_code=409,
            detail="Documento ya registrado"
        )

    return resultado

@router.get("/")
def listar(q: str = "", user: dict = Depends(get_current_user)):
    return buscar_pacientes(q)


@router.get("/{paciente_id}")
def ficha(paciente_id: str, user: dict = Depends(get_current_user)):
    p = obtener_paciente(paciente_id)
    if not p:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return p


@router.put("/{paciente_id}")
def actualizar(paciente_id: str, cambios: PacienteUpdate, user: dict = Depends(gestion_clinica)):
    return actualizar_paciente(paciente_id, cambios)


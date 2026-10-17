from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.turnos_service import (
    encolar_turno, llamar_siguiente, finalizar_atencion, estado_cola,
)
from core.security import get_current_user, requiere_roles

router = APIRouter(prefix="/turnos", tags=["Turnos — Cola (FIFO)"])
gestion = requiere_roles("recepcionista", "odontologa")


class EncolarRequest(BaseModel):
    paciente_id: str


@router.get("/")
def ver_cola(user: dict = Depends(get_current_user)):
    return estado_cola()


@router.post("/encolar")
def encolar(datos: EncolarRequest, user: dict = Depends(gestion)):
    r = encolar_turno(datos.paciente_id)
    if r.get("error") == "paciente_no_encontrado":
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return r


@router.post("/siguiente")
def siguiente(user: dict = Depends(gestion)):
    r = llamar_siguiente()
    if r.get("error") == "cola_vacia":
        raise HTTPException(status_code=404, detail="No hay pacientes en espera")
    return r


@router.put("/{turno_id}/finalizar")
def finalizar(turno_id: str, user: dict = Depends(gestion)):
    return finalizar_atencion(turno_id)

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.odontograma_service import obtener_estado, aplicar_cambio, deshacer
from core.security import requiere_roles

router = APIRouter(prefix="/odontograma", tags=["Odontograma — Pila (Deshacer)"])
solo_odontologa = requiere_roles("odontologa")


class CambioRequest(BaseModel):
    diente: str
    estado: str


@router.get("/{paciente_id}")
def estado(paciente_id: str, user: dict = Depends(solo_odontologa)):
    r = obtener_estado(paciente_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Historia no encontrada")
    return r


@router.post("/{paciente_id}/cambio")
def cambio(paciente_id: str, datos: CambioRequest, user: dict = Depends(solo_odontologa)):
    r = aplicar_cambio(paciente_id, datos.diente, datos.estado)
    if r.get("error"):
        raise HTTPException(status_code=404, detail="Historia no encontrada")
    return r


@router.post("/{paciente_id}/deshacer")
def undo(paciente_id: str, user: dict = Depends(solo_odontologa)):
    r = deshacer(paciente_id)
    if r.get("error") == "historia_no_encontrada":
        raise HTTPException(status_code=404, detail="Historia no encontrada")
    if r.get("error") == "nada_que_deshacer":
        raise HTTPException(status_code=400, detail="No hay cambios para deshacer")
    return r

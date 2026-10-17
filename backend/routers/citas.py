from fastapi import APIRouter, Depends, HTTPException
from schemas.citas_schema import CitaCreate, CitaReprogramar, CitaCancelar
from services.citas_service import (
    crear_cita, listar_citas, cancelar_cita, reprogramar_cita,
)
from core.security import get_current_user, requiere_roles

router = APIRouter(prefix="/citas", tags=["Citas"])
gestion = requiere_roles("recepcionista", "odontologa")


@router.post("/")
def crear(cita: CitaCreate, user: dict = Depends(gestion)):
    resultado = crear_cita(cita)
    if resultado.get("error") == "paciente_no_encontrado":
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    if resultado.get("error") == "horario_no_disponible":
        raise HTTPException(status_code=409, detail="Horario no disponible")
    return resultado


@router.get("/")
def listar(fecha: str = "", user: dict = Depends(get_current_user)):
    return listar_citas(fecha or None)


@router.put("/{cita_id}/cancelar")
def cancelar(cita_id: str, datos: CitaCancelar, user: dict = Depends(gestion)):
    return cancelar_cita(cita_id, datos.motivo)


@router.put("/{cita_id}")
def reprogramar(cita_id: str, datos: CitaReprogramar, user: dict = Depends(gestion)):
    resultado = reprogramar_cita(cita_id, datos.fecha, datos.hora)
    if resultado.get("error") == "horario_no_disponible":
        raise HTTPException(status_code=409, detail="Horario no disponible")
    return resultado

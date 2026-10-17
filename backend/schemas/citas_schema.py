from pydantic import BaseModel
from typing import Optional


class CitaCreate(BaseModel):
    paciente_id: str
    fecha: str   # YYYY-MM-DD
    hora: str    # HH:MM
    motivo: str
    profesional: Optional[str] = "Odontóloga"


class CitaReprogramar(BaseModel):
    fecha: str
    hora: str


class CitaCancelar(BaseModel):
    motivo: Optional[str] = ""

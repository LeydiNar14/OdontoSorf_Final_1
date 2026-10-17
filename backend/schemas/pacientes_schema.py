from pydantic import BaseModel
from typing import Optional


class PacienteCreate(BaseModel):
    nombres: str
    apellidos: str
    tipo_documento: str = "CC"
    documento: str
    fecha_nacimiento: Optional[str] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    acudiente: Optional[str] = None
    eps: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None


class PacienteUpdate(BaseModel):
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    eps: Optional[str] = None
    alergias: Optional[str] = None

from pydantic import BaseModel, Field
from typing import Optional, Dict


class ValoracionCreate(BaseModel):
    motivo: str
    anamnesis: Optional[str] = ""
    odontograma: Dict[str, str] = Field(default_factory=dict)
    observaciones: Optional[str] = ""


class ProcedimientoCreate(BaseModel):
    diente: str
    tratamiento: str
    estado: str = "Pendiente"
    observaciones: Optional[str] = ""


class EstadoUpdate(BaseModel):
    estado: str


class AntecedentesUpdate(BaseModel):
    enfermedades: Optional[str] = ""
    medicamentos: Optional[str] = ""
    alergias: Optional[str] = ""
    cirugias: Optional[str] = ""

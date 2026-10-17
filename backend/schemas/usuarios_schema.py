from pydantic import BaseModel, EmailStr
from typing import Optional


class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    rol: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None


class RolUpdate(BaseModel):
    rol: str


class UsuarioResponse(BaseModel):
    id: Optional[str]
    nombre: str
    correo: str
    rol: str
    activo: bool = True

"""Lógica de autenticación."""
from core.database import db
from core.security import verify_password, crear_token
from models.usuario import COLLECTION

usuarios = db[COLLECTION]


def autenticar(correo: str, password: str) -> dict:
    usuario = usuarios.find_one({"correo": correo})
    if not usuario:
        return {"error": "credenciales"}
    if not usuario.get("activo", True):
        return {"error": "desactivada"}
    if not verify_password(password, usuario["password"]):
        return {"error": "credenciales"}

    token = crear_token({
        "sub": usuario["correo"],
        "rol": usuario["rol"],
        "nombre": usuario["nombre"],
        "id": str(usuario["_id"]),
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": usuario["rol"],
        "nombre": usuario["nombre"],
    }

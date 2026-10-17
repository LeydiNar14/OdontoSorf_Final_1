"""Lógica del módulo de Administración de usuarios (RF-16)."""
from core.database import db
from core.security import hash_password
from models.usuario import COLLECTION
from utils.helpers import to_oid

usuarios = db[COLLECTION]


def _serializar(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "nombre": u["nombre"],
        "correo": u["correo"],
        "rol": u["rol"],
        "activo": u.get("activo", True),
    }


def crear_usuario(usuario) -> dict:
    data = usuario.dict()
    if usuarios.find_one({"correo": data["correo"]}):
        return {"error": "correo_duplicado"}
    data["password"] = hash_password(data["password"])
    data["activo"] = True
    resultado = usuarios.insert_one(data)
    return {"id": str(resultado.inserted_id), "mensaje": "Usuario creado correctamente"}


def listar_usuarios() -> list:
    return [_serializar(u) for u in usuarios.find()]


def obtener_usuario(id_usuario: str):
    oid = to_oid(id_usuario)
    usuario = usuarios.find_one({"_id": oid}) if oid else None
    return _serializar(usuario) if usuario else None


def actualizar_usuario(id_usuario: str, cambios) -> dict:
    oid = to_oid(id_usuario)
    upd = {k: v for k, v in cambios.dict().items() if v is not None}
    if oid and upd:
        usuarios.update_one({"_id": oid}, {"$set": upd})
    return {"mensaje": "Usuario actualizado"}


def cambiar_rol(id_usuario: str, rol: str) -> dict:
    oid = to_oid(id_usuario)
    if oid:
        usuarios.update_one({"_id": oid}, {"$set": {"rol": rol}})
    return {"mensaje": "Rol actualizado"}


def desactivar_usuario(id_usuario: str) -> dict:
    oid = to_oid(id_usuario)
    if oid:
        usuarios.update_one({"_id": oid}, {"$set": {"activo": False}})
    return {"mensaje": "Usuario desactivado"}

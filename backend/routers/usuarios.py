from fastapi import APIRouter, Depends, HTTPException
from schemas.usuarios_schema import UsuarioCreate, UsuarioUpdate, RolUpdate
from services.usuarios_service import (
    crear_usuario, listar_usuarios, obtener_usuario,
    actualizar_usuario, cambiar_rol, desactivar_usuario,
)
from core.security import requiere_roles

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])
solo_admin = requiere_roles("administrador")


@router.post("/")
def registrar_usuario(usuario: UsuarioCreate, user: dict = Depends(solo_admin)):
    resultado = crear_usuario(usuario)
    if resultado.get("error") == "correo_duplicado":
        raise HTTPException(status_code=409, detail="El correo ya está registrado")
    return resultado


@router.get("/")
def obtener_usuarios(user: dict = Depends(solo_admin)):
    return listar_usuarios()


@router.get("/{id_usuario}")
def obtener_usuario_por_id(id_usuario: str, user: dict = Depends(solo_admin)):
    u = obtener_usuario(id_usuario)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return u


@router.put("/{id_usuario}")
def editar_usuario(id_usuario: str, cambios: UsuarioUpdate, user: dict = Depends(solo_admin)):
    return actualizar_usuario(id_usuario, cambios)


@router.put("/{id_usuario}/rol")
def asignar_rol(id_usuario: str, datos: RolUpdate, user: dict = Depends(solo_admin)):
    return cambiar_rol(id_usuario, datos.rol)


@router.put("/{id_usuario}/desactivar")
def desactivar(id_usuario: str, user: dict = Depends(solo_admin)):
    return desactivar_usuario(id_usuario)

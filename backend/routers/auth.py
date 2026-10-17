from fastapi import APIRouter, HTTPException, Depends
from schemas.auth_schema import LoginRequest
from services.auth_service import autenticar
from core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(datos: LoginRequest):
    resultado = autenticar(datos.correo, datos.password)
    if resultado.get("error") == "credenciales":
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if resultado.get("error") == "desactivada":
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    return resultado


@router.get("/me")
def usuario_actual(user: dict = Depends(get_current_user)):
    return user

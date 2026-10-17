from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from schemas.historias_schema import (
    ValoracionCreate, ProcedimientoCreate, EstadoUpdate, AntecedentesUpdate,
)
from services.historias_service import (
    obtener_historia, agregar_valoracion, actualizar_antecedentes,
    agregar_procedimiento, actualizar_procedimiento, guardar_archivo, leer_archivo,
)
from core.security import get_current_user, requiere_roles
from utils.validators import formato_archivo_valido, tamano_archivo_valido

router = APIRouter(prefix="/historias", tags=["Historia Clínica"])
solo_odontologa = requiere_roles("odontologa")


@router.get("/{paciente_id}")
def ver(paciente_id: str, user: dict = Depends(get_current_user)):
    h = obtener_historia(paciente_id)
    if not h:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    return h


@router.post("/{paciente_id}/valoraciones")
def nueva_valoracion(paciente_id: str, datos: ValoracionCreate, user: dict = Depends(solo_odontologa)):
    resultado = agregar_valoracion(paciente_id, datos)
    if resultado.get("error"):
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    return resultado


@router.put("/{paciente_id}/antecedentes")
def antecedentes(paciente_id: str, datos: AntecedentesUpdate, user: dict = Depends(solo_odontologa)):
    return actualizar_antecedentes(paciente_id, datos)


@router.post("/{paciente_id}/tratamiento")
def nuevo_procedimiento(paciente_id: str, datos: ProcedimientoCreate, user: dict = Depends(solo_odontologa)):
    return agregar_procedimiento(paciente_id, datos)


@router.put("/{paciente_id}/tratamiento/{proc_id}")
def actualizar_proc(paciente_id: str, proc_id: str, datos: EstadoUpdate, user: dict = Depends(solo_odontologa)):
    return actualizar_procedimiento(paciente_id, proc_id, datos.estado)


@router.post("/{paciente_id}/valoraciones/{val_id}/archivos")
async def subir_archivo(paciente_id: str, val_id: str,
                        archivo: UploadFile = File(...), tipo: str = Form("radiografía"),
                        user: dict = Depends(solo_odontologa)):
    contenido = await archivo.read()
    if not formato_archivo_valido(archivo.content_type):
        raise HTTPException(status_code=422, detail="Formato no permitido (solo JPG, PNG o PDF)")
    if not tamano_archivo_valido(len(contenido)):
        raise HTTPException(status_code=422, detail="El archivo supera el tamaño máximo de 10 MB")
    return guardar_archivo(paciente_id, val_id, archivo.filename, contenido, archivo.content_type, tipo)


@router.get("/archivos/{file_id}")
def descargar_archivo(file_id: str, user: dict = Depends(get_current_user)):
    resultado = leer_archivo(file_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    contenido, content_type, filename = resultado
    return Response(content=contenido, media_type=content_type,
                    headers={"Content-Disposition": f'inline; filename="{filename}"'})

"""Lógica del módulo de Historia Clínica (RF-10 a RF-15), con odontograma y adjuntos en GridFS."""
from datetime import datetime, timezone
from bson import ObjectId
import gridfs
from core.database import db
from models.historia import COLLECTION
from utils.helpers import to_oid

historias = db[COLLECTION]
fs = gridfs.GridFS(db)


def _ahora() -> str:
    return datetime.now(timezone.utc).isoformat()


def obtener_historia(paciente_id: str):
    h = historias.find_one({"paciente_id": paciente_id})
    if not h:
        return None
    h["id"] = str(h["_id"])
    del h["_id"]
    # Hilo cronológico: la valoración más reciente primero (RF-15)
    h["valoraciones"] = sorted(
        h.get("valoraciones", []), key=lambda v: v.get("fecha", ""), reverse=True
    )
    return h


def agregar_valoracion(paciente_id: str, data) -> dict:
    h = historias.find_one({"paciente_id": paciente_id})
    if not h:
        return {"error": "historia_no_encontrada"}

    valoracion = {
        "id": str(ObjectId()),
        "fecha": _ahora(),                 # marca de tiempo del servidor
        "motivo": data.motivo,
        "anamnesis": data.anamnesis,
        "odontograma": data.odontograma,   # { "11": "caries", "37": "ausente", ... }
        "observaciones": data.observaciones,
        "archivos": [],
        "confirmada": True,                # entrada inmutable
    }
    historias.update_one({"paciente_id": paciente_id}, {"$push": {"valoraciones": valoracion}})
    return {"id": valoracion["id"], "fecha": valoracion["fecha"], "mensaje": "Valoración registrada"}


def actualizar_antecedentes(paciente_id: str, data) -> dict:
    historias.update_one({"paciente_id": paciente_id}, {"$set": {"antecedentes": data.dict()}})
    return {"mensaje": "Antecedentes actualizados"}


def agregar_procedimiento(paciente_id: str, data) -> dict:
    proc = {
        "id": str(ObjectId()),
        "diente": data.diente,
        "tratamiento": data.tratamiento,
        "estado": data.estado,
        "observaciones": data.observaciones,
        "fecha": _ahora(),
    }
    historias.update_one({"paciente_id": paciente_id}, {"$push": {"plan_tratamiento": proc}})
    return {"id": proc["id"], "mensaje": "Procedimiento agregado al plan"}


def actualizar_procedimiento(paciente_id: str, proc_id: str, estado: str) -> dict:
    historias.update_one(
        {"paciente_id": paciente_id, "plan_tratamiento.id": proc_id},
        {"$set": {"plan_tratamiento.$.estado": estado, "plan_tratamiento.$.fecha_cambio": _ahora()}},
    )
    return {"mensaje": "Procedimiento actualizado"}


def guardar_archivo(paciente_id: str, val_id: str, filename: str, contenido: bytes,
                    content_type: str, tipo: str) -> dict:
    file_id = fs.put(contenido, filename=filename, content_type=content_type, paciente_id=paciente_id)
    referencia = {
        "file_id": str(file_id),
        "filename": filename,
        "content_type": content_type,
        "tipo": tipo,
        "fecha": _ahora(),
    }
    historias.update_one(
        {"paciente_id": paciente_id, "valoraciones.id": val_id},
        {"$push": {"valoraciones.$.archivos": referencia}},
    )
    return {"file_id": str(file_id), "mensaje": "Archivo adjuntado"}


def leer_archivo(file_id: str):
    oid = to_oid(file_id)
    if not oid or not fs.exists(oid):
        return None
    archivo = fs.get(oid)
    return archivo.read(), (archivo.content_type or "application/octet-stream"), archivo.filename

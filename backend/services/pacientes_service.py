"""Lógica del módulo de Gestión de Pacientes (RF-04, RF-05, RF-06)."""
import re
from datetime import datetime, timezone
from core.database import db
from models.paciente import COLLECTION
from models.historia import COLLECTION as HISTORIAS
from utils.helpers import to_oid

pacientes = db[COLLECTION]
historias = db[HISTORIAS]


def _serializar(p: dict) -> dict:
    p["id"] = str(p["_id"])
    del p["_id"]
    return p


def crear_paciente(data) -> dict:
    d = data.dict()
    if pacientes.find_one({"documento": d["documento"]}):
        return {"error": "documento_duplicado"}

    resultado = pacientes.insert_one(d)
    paciente_id = str(resultado.inserted_id)

    # Apertura automática de la historia clínica (RF-10)
    historias.insert_one({
        "paciente_id": paciente_id,
        "paciente_nombre": f"{d['nombres']} {d['apellidos']}",
        "fecha_apertura": datetime.now(timezone.utc).isoformat(),
        "antecedentes": {},
        "valoraciones": [],
        "plan_tratamiento": [],
    })
    return {"id": paciente_id, "mensaje": "Paciente registrado e historia clínica creada"}


def buscar_pacientes(q: str = "") -> list:
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        filtro = {"$or": [{"nombres": rx}, {"apellidos": rx}, {"documento": rx}]}
    else:
        filtro = {}
    return [_serializar(p) for p in pacientes.find(filtro)]


def obtener_paciente(paciente_id: str):
    oid = to_oid(paciente_id)
    paciente = pacientes.find_one({"_id": oid}) if oid else None
    return _serializar(paciente) if paciente else None


def actualizar_paciente(paciente_id: str, cambios) -> dict:
    oid = to_oid(paciente_id)
    upd = {k: v for k, v in cambios.dict().items() if v is not None}
    if oid and upd:
        pacientes.update_one({"_id": oid}, {"$set": upd})
    return {"mensaje": "Datos del paciente actualizados"}



"""Lógica del módulo de Agendamiento de Citas (RF-07, RF-08, RF-09)."""
from core.database import db
from models.cita import COLLECTION
from models.paciente import COLLECTION as PACIENTES
from utils.helpers import to_oid

citas = db[COLLECTION]
pacientes = db[PACIENTES]


def _serializar(c: dict) -> dict:
    c["id"] = str(c["_id"])
    del c["_id"]
    return c


def crear_cita(data) -> dict:
    oid = to_oid(data.paciente_id)
    paciente = pacientes.find_one({"_id": oid}) if oid else None
    if not paciente:
        return {"error": "paciente_no_encontrado"}

    # Verificación de disponibilidad de horario
    ocupado = citas.find_one({"fecha": data.fecha, "hora": data.hora, "estado": {"$ne": "Cancelada"}})
    if ocupado:
        return {"error": "horario_no_disponible"}

    doc = data.dict()
    doc["paciente_nombre"] = f"{paciente['nombres']} {paciente['apellidos']}"
    doc["estado"] = "Pendiente"
    resultado = citas.insert_one(doc)
    return {"id": str(resultado.inserted_id), "mensaje": "Cita agendada"}


def listar_citas(fecha: str = None) -> list:
    filtro = {"fecha": fecha} if fecha else {}
    resultado = [_serializar(c) for c in citas.find(filtro)]
    return sorted(resultado, key=lambda x: (x.get("fecha", ""), x.get("hora", "")))


def cancelar_cita(cita_id: str, motivo: str) -> dict:
    oid = to_oid(cita_id)
    if not oid:
        return {"error": "no_encontrada"}
    citas.update_one({"_id": oid}, {"$set": {"estado": "Cancelada", "motivo_cancelacion": motivo}})
    return {"mensaje": "Cita cancelada"}


def reprogramar_cita(cita_id: str, fecha: str, hora: str) -> dict:
    oid = to_oid(cita_id)
    if not oid:
        return {"error": "no_encontrada"}
    ocupado = citas.find_one({"fecha": fecha, "hora": hora, "estado": {"$ne": "Cancelada"}, "_id": {"$ne": oid}})
    if ocupado:
        return {"error": "horario_no_disponible"}
    citas.update_one({"_id": oid}, {"$set": {"fecha": fecha, "hora": hora, "estado": "Pendiente"}})
    return {"mensaje": "Cita reprogramada"}

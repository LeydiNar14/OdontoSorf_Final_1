"""
Servicio de Turnos — usa la estructura COLA (FIFO).

Modela la sala de espera: los pacientes se atienden en el orden en que llegan.
Los turnos se persisten en la colección `turnos` de MongoDB; para decidir el
siguiente a atender se reconstruye una Cola y se aplica desencolar() (FIFO).
"""
from datetime import datetime, timezone
from core.database import db
from estructuras.cola import Cola
from utils.helpers import to_oid

turnos = db["turnos"]
pacientes = db["pacientes"]


def _ahora():
    return datetime.now(timezone.utc).isoformat()


def _serializar(t):
    if not t:
        return None
    return {
        "id": str(t["_id"]),
        "paciente_id": t.get("paciente_id"),
        "paciente_nombre": t.get("paciente_nombre"),
        "orden": t.get("orden"),
        "estado": t.get("estado"),
        "creado": t.get("creado"),
    }


def _cola_en_espera():
    """Reconstruye la Cola FIFO a partir de MongoDB (ordenada por llegada)."""
    cola = Cola()
    for t in turnos.find({"estado": "en_espera"}).sort("orden", 1):
        cola.encolar(t)
    return cola


def encolar_turno(paciente_id):
    oid = to_oid(paciente_id)
    paciente = pacientes.find_one({"_id": oid}) if oid else None
    if not paciente:
        return {"error": "paciente_no_encontrado"}
    ultimo = turnos.find_one(sort=[("orden", -1)])
    orden = (ultimo["orden"] + 1) if ultimo else 1
    doc = {
        "paciente_id": paciente_id,
        "paciente_nombre": f"{paciente['nombres']} {paciente['apellidos']}",
        "orden": orden,
        "estado": "en_espera",
        "creado": _ahora(),
    }
    res = turnos.insert_one(doc)
    return {"id": str(res.inserted_id), "orden": orden,
            "mensaje": "Paciente agregado a la sala de espera"}


def llamar_siguiente():
    """Atiende al primero de la cola (FIFO) usando Cola.desencolar()."""
    cola = _cola_en_espera()
    if cola.esta_vacia():
        return {"error": "cola_vacia"}
    turno = cola.desencolar()
    turnos.update_one({"_id": turno["_id"]},
                      {"$set": {"estado": "en_atencion", "llamado": _ahora()}})
    return {"turno": _serializar(turno),
            "mensaje": f"Llamando a {turno['paciente_nombre']}"}


def finalizar_atencion(turno_id):
    oid = to_oid(turno_id)
    if oid:
        turnos.update_one({"_id": oid},
                          {"$set": {"estado": "atendido", "finalizado": _ahora()}})
    return {"mensaje": "Atención finalizada"}


def estado_cola():
    cola = _cola_en_espera()
    return {
        "en_espera": [_serializar(t) for t in cola.a_lista()],
        "en_atencion": [_serializar(t) for t in turnos.find({"estado": "en_atencion"}).sort("orden", 1)],
        "total_en_espera": len(cola),
        "siguiente": _serializar(cola.frente()),
    }

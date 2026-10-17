"""
Servicio de edición del odontograma — usa la estructura PILA (LIFO).

Permite modificar el odontograma "de trabajo" de un paciente diente por diente
y DESHACER (undo) el último cambio. Cada cambio se apila; deshacer retira la
cima de la pila (Last In, First Out) y revierte el diente a su estado anterior.
La pila se persiste en el documento de la historia (campo `pila_deshacer`).
"""
from datetime import datetime, timezone
from core.database import db
from estructuras.pila import Pila

historias = db["historias"]


def _ahora():
    return datetime.now(timezone.utc).isoformat()


def _historia(paciente_id):
    return historias.find_one({"paciente_id": paciente_id})


def _pila_desde(hist):
    """Carga el array almacenado (base->cima) en una Pila."""
    pila = Pila()
    for cambio in hist.get("pila_deshacer", []):
        pila.apilar(cambio)
    return pila


def obtener_estado(paciente_id):
    h = _historia(paciente_id)
    if not h:
        return None
    pila = _pila_desde(h)
    return {
        "paciente_id": paciente_id,
        "odontograma_actual": h.get("odontograma_actual", {}),
        "pila_deshacer": pila.a_lista(),      # cima primero
        "profundidad_pila": len(pila),
        "puede_deshacer": not pila.esta_vacia(),
    }


def aplicar_cambio(paciente_id, diente, nuevo_estado):
    h = _historia(paciente_id)
    if not h:
        return {"error": "historia_no_encontrada"}
    diente = str(diente)
    anterior = (h.get("odontograma_actual") or {}).get(diente, "sano")
    cambio = {"diente": diente, "anterior": anterior,
              "nuevo": nuevo_estado, "fecha": _ahora()}
    historias.update_one(
        {"paciente_id": paciente_id},
        {"$set": {f"odontograma_actual.{diente}": nuevo_estado},
         "$push": {"pila_deshacer": cambio}},
    )
    return {"mensaje": f"Diente {diente}: {anterior} -> {nuevo_estado}", "cambio": cambio}


def deshacer(paciente_id):
    h = _historia(paciente_id)
    if not h:
        return {"error": "historia_no_encontrada"}
    pila = _pila_desde(h)
    if pila.esta_vacia():
        return {"error": "nada_que_deshacer"}
    cambio = pila.desapilar()   # LIFO: el último cambio aplicado
    historias.update_one(
        {"paciente_id": paciente_id},
        {"$set": {f"odontograma_actual.{cambio['diente']}": cambio["anterior"]},
         "$pop": {"pila_deshacer": 1}},   # quita la cima del array
    )
    return {"mensaje": f"Deshecho: diente {cambio['diente']} vuelve a '{cambio['anterior']}'",
            "cambio_revertido": cambio}

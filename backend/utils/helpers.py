"""Funciones auxiliares."""
from bson import ObjectId
from bson.errors import InvalidId


def to_oid(value):
    """Convierte un string a ObjectId de forma segura; retorna None si es inválido."""
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError, ValueError):
        return None

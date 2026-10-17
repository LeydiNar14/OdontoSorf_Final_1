"""
Carga SOLO el catálogo de procedimientos (para el grafo de dependencias).
NO borra usuarios, pacientes, citas ni historias: es seguro ejecutarlo
sobre una base que ya tiene datos.

Uso (desde la carpeta backend, con el mismo .env que usa la app):
    python cargar_procedimientos.py
"""
from core.database import db

PROCEDIMIENTOS = [
    {"codigo": "PROF", "nombre": "Profilaxis (limpieza)", "requiere": []},
    {"codigo": "CTRL", "nombre": "Control de placa", "requiere": ["PROF"]},
    {"codigo": "BLAN", "nombre": "Blanqueamiento", "requiere": ["PROF"]},
    {"codigo": "RESI", "nombre": "Obturación en resina", "requiere": []},
    {"codigo": "ENDO", "nombre": "Endodoncia", "requiere": ["RESI"]},
    {"codigo": "CORO", "nombre": "Corona", "requiere": ["ENDO"]},
    {"codigo": "CIRP", "nombre": "Cirugía periodontal", "requiere": ["CTRL"]},
    {"codigo": "EXOD", "nombre": "Exodoncia (extracción)", "requiere": []},
    {"codigo": "IMPL", "nombre": "Implante", "requiere": ["EXOD"]},
    {"codigo": "ORTO", "nombre": "Ortodoncia", "requiere": ["CTRL"]},
]


def cargar():
    col = db["procedimientos"]
    creados = 0
    for proc in PROCEDIMIENTOS:
        # upsert por 'codigo': crea si no existe, no duplica si ya está
        res = col.update_one({"codigo": proc["codigo"]}, {"$set": proc}, upsert=True)
        if res.upserted_id is not None:
            creados += 1
    total = col.count_documents({})
    print(f"✓ Catálogo de procedimientos listo. Nuevos: {creados}. Total en la base: {total}.")


if __name__ == "__main__":
    cargar()

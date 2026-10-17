"""
Carga de datos iniciales de OdontoSoft.
Crea los usuarios (3 roles), 3 pacientes con su historia clínica, un odontograma
de ejemplo y algunas citas. Ejecutar una sola vez:  python seed.py
"""
from datetime import datetime, timezone, timedelta
from core.database import db
from core.security import hash_password

# --- Dientes permanentes (notación FDI) por cuadrante ---
CUADRANTES = {
    "Superior derecho": [18, 17, 16, 15, 14, 13, 12, 11],
    "Superior izquierdo": [21, 22, 23, 24, 25, 26, 27, 28],
    "Inferior izquierdo": [38, 37, 36, 35, 34, 33, 32, 31],
    "Inferior derecho": [41, 42, 43, 44, 45, 46, 47, 48],
}
TODOS_LOS_DIENTES = [d for grupo in CUADRANTES.values() for d in grupo]


def odontograma_base():
    """Todos los dientes 'sano' por defecto."""
    return {str(d): "sano" for d in TODOS_LOS_DIENTES}


def fecha(dias=0):
    return (datetime.now(timezone.utc) + timedelta(days=dias)).strftime("%Y-%m-%d")


def iso(dias=0):
    return (datetime.now(timezone.utc) + timedelta(days=dias)).isoformat()


def seed():
    # Limpiar colecciones (entorno de demostración)
    for c in ["usuarios", "pacientes", "citas", "historias", "turnos", "procedimientos"]:
        db[c].delete_many({})

    # ---------------- USUARIOS (3 roles) ----------------
    db["usuarios"].insert_many([
        {"nombre": "Dra. jenny somer", "correo": "odontologa@odontosoft.com",
         "password": hash_password("Odonto123"), "rol": "odontologa", "activo": True},
        {"nombre": "Ana Recepción", "correo": "recepcion@odontosoft.com",
         "password": hash_password("Recepcion123"), "rol": "recepcionista", "activo": True},
        {"nombre": "Admin Sistema", "correo": "admin@odontosoft.com",
         "password": hash_password("Admin123"), "rol": "administrador", "activo": True},
    ])

    # ---------------- PACIENTES (3) ----------------
    pacientes = [
        {"nombres": "María Fernanda", "apellidos": "López Ríos", "tipo_documento": "CC",
         "documento": "1006148034", "fecha_nacimiento": "1995-04-12", "genero": "Femenino",
         "telefono": "3104567890", "correo": "mafe.lopez@correo.com", "direccion": "Cra 45 #12-30",
         "acudiente": "", "eps": "Sura", "grupo_sanguineo": "O+", "alergias": "Penicilina"},
        {"nombres": "Carlos Andrés", "apellidos": "Ramírez Pérez", "tipo_documento": "CC",
         "documento": "1122334455", "fecha_nacimiento": "1988-09-23", "genero": "Masculino",
         "telefono": "3209876543", "correo": "carlos.ramirez@correo.com", "direccion": "Calle 9 #8-15",
         "acudiente": "", "eps": "Nueva EPS", "grupo_sanguineo": "A+", "alergias": "Ninguna"},
        {"nombres": "Sofía Valentina", "apellidos": "Torres Mejía", "tipo_documento": "TI",
         "documento": "1098765432", "fecha_nacimiento": "2012-01-30", "genero": "Femenino",
         "telefono": "3001112233", "correo": "", "direccion": "Av. Las Palmas #100-20",
         "acudiente": "Marta Mejía (madre)", "eps": "Coomeva", "grupo_sanguineo": "B+", "alergias": "Ninguna"},
    ]
    resultado = db["pacientes"].insert_many(pacientes)
    ids = [str(_id) for _id in resultado.inserted_ids]

    # ---------------- HISTORIAS CLÍNICAS ----------------
    # Paciente 1: odontograma con hallazgos (basado en el odontograma físico de referencia)
    odon = odontograma_base()
    for d in ["17", "16", "27", "25", "24", "22", "35", "45", "46", "47"]:
        odon[d] = "caries"
    odon["36"] = "obturado"
    for d in ["37", "38", "48"]:
        odon[d] = "ausente"

    historia_1 = {
        "paciente_id": ids[0],
        "paciente_nombre": "María Fernanda López Ríos",
        "fecha_apertura": iso(-20),
        "antecedentes": {
            "enfermedades": "Ninguna relevante", "medicamentos": "Ninguno",
            "alergias": "Penicilina", "cirugias": "Ninguna",
        },
        "valoraciones": [{
            "id": "val-seed-0001",
            "fecha": iso(-3),
            "motivo": "Valoración inicial y limpieza",
            "anamnesis": "Paciente refiere sensibilidad en molares superiores.",
            "odontograma": odon,
            "observaciones": "Se observan caries oclusales en varios molares. Se programa plan de tratamiento.",
            "archivos": [],
            "confirmada": True,
        }],
        "plan_tratamiento": [
            {"id": "proc-seed-01", "diente": "16", "tratamiento": "Resina por caries oclusal",
             "estado": "Pendiente", "observaciones": "", "fecha": iso(-3)},
            {"id": "proc-seed-02", "diente": "46", "tratamiento": "Resina por caries oclusal",
             "estado": "En proceso", "observaciones": "", "fecha": iso(-3)},
            {"id": "proc-seed-03", "diente": "37", "tratamiento": "Valoración para prótesis (diente ausente)",
             "estado": "Pendiente", "observaciones": "", "fecha": iso(-3)},
        ],
        # Odontograma "de trabajo" editable + pila de deshacer (estructura Pila)
        "odontograma_actual": dict(odon),
        "pila_deshacer": [],
    }

    historia_2 = {
        "paciente_id": ids[1], "paciente_nombre": "Carlos Andrés Ramírez Pérez",
        "fecha_apertura": iso(-10),
        "antecedentes": {"enfermedades": "Hipertensión controlada", "medicamentos": "Losartán",
                         "alergias": "Ninguna", "cirugias": "Ninguna"},
        "valoraciones": [], "plan_tratamiento": [],
        "odontograma_actual": odontograma_base(), "pila_deshacer": [],
    }
    historia_3 = {
        "paciente_id": ids[2], "paciente_nombre": "Sofía Valentina Torres Mejía",
        "fecha_apertura": iso(-5),
        "antecedentes": {}, "valoraciones": [], "plan_tratamiento": [],
        "odontograma_actual": odontograma_base(), "pila_deshacer": [],
    }
    db["historias"].insert_many([historia_1, historia_2, historia_3])

    # ---------------- CITAS ----------------
    db["citas"].insert_many([
        {"paciente_id": ids[0], "paciente_nombre": "María Fernanda López Ríos",
         "fecha": fecha(0), "hora": "09:00", "motivo": "Control de tratamiento",
         "profesional": "Dra. Laura Gómez", "estado": "Pendiente"},
        {"paciente_id": ids[1], "paciente_nombre": "Carlos Andrés Ramírez Pérez",
         "fecha": fecha(0), "hora": "10:30", "motivo": "Valoración inicial",
         "profesional": "Dra. Laura Gómez", "estado": "Pendiente"},
        {"paciente_id": ids[2], "paciente_nombre": "Sofía Valentina Torres Mejía",
         "fecha": fecha(1), "hora": "11:00", "motivo": "Revisión de ortodoncia",
         "profesional": "Dra. Laura Gómez", "estado": "Pendiente"},
    ])

    # ---------------- PROCEDIMIENTOS (catálogo para el GRAFO de dependencias) ----------------
    # 'requiere' lista los códigos que deben realizarse antes (precedencia).
    db["procedimientos"].insert_many([
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
    ])

    # ---------------- TURNOS (sala de espera, estructura COLA / FIFO) ----------------
    db["turnos"].insert_many([
        {"paciente_id": ids[0], "paciente_nombre": "María Fernanda López Ríos",
         "orden": 1, "estado": "en_espera", "creado": iso(0)},
        {"paciente_id": ids[1], "paciente_nombre": "Carlos Andrés Ramírez Pérez",
         "orden": 2, "estado": "en_espera", "creado": iso(0)},
    ])

    print("✓ Datos cargados correctamente:")
    print("  - 3 usuarios (odontóloga, recepcionista, administrador)")
    print("  - 3 pacientes con historia clínica")
    print("  - 1 odontograma con hallazgos + plan de tratamiento")
    print("  - 3 citas agendadas")
    print("  - 10 procedimientos (grafo de dependencias)")
    print("  - 2 turnos en sala de espera (cola)")
    print("\nCredenciales de acceso:")
    print("  Odontóloga    -> odontologa@odontosoft.com  / Odonto123")
    print("  Recepcionista -> recepcion@odontosoft.com   / Recepcion123")
    print("  Administrador -> admin@odontosoft.com       / Admin123")


if __name__ == "__main__":
    seed()

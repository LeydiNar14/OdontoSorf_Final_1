# 🦷 OdontoSoft — Sistema de gestión odontológica con estructuras de datos

Proyecto final — Universidad Autónoma de Occidente (UAO).
Plataforma web para la gestión de un consultorio odontológico que **implementa y
utiliza cinco estructuras de datos** sobre una arquitectura de tres capas, con
almacenamiento y transacciones en **MongoDB**.

---

## 👥 Integrantes y aporte por rama

| Integrante | Código | Rama Git | Aporte principal |
|---|---|---|---|
| Leydi Dayana Narváez | 2240494 | `leydi` | Capa de presentación: todo el frontend |
| Clara Mercedes Acevedo Urbano | 2240713 | `clara` | Estructuras de datos (Cola, Pila, Trie, Árbol/BST, Grafo) y documentación |
| Jhon Brandon Arboleda Criollo | 2243499 | `jhon` | Backend base (API, MongoDB) y despliegue |

Todas las ramas se integran (merge) sobre `main`.

## 🔗 Enlaces de la entrega

| Recurso | Enlace |
|---|---|
| Repositorio Git | https://github.com/LeydiNar14/OdontoSorf_Final_1 |
| Frontend (Netlify) | `<PEGAR_URL_DE_NETLIFY>` |
| Backend / API (Render) | `<PEGAR_URL_DE_RENDER>` |

---

## 🧩 Estructuras de datos implementadas (5)

| # | Estructura | Grupo | Uso en OdontoSoft | Archivo |
|---|---|---|---|---|
| 1 | **Cola** (FIFO) | Lineal | Sala de espera: turnos en orden de llegada | `backend/estructuras/cola.py` |
| 2 | **Pila** (LIFO) | Lineal | Deshacer (undo) cambios en el odontograma | `backend/estructuras/pila.py` |
| 3 | **Árbol Binario de Búsqueda** | Jerárquica | Índice de pacientes por documento (búsqueda O(log n)) | `backend/estructuras/arbol.py` |
| 4 | **Trie** | Jerárquica | Autocompletado de búsqueda de pacientes | `backend/estructuras/trie.py` |
| 5 | **Grafo dirigido** | Grafo | Dependencias de procedimientos + orden topológico | `backend/estructuras/grafo.py` |

Se cumple el requisito: **2** estructuras de {lista, pila, cola} + **2** de {árbol, trie, heap} + **1** grafo.

Cada estructura está **integrada dentro de su módulo** (Sala de espera, Pacientes e Historia clínica),
de forma transparente para el usuario. La página `estructuras.html` queda como **anexo técnico**
(sin enlace en el menú) para verificar las cinco en un solo lugar.
La explicación y justificación detallada está en [`docs/DOCUMENTO_FINAL.md`](docs/DOCUMENTO_FINAL.md).

## 🛠️ Tecnologías

- **Frontend (presentación):** HTML, CSS y JavaScript (sin frameworks).
- **Backend (lógica de negocio):** Python + FastAPI (API REST).
- **Base de datos (datos):** MongoDB + GridFS.
- **Seguridad:** autenticación JWT, contraseñas con BCrypt, control de acceso por roles (RBAC).
- **Despliegue:** Netlify (frontend), Render (backend), MongoDB Atlas (base de datos).

## ▶️ Ejecución local

**Requisitos:** Python 3.11+ y MongoDB (local o una cuenta de MongoDB Atlas).

```bash
# 1) Backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   |   Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# 2) Configurar variables de entorno
copy .env.example .env     # Windows  (Linux/Mac: cp .env.example .env)
#   Edita .env con tu MONGO_URL (local o Atlas)

# 3) Cargar datos de ejemplo (usuarios, pacientes, procedimientos, turnos)
python seed.py

# 4) Iniciar el servidor (sirve API + frontend)
uvicorn main:app --reload
```

Abre **http://localhost:8000**. Documentación interactiva de la API en **/docs**.

### Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Odontóloga | odontologa@odontosoft.com | Odonto123 |
| Recepcionista | recepcion@odontosoft.com | Recepcion123 |
| Administrador | admin@odontosoft.com | Admin123 |

## 📂 Estructura del proyecto

```
OdontoSoft/
├── backend/                 # FastAPI (lógica de negocio)
│   ├── estructuras/         # ★ Las 5 estructuras de datos (cola, pila, arbol, trie, grafo)
│   ├── core/                # configuración, conexión Mongo, seguridad (JWT/BCrypt/RBAC)
│   ├── models/ schemas/     # colecciones y validación (Pydantic)
│   ├── services/            # lógica de cada módulo (incl. turnos, odontograma, estructuras)
│   ├── routers/             # endpoints REST
│   ├── main.py  seed.py     # app y carga de datos
│   └── requirements.txt
├── frontend/                # HTML/CSS/JS (presentación)
│   ├── estructuras.html     # ★ Página visual de las 5 estructuras
│   └── js/ css/ ...
├── docs/                    # Documento final de la entrega
├── netlify.toml render.yaml # Configuración de despliegue
└── README.md
```

## 📄 Despliegue

Consulta la guía paso a paso en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)
y el flujo de trabajo en Git en [`docs/GUIA_GIT.md`](docs/GUIA_GIT.md).

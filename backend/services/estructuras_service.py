"""
Servicios de demostración de estructuras jerárquicas y de grafo:

  Trie  -> autocompletado de búsqueda de pacientes
  BST   -> índice de pacientes ordenados por documento (búsqueda O(log n))
  Grafo -> dependencias de procedimientos del plan de tratamiento (orden topológico)

Los datos provienen de MongoDB (colecciones `pacientes` y `procedimientos`);
las estructuras se construyen en memoria para operar sobre ellos.
"""
from core.database import db
from estructuras.trie import Trie
from estructuras.arbol import ArbolBinarioBusqueda
from estructuras.grafo import Grafo

pacientes = db["pacientes"]
procedimientos = db["procedimientos"]


def _todos_pacientes():
    return list(pacientes.find())


def _datos_paciente(p):
    return {
        "id": str(p["_id"]),
        "documento": p.get("documento", ""),
        "nombres": p.get("nombres", ""),
        "apellidos": p.get("apellidos", ""),
        "nombre_completo": f"{p.get('nombres','')} {p.get('apellidos','')}".strip(),
    }


# ---------------- Trie: autocompletado ----------------
def autocompletar_pacientes(prefijo, limite=10):
    trie = Trie()
    lista = _todos_pacientes()
    for p in lista:
        d = _datos_paciente(p)
        trie.insertar(d["nombre_completo"], d)
        trie.insertar(d["apellidos"], d)
        trie.insertar(d["documento"], d)
    vistos, salida = set(), []
    for r in trie.autocompletar(prefijo, limite * 3):
        pid = r["datos"]["id"]
        if pid in vistos:
            continue
        vistos.add(pid)
        salida.append(r["datos"])
        if len(salida) >= limite:
            break
    return {"prefijo": prefijo, "coincidencias": salida, "total_pacientes": len(lista)}


# ---------------- BST: pacientes por documento ----------------
def _bst_pacientes():
    bst = ArbolBinarioBusqueda()
    for p in _todos_pacientes():
        bst.insertar(p.get("documento", ""), _datos_paciente(p))
    return bst


def pacientes_ordenados():
    bst = _bst_pacientes()
    return {"ordenados": bst.inorden(), "total": len(bst), "altura": bst.altura()}


def buscar_en_bst(documento):
    bst = _bst_pacientes()
    r = bst.buscar(documento)
    return {"encontrado": r is not None, "paciente": r, "altura_arbol": bst.altura()}


# ---------------- Grafo: dependencias de procedimientos ----------------
def _construir_grafo():
    catalogo = list(procedimientos.find().sort("codigo", 1))
    g = Grafo()
    nombres = {}
    for proc in catalogo:
        g.agregar_nodo(proc["codigo"])
        nombres[proc["codigo"]] = proc["nombre"]
    for proc in catalogo:
        for req in proc.get("requiere", []):
            g.agregar_arista(req, proc["codigo"])   # req debe ir antes que proc
    return g, nombres, catalogo


def catalogo_procedimientos():
    _, _, catalogo = _construir_grafo()
    return [{"codigo": p["codigo"], "nombre": p["nombre"], "requiere": p.get("requiere", [])}
            for p in catalogo]


def grafo_procedimientos():
    g, nombres, _ = _construir_grafo()
    orden, ciclo = g.orden_topologico()
    return {
        "grafo": g.a_dict(),
        "nombres": nombres,
        "orden_topologico": orden,
        "orden_nombres": [nombres.get(c, c) for c in orden],
        "hay_ciclo": ciclo,
    }


def ordenar_plan(codigos):
    """Ordena un plan de tratamiento (subconjunto de procedimientos) respetando
    las precedencias; incluye automáticamente los prerrequisitos faltantes."""
    _, nombres, catalogo = _construir_grafo()
    req_map = {p["codigo"]: p.get("requiere", []) for p in catalogo}
    # cierre: agregar prerrequisitos de lo seleccionado
    requeridos, pila = set(), list(codigos)
    while pila:
        c = pila.pop()
        if c in requeridos:
            continue
        requeridos.add(c)
        for r in req_map.get(c, []):
            pila.append(r)
    sub = Grafo()
    for c in requeridos:
        sub.agregar_nodo(c)
        for r in req_map.get(c, []):
            if r in requeridos:
                sub.agregar_arista(r, c)
    orden, ciclo = sub.orden_topologico()
    return {
        "seleccionados": list(codigos),
        "incluye_prerrequisitos": sorted(requeridos - set(codigos)),
        "orden_topologico": orden,
        "orden_nombres": [nombres.get(c, c) for c in orden],
        "hay_ciclo": ciclo,
    }

"""
Árboles — estructuras de datos jerárquicas.

Contiene dos árboles usados en OdontoSoft:

1) ArbolBinarioBusqueda (BST)
   Uso: índice de pacientes ordenados por número de documento. Permite
   búsqueda eficiente y listar en orden ascendente mediante recorrido inorden.
   Complejidad: insertar/buscar O(h); con el árbol equilibrado h ≈ log(n).

2) ArbolOdontograma
   Uso: representación jerárquica de la boca -> cuadrantes -> dientes. Modela
   que la dentadura es, por naturaleza, una estructura de árbol, y permite
   recorrerla para obtener resúmenes clínicos (p. ej. hallazgos por cuadrante).
"""


# ----------------------------------------------------------------------
# 1) Árbol Binario de Búsqueda (pacientes por documento)
# ----------------------------------------------------------------------
class _NodoBST:
    __slots__ = ("clave", "datos", "izq", "der")

    def __init__(self, clave, datos=None):
        self.clave = clave
        self.datos = datos
        self.izq = None
        self.der = None


class ArbolBinarioBusqueda:
    """BST con claves comparables (p. ej. el documento del paciente)."""

    def __init__(self):
        self.raiz = None
        self._n = 0

    def insertar(self, clave, datos=None):
        """Inserta respetando la propiedad de BST. O(h)."""
        self.raiz = self._insertar(self.raiz, clave, datos)

    def _insertar(self, nodo, clave, datos):
        if nodo is None:
            self._n += 1
            return _NodoBST(clave, datos)
        if clave < nodo.clave:
            nodo.izq = self._insertar(nodo.izq, clave, datos)
        elif clave > nodo.clave:
            nodo.der = self._insertar(nodo.der, clave, datos)
        else:
            nodo.datos = datos  # clave existente: actualiza
        return nodo

    def buscar(self, clave):
        """Retorna los datos asociados a la clave o None. O(h)."""
        nodo = self.raiz
        while nodo is not None:
            if clave == nodo.clave:
                return nodo.datos
            nodo = nodo.izq if clave < nodo.clave else nodo.der
        return None

    def inorden(self):
        """Recorrido inorden -> lista de datos en orden ascendente de clave. O(n)."""
        salida = []
        self._inorden(self.raiz, salida)
        return salida

    def _inorden(self, nodo, salida):
        if nodo is None:
            return
        self._inorden(nodo.izq, salida)
        salida.append(nodo.datos if nodo.datos is not None else nodo.clave)
        self._inorden(nodo.der, salida)

    def altura(self):
        """Altura del árbol (nº de niveles). O(n)."""
        return self._altura(self.raiz)

    def _altura(self, nodo):
        if nodo is None:
            return 0
        return 1 + max(self._altura(nodo.izq), self._altura(nodo.der))

    def __len__(self):
        return self._n


# ----------------------------------------------------------------------
# 2) Árbol jerárquico del odontograma (boca -> cuadrante -> diente)
# ----------------------------------------------------------------------
# Dientes permanentes por cuadrante (notación FDI)
CUADRANTES_FDI = {
    "Superior derecho": [18, 17, 16, 15, 14, 13, 12, 11],
    "Superior izquierdo": [21, 22, 23, 24, 25, 26, 27, 28],
    "Inferior izquierdo": [31, 32, 33, 34, 35, 36, 37, 38],
    "Inferior derecho": [41, 42, 43, 44, 45, 46, 47, 48],
}


class _NodoArbol:
    def __init__(self, nombre, valor=None):
        self.nombre = nombre
        self.valor = valor
        self.hijos = []

    def agregar(self, hijo):
        self.hijos.append(hijo)
        return hijo


class ArbolOdontograma:
    """Árbol general de 3 niveles: raíz 'Boca' -> cuadrantes -> dientes."""

    def __init__(self, estados=None):
        """estados: dict {'11': 'caries', '37': 'ausente', ...}."""
        estados = estados or {}
        self.raiz = _NodoArbol("Boca")
        for cuadrante, dientes in CUADRANTES_FDI.items():
            nodo_c = self.raiz.agregar(_NodoArbol(cuadrante))
            for d in dientes:
                nodo_c.agregar(_NodoArbol(str(d), estados.get(str(d), "sano")))

    def resumen_por_cuadrante(self):
        """Recorre el árbol y cuenta los hallazgos (≠ sano) por cuadrante. O(n)."""
        resumen = {}
        for nodo_c in self.raiz.hijos:
            conteo = {}
            for diente in nodo_c.hijos:
                if diente.valor and diente.valor != "sano":
                    conteo[diente.valor] = conteo.get(diente.valor, 0) + 1
            resumen[nodo_c.nombre] = conteo
        return resumen

    def a_dict(self):
        """Serializa el árbol para enviarlo al frontend y dibujarlo."""
        def ser(nodo):
            d = {"nombre": nodo.nombre}
            if nodo.valor is not None:
                d["valor"] = nodo.valor
            if nodo.hijos:
                d["hijos"] = [ser(h) for h in nodo.hijos]
            return d
        return ser(self.raiz)

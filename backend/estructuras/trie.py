"""
Trie (árbol de prefijos) — estructura de datos jerárquica.

Uso en OdontoSoft
-----------------
Autocompletado de la búsqueda de pacientes. Al escribir un prefijo (nombre,
apellido o documento) el sistema sugiere en tiempo real los pacientes cuya
clave comienza con ese prefijo.

Por qué un Trie
---------------
La búsqueda por prefijo en un Trie no depende de la cantidad total de
pacientes, sino de la longitud del texto escrito: es mucho más eficiente que
recorrer toda la base comparando cadena por cadena.

Complejidad (L = longitud de la clave, k = nº de coincidencias)
---------------------------------------------------------------
  insertar       O(L)
  buscar         O(L)
  autocompletar  O(L + k)
"""
import unicodedata


def normalizar(texto):
    """Minúsculas y sin tildes, para una búsqueda tolerante a acentos."""
    texto = (texto or "").strip().lower()
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


class _NodoTrie:
    __slots__ = ("hijos", "es_fin", "clave_original", "datos")

    def __init__(self):
        self.hijos = {}            # carácter -> _NodoTrie
        self.es_fin = False        # marca fin de una clave
        self.clave_original = None # texto tal como se insertó
        self.datos = None          # payload asociado (p. ej. datos del paciente)


class Trie:
    """Árbol de prefijos para autocompletado."""

    def __init__(self):
        self.raiz = _NodoTrie()
        self._n = 0

    def insertar(self, clave, datos=None):
        """Inserta una clave y su payload. O(L)."""
        nodo = self.raiz
        for ch in normalizar(clave):
            nodo = nodo.hijos.setdefault(ch, _NodoTrie())
        if not nodo.es_fin:
            self._n += 1
        nodo.es_fin = True
        nodo.clave_original = clave
        nodo.datos = datos

    def buscar(self, clave):
        """True si la clave exacta existe. O(L)."""
        nodo = self._descender(normalizar(clave))
        return bool(nodo and nodo.es_fin)

    def autocompletar(self, prefijo, limite=10):
        """Lista de {clave, datos} cuyas claves empiezan por el prefijo. O(L + k)."""
        nodo = self._descender(normalizar(prefijo))
        if nodo is None:
            return []
        resultados = []
        self._recolectar(nodo, resultados, limite)
        return resultados

    def __len__(self):
        return self._n

    # --- auxiliares ---
    def _descender(self, clave_norm):
        nodo = self.raiz
        for ch in clave_norm:
            nodo = nodo.hijos.get(ch)
            if nodo is None:
                return None
        return nodo

    def _recolectar(self, nodo, resultados, limite):
        """Recorrido en profundidad (DFS) para reunir las claves del subárbol."""
        if len(resultados) >= limite:
            return
        if nodo.es_fin:
            resultados.append({"clave": nodo.clave_original, "datos": nodo.datos})
        for ch in sorted(nodo.hijos):
            if len(resultados) >= limite:
                return
            self._recolectar(nodo.hijos[ch], resultados, limite)

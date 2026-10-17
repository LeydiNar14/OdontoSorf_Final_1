"""
Pila (LIFO) — estructura de datos lineal.

Uso en OdontoSoft
-----------------
Función "Deshacer" (undo) sobre el odontograma: cada cambio de estado de un
diente se apila; al deshacer se retira el último cambio registrado. El último
en entrar es el primero en salir (Last In, First Out).

Implementación
--------------
Lista enlazada simple con puntero a la cima.

Complejidad
-----------
  apilar     O(1)
  desapilar  O(1)
  cima       O(1)
"""


class _Nodo:
    __slots__ = ("valor", "siguiente")

    def __init__(self, valor):
        self.valor = valor
        self.siguiente = None


class Pila:
    """Pila LIFO implementada con lista enlazada simple."""

    def __init__(self):
        self._cima = None
        self._tamano = 0

    def apilar(self, valor):
        """Inserta un elemento en la cima. O(1)."""
        nodo = _Nodo(valor)
        nodo.siguiente = self._cima
        self._cima = nodo
        self._tamano += 1

    def desapilar(self):
        """Extrae y retorna el elemento de la cima. O(1). None si está vacía."""
        if self._cima is None:
            return None
        nodo = self._cima
        self._cima = nodo.siguiente
        self._tamano -= 1
        return nodo.valor

    def cima(self):
        """Consulta la cima sin extraerla. O(1)."""
        return self._cima.valor if self._cima else None

    def esta_vacia(self):
        return self._cima is None

    def __len__(self):
        return self._tamano

    def a_lista(self):
        """Devuelve los elementos desde la cima hacia abajo. O(n)."""
        salida, nodo = [], self._cima
        while nodo is not None:
            salida.append(nodo.valor)
            nodo = nodo.siguiente
        return salida

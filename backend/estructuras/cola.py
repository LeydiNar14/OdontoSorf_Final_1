"""
Cola (FIFO) — estructura de datos lineal.

Uso en OdontoSoft
-----------------
Sala de espera / turnos de atención del día. El primer paciente en llegar
es el primero en ser atendido (First In, First Out).

Implementación
--------------
Lista enlazada simple con punteros al frente y al final, de modo que
encolar y desencolar sean O(1) (no se desplazan elementos como en un array).

Complejidad
-----------
  encolar   O(1)
  desencolar O(1)
  frente    O(1)
  __len__   O(1)
"""


class _Nodo:
    __slots__ = ("valor", "siguiente")

    def __init__(self, valor):
        self.valor = valor
        self.siguiente = None


class Cola:
    """Cola FIFO implementada con lista enlazada simple."""

    def __init__(self):
        self._frente = None
        self._final = None
        self._tamano = 0

    def encolar(self, valor):
        """Agrega un elemento al final de la cola. O(1)."""
        nodo = _Nodo(valor)
        if self._final is None:
            self._frente = self._final = nodo
        else:
            self._final.siguiente = nodo
            self._final = nodo
        self._tamano += 1

    def desencolar(self):
        """Extrae y retorna el elemento del frente. O(1). None si está vacía."""
        if self._frente is None:
            return None
        nodo = self._frente
        self._frente = nodo.siguiente
        if self._frente is None:
            self._final = None
        self._tamano -= 1
        return nodo.valor

    def frente(self):
        """Consulta el elemento del frente sin extraerlo. O(1)."""
        return self._frente.valor if self._frente else None

    def esta_vacia(self):
        return self._frente is None

    def __len__(self):
        return self._tamano

    def a_lista(self):
        """Devuelve los elementos del frente al final (para serializar/visualizar). O(n)."""
        salida, nodo = [], self._frente
        while nodo is not None:
            salida.append(nodo.valor)
            nodo = nodo.siguiente
        return salida

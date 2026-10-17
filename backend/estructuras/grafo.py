"""
Grafo dirigido — estructura de datos no lineal.

Uso en OdontoSoft
-----------------
Dependencias de precedencia entre procedimientos del plan de tratamiento.
Un arco A -> B significa "A debe realizarse antes que B".
Ejemplos clínicos:
    Profilaxis           -> Blanqueamiento
    Endodoncia           -> Corona
    Control de placa     -> Cirugía periodontal

A partir de ese grafo, el sistema calcula un ORDEN TOPOLÓGICO: una secuencia
válida en la que ejecutar los procedimientos respetando todas las precedencias.
Si existe un ciclo (dependencias contradictorias), el plan es inconsistente y
se reporta el error.

Implementación
--------------
Lista de adyacencia (dict nodo -> conjunto de vecinos). Orden topológico por
el algoritmo de Kahn (basado en grados de entrada).

Complejidad (V = nodos, E = aristas)
------------------------------------
  agregar_nodo / agregar_arista   O(1)
  orden_topologico (Kahn)         O(V + E)
  bfs / dfs                       O(V + E)
"""
from collections import deque


class Grafo:
    """Grafo dirigido con lista de adyacencia."""

    def __init__(self):
        self.adyacencia = {}  # nodo -> set(vecinos)

    def agregar_nodo(self, nodo):
        self.adyacencia.setdefault(nodo, set())

    def agregar_arista(self, origen, destino):
        """origen debe ejecutarse antes que destino."""
        self.agregar_nodo(origen)
        self.agregar_nodo(destino)
        self.adyacencia[origen].add(destino)

    def vecinos(self, nodo):
        return sorted(self.adyacencia.get(nodo, set()))

    def nodos(self):
        return list(self.adyacencia.keys())

    def grados_entrada(self):
        """Calcula el grado de entrada de cada nodo. O(V + E)."""
        grado = {n: 0 for n in self.adyacencia}
        for origen in self.adyacencia:
            for destino in self.adyacencia[origen]:
                grado[destino] = grado.get(destino, 0) + 1
        return grado

    def orden_topologico(self):
        """
        Retorna (orden, hay_ciclo).
        - Si NO hay ciclo: orden es una lista válida de todos los nodos y hay_ciclo=False.
        - Si hay ciclo: hay_ciclo=True y orden contiene los nodos que sí pudieron ordenarse.
        Algoritmo de Kahn. O(V + E).
        """
        grado = self.grados_entrada()
        cola = deque(sorted([n for n, g in grado.items() if g == 0]))
        orden = []
        while cola:
            nodo = cola.popleft()
            orden.append(nodo)
            for vecino in sorted(self.adyacencia[nodo]):
                grado[vecino] -= 1
                if grado[vecino] == 0:
                    cola.append(vecino)
        hay_ciclo = len(orden) != len(self.adyacencia)
        return orden, hay_ciclo

    def hay_ciclo(self):
        _, ciclo = self.orden_topologico()
        return ciclo

    def bfs(self, inicio):
        """Recorrido en anchura desde un nodo. O(V + E)."""
        visitados, orden, cola = set(), [], deque([inicio])
        while cola:
            nodo = cola.popleft()
            if nodo in visitados:
                continue
            visitados.add(nodo)
            orden.append(nodo)
            for vecino in sorted(self.adyacencia.get(nodo, set())):
                if vecino not in visitados:
                    cola.append(vecino)
        return orden

    def dfs(self, inicio):
        """Recorrido en profundidad desde un nodo. O(V + E)."""
        visitados, orden = set(), []

        def _rec(nodo):
            visitados.add(nodo)
            orden.append(nodo)
            for vecino in sorted(self.adyacencia.get(nodo, set())):
                if vecino not in visitados:
                    _rec(vecino)

        _rec(inicio)
        return orden

    def a_dict(self):
        """Serializa el grafo (nodos y aristas) para dibujarlo en el frontend."""
        return {
            "nodos": sorted(self.adyacencia.keys()),
            "aristas": sorted([origen, destino]
                              for origen in self.adyacencia
                              for destino in self.adyacencia[origen]),
        }

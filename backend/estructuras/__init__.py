"""
Paquete de estructuras de datos de OdontoSoft.

Contiene la implementación propia (sin librerías externas) de las cinco
estructuras exigidas por la rúbrica del proyecto final:

  Lineales   -> Cola (FIFO)  y  Pila (LIFO)
  Jerárquicas-> ArbolBinarioBusqueda (BST)  y  Trie
  Grafo      -> Grafo dirigido con orden topológico
"""
from .cola import Cola
from .pila import Pila
from .arbol import ArbolBinarioBusqueda, ArbolOdontograma
from .trie import Trie
from .grafo import Grafo

__all__ = ["Cola", "Pila", "ArbolBinarioBusqueda", "ArbolOdontograma", "Trie", "Grafo"]

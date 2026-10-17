"""Validaciones de dominio reutilizables."""

FORMATOS_ARCHIVO_PERMITIDOS = ["image/jpeg", "image/png", "application/pdf"]
TAMANO_MAXIMO_ARCHIVO = 10 * 1024 * 1024  # 10 MB


def formato_archivo_valido(content_type: str) -> bool:
    return content_type in FORMATOS_ARCHIVO_PERMITIDOS


def tamano_archivo_valido(tamano_bytes: int) -> bool:
    return tamano_bytes <= TAMANO_MAXIMO_ARCHIVO

# Guía de Git y reparto por integrante — OdontoSoft

**Repositorio:** https://github.com/LeydiNar14/OdontoSorf_Final_1

La rúbrica exige que **cada integrante aporte en su propia rama** y que las ramas se
**mezclen (merge) sobre `main`**. Aquí está el reparto y los pasos.

> Cada integrante hace **sus propios commits desde su computador**, con su usuario de
> Git configurado con **el correo de su cuenta de GitHub**, para que el aporte quede
> registrado a su nombre y sea verificable.

## Reparto del proyecto (qué sube cada quien)

| ZIP | Integrante | Rama | Parte del proyecto |
|---|---|---|---|
| `1_leydi_frontend.zip` | **Leydi** | `leydi` | Todo el **frontend** (capa de presentación) |
| `2_clara_estructuras_docs.zip` | **Clara** | `clara` | **Estructuras de datos** (Cola, Pila, Trie, Árbol/BST, Grafo) y **documentación** |
| `3_jhon_backend_despliegue.zip` | **Jhon** | `jhon` | **Backend base** (API, MongoDB) y **despliegue** |

---

## Paso 0 — Cada integrante configura su identidad (una sola vez)

```bash
git config --global user.name "Nombre Apellido"
git config --global user.email "correo-de-su-cuenta-github@ejemplo.com"
```

## Paso 1 — Leydi (dueña del repo) crea la base en `main`

```bash
git clone https://github.com/LeydiNar14/OdontoSorf_Final_1.git
cd OdontoSorf_Final_1
#  → descomprimir aquí 0_base_main.zip  (quedan README.md y .gitignore)
git add .
git commit -m "chore: base del repositorio"
git push origin main
```

> Leydi debe agregar a **Clara** y **Jhon** como colaboradores:
> repo → **Settings → Collaborators → Add people** (con sus usuarios de GitHub),
> para que puedan subir sus ramas.

## Paso 2 — Cada integrante sube SU parte en su rama

**Leydi:**
```bash
git checkout main && git pull origin main
git checkout -b leydi
#  → descomprimir 1_leydi_frontend.zip (crea la carpeta frontend/)
git add .
git commit -m "feat(frontend): capa de presentacion"
git push -u origin leydi
```

**Clara:**
```bash
git clone https://github.com/LeydiNar14/OdontoSorf_Final_1.git
cd OdontoSorf_Final_1
git checkout -b clara
#  → descomprimir 2_clara_estructuras_docs.zip
git add .
git commit -m "feat: estructuras de datos y documentacion"
git push -u origin clara
```

**Jhon:**
```bash
git clone https://github.com/LeydiNar14/OdontoSorf_Final_1.git
cd OdontoSorf_Final_1
git checkout -b jhon
#  → descomprimir 3_jhon_backend_despliegue.zip
git add .
git commit -m "feat(backend): API, MongoDB y despliegue"
git push -u origin jhon
```

## Paso 3 — Mezclar las tres ramas sobre `main`

En **GitHub**, por cada rama: **Compare & pull request** → base `main` → **Merge**.
Al terminar, `main` queda con el **proyecto completo**.

O por consola (desde cualquier clon):
```bash
git checkout main && git pull origin main
git merge leydi
git merge clara
git merge jhon
git push origin main
```

## Paso 4 — Verificar el aporte de cada integrante

- Ramas: `https://github.com/LeydiNar14/OdontoSorf_Final_1/branches`
- Commits de una rama: `https://github.com/LeydiNar14/OdontoSorf_Final_1/commits/clara`
- Aporte por persona: **Insights → Contributors**

---

## Para correr el proyecto completo

Cada ZIP por integrante trae **solo su parte**; por sí solo no corre (es normal).
Para **ejecutar y probar** la app usa el **proyecto completo** (`OdontoSoft.zip`)
siguiendo el `README.md`. Al mezclar las tres ramas, `main` queda completo y funcional.

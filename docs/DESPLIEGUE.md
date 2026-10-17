# Guía de despliegue — OdontoSoft

Arquitectura de publicación: **Frontend en Netlify**, **Backend en Render** y
**Base de datos en MongoDB Atlas**.

```
Navegador ──> Netlify (frontend HTML/CSS/JS) ──> Render (FastAPI) ──> MongoDB Atlas
```

## 1. Base de datos — MongoDB Atlas

1. Crear una cuenta gratuita en https://www.mongodb.com/atlas y un clúster **M0 (free)**.
2. En **Database Access**, crear un usuario con contraseña.
3. En **Network Access**, permitir el acceso desde cualquier IP: `0.0.0.0/0`.
4. En **Connect → Drivers**, copiar la cadena de conexión, por ejemplo:
   ```
   mongodb+srv://USUARIO:CONTRASENA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 2. Backend — Render

1. Crear cuenta en https://render.com y conectar el repositorio de GitHub.
2. **New → Web Service** (o usar el `render.yaml` incluido como Blueprint).
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. En **Environment**, definir las variables:
   | Variable | Valor |
   |---|---|
   | `MONGO_URL` | la cadena de conexión de Atlas (paso 1) |
   | `DATABASE_NAME` | `base_Odontosoft` |
   | `SECRET_KEY` | una clave secreta larga y aleatoria |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
4. Desplegar. Render entrega una URL como `https://odontosoft-api.onrender.com`.
5. **Cargar los datos iniciales** una sola vez: en Render, abrir **Shell** y ejecutar
   `python seed.py` (o ejecutarlo localmente con `MONGO_URL` apuntando a Atlas).

> Verifica el backend abriendo `https://<tu-backend>.onrender.com/docs`.

## 3. Frontend — Netlify

1. Crear cuenta en https://www.netlify.com y **Add new site → Import from Git**.
2. Configuración (ya incluida en `netlify.toml`):
   - **Base directory:** (raíz del repo)
   - **Publish directory:** `frontend`
3. **Antes o después de desplegar**, edita `frontend/js/config.js` y escribe la URL
   del backend de Render:
   ```js
   window.ODONTO_API = "https://odontosoft-api.onrender.com";
   ```
   Haz commit y Netlify volverá a desplegar. Netlify entrega una URL como
   `https://odontosoft.netlify.app`.

## 4. Verificación final

1. Abre la URL de Netlify e inicia sesión con un usuario de prueba.
2. Comprueba la página **Estructuras de datos** (turnos, deshacer, autocompletado, árbol, grafo).
3. Copia las URLs de Netlify y Render en el `README.md`.

## Notas
- El backend ya habilita **CORS** para permitir el consumo desde Netlify.
- El plan gratuito de Render suspende el servicio tras inactividad; la primera
  petición puede tardar ~30 s en "despertar".

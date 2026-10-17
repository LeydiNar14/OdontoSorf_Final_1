/* ===== Cliente de la API + manejo de sesión ===== */
/* La URL del backend se resuelve automáticamente:
   1) window.ODONTO_API si está definida en js/config.js (producción),
   2) http://localhost:8000 en desarrollo local,
   3) el mismo origen si el frontend lo sirve el propio backend. */
const API_BASE = (function () {
  if (window.ODONTO_API) return window.ODONTO_API;
  const h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "") return "http://localhost:8000";
  return location.origin;
})();

function getToken(){ return sessionStorage.getItem("token"); }
function getUser(){ try{ return JSON.parse(sessionStorage.getItem("user")); }catch(e){ return null; } }
function setSession(token, user){
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));
}
function clearSession(){ sessionStorage.removeItem("token"); sessionStorage.removeItem("user"); }

async function api(path, opts){
  opts = opts || {};
  const headers = {};
  const token = getToken();
  if(token) headers["Authorization"] = "Bearer " + token;

  let body = opts.body || null;
  if(body && !opts.isForm){ headers["Content-Type"] = "application/json"; body = JSON.stringify(body); }

  const res = await fetch(API_BASE + path, { method: opts.method || "GET", headers, body });

  if(res.status === 401 && !path.startsWith("/auth/login")){
    clearSession();
    const p = location.pathname;
    if(!(p.endsWith("index.html") || p === "/" || p === "")) location.href = "index.html";
    throw { status:401, detail:"Sesión expirada" };
  }

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.blob();
  if(!res.ok) throw { status: res.status, detail: (data && data.detail) || "Error en la solicitud" };
  return data;
}

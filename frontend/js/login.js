if(getUser()) location.href = "dashboard.html";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("err");
  err.style.display = "none";
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value;
  try{
    const r = await api("/auth/login", { method:"POST", body:{ correo, password } });
    setSession(r.access_token, { nombre:r.nombre, rol:r.rol, correo });
    location.href = "dashboard.html";
  }catch(ex){
    err.textContent = ex.detail || "No fue posible iniciar sesión";
    err.style.display = "block";
  }
});

/* ===== Layout (shell), guardas de sesión y utilidades de UI ===== */
const MENU = [
  { page:"dashboard.html", label:"Inicio",            icon:"🏠", roles:["odontologa","recepcionista","administrador"] },
  { page:"pacientes.html", label:"Pacientes",         icon:"👥", roles:["odontologa","recepcionista"] },
  { page:"citas.html",     label:"Agenda de citas",   icon:"📅", roles:["odontologa","recepcionista"] },
  { page:"sala.html",      label:"Sala de espera",    icon:"🪑", roles:["odontologa","recepcionista"] },
  { page:"historia.html",  label:"Historia clínica",  icon:"🦷", roles:["odontologa"] },
  { page:"usuarios.html",  label:"Administración",    icon:"⚙️", roles:["administrador"] },
];

function rolLabel(r){ return {odontologa:"Odontóloga", recepcionista:"Recepcionista", administrador:"Administrador"}[r] || r; }
function logout(){ clearSession(); location.href = "index.html"; }

function requireAuth(){
  const u = getUser();
  if(!u){ location.href = "index.html"; return null; }
  return u;
}

function renderShell(active, title){
  const user = requireAuth();
  if(!user) return null;
  const items = MENU.filter(m => m.roles.includes(user.rol)).map(m =>
    `<a href="${m.page}" class="nav-item ${m.page===active?'active':''}"><span>${m.icon}</span>${m.label}</a>`
  ).join("");
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="app">
      <aside class="sidebar">
        <div class="brand">🦷 OdontoSoft</div>
        <nav>${items}</nav>
        <div class="sidebar-foot">v1.0 · Metodología Scrum</div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="topbar-title">${title || ""}</div>
          <div class="user-box">
            <div class="user-info"><strong>${user.nombre}</strong><span class="role-badge">${rolLabel(user.rol)}</span></div>
            <button class="btn-ghost" onclick="logout()">Cerrar sesión</button>
          </div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>`);
  return user;
}

/* ----- Modal ----- */
function openModal(title, bodyHTML, footerHTML, wide){
  closeModal();
  const m = document.createElement("div");
  m.className = "modal-overlay"; m.id = "modal";
  m.innerHTML = `<div class="modal ${wide?'wide':''}">
    <div class="modal-head"><h3>${title}</h3><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">${bodyHTML}</div>
    ${footerHTML ? `<div class="modal-foot">${footerHTML}</div>` : ""}
  </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", e => { if(e.target === m) closeModal(); });
}
function closeModal(){ const m = document.getElementById("modal"); if(m) m.remove(); }

/* ----- Toast ----- */
function toast(msg, type){
  const t = document.createElement("div");
  t.className = "toast toast-" + (type || "ok");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add("show"), 10);
  setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=> t.remove(), 300); }, 3000);
}

/* ----- Utilidades ----- */
function fmtFecha(iso){
  if(!iso) return "";
  const d = new Date(iso);
  if(isNaN(d)) return iso;
  const p = n => String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function soloFecha(iso){
  if(!iso) return "";
  const d = new Date(iso); if(isNaN(d)) return iso;
  const p = n => String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}`;
}
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function badgeEstado(estado){
  const map = {"Pendiente":"b-pend","Cancelada":"b-cancel","Atendida":"b-ok","Finalizado":"b-ok","En proceso":"b-proc"};
  return `<span class="badge ${map[estado]||'b-pend'}">${esc(estado)}</span>`;
}

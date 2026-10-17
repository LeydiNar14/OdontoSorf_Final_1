(function(){
  const user = renderShell("usuarios.html", "Administración de usuarios");
  if(!user) return;
  if(user.rol !== "administrador"){
    document.getElementById("content").innerHTML = `<div class="card"><div class="empty">Acceso restringido al administrador.</div></div>`;
    return;
  }
  const c = document.getElementById("content");
  const ROLES = ["odontologa","recepcionista","administrador"];

  c.innerHTML = `
    <div class="toolbar"><button class="btn" id="nuevo" style="margin-left:auto">+ Nuevo usuario</button></div>
    <div class="card"><div id="tabla"></div></div>`;

  async function cargar(){
    const tabla = document.getElementById("tabla");
    tabla.innerHTML = `<div class="empty">Cargando...</div>`;
    try{
      const lista = await api("/usuarios/");
      tabla.innerHTML = `<table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
        <tbody>${lista.map(u => `<tr>
          <td>${esc(u.nombre)}</td><td>${esc(u.correo)}</td>
          <td><select class="btn-sm" style="padding:5px" onchange='cambiarRol("${u.id}", this.value)'>
            ${ROLES.map(r=>`<option value="${r}" ${r===u.rol?"selected":""}>${rolLabel(r)}</option>`).join("")}
          </select></td>
          <td>${u.activo ? `<span class="badge b-ok">Activo</span>` : `<span class="badge b-inact">Inactivo</span>`}</td>
          <td style="text-align:right;white-space:nowrap">
            <button class="btn-ghost btn-sm" onclick='editar("${u.id}","${esc(u.nombre)}","${esc(u.correo)}")'>Editar</button>
            ${u.activo ? `<button class="btn-danger btn-sm" onclick='desactivar("${u.id}")'>Desactivar</button>` : ""}
          </td></tr>`).join("")}</tbody></table>`;
    }catch(ex){ tabla.innerHTML = `<div class="empty">Error: ${esc(ex.detail||"")}</div>`; }
  }

  document.getElementById("nuevo").addEventListener("click", modalNuevo);

  window.cambiarRol = async function(id, rol){
    try{ await api(`/usuarios/${id}/rol`, { method:"PUT", body:{ rol } }); toast("Rol actualizado"); }
    catch(ex){ toast(ex.detail||"Error","err"); cargar(); }
  };
  window.desactivar = function(id){
    openModal("Desactivar usuario", `<p>¿Confirma desactivar esta cuenta? No podrá iniciar sesión, pero sus registros se conservan.</p>`,
      `<button class="btn-ghost" onclick="closeModal()">No</button><button class="btn-danger" id="ok">Sí, desactivar</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      try{ await api(`/usuarios/${id}/desactivar`, { method:"PUT" }); closeModal(); toast("Usuario desactivado"); cargar(); }
      catch(ex){ toast(ex.detail||"Error","err"); }
    });
  };
  window.editar = function(id, nombre, correo){
    openModal("Editar usuario", `<div class="form-grid">
        <div class="field"><label>Nombre</label><input id="e_nombre" value="${nombre}"></div>
        <div class="field"><label>Correo</label><input id="e_correo" type="email" value="${correo}"></div>
      </div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn" id="ok">Guardar</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      try{ await api(`/usuarios/${id}`, { method:"PUT", body:{ nombre:val("e_nombre"), correo:val("e_correo") } });
        closeModal(); toast("Usuario actualizado"); cargar();
      }catch(ex){ toast(ex.detail||"Error","err"); }
    });
  };

  function modalNuevo(){
    openModal("Crear nuevo usuario", `<div class="form-grid">
        <div class="field"><label>Nombre completo *</label><input id="n_nombre"></div>
        <div class="field"><label>Correo *</label><input id="n_correo" type="email"></div>
        <div class="field"><label>Contraseña *</label><input id="n_pass" type="password"></div>
        <div class="field"><label>Rol *</label><select id="n_rol">${ROLES.map(r=>`<option value="${r}">${rolLabel(r)}</option>`).join("")}</select></div>
      </div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn" id="ok">Crear usuario</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      const body = { nombre:val("n_nombre"), correo:val("n_correo"), password:val("n_pass"), rol:val("n_rol") };
      if(!body.nombre || !body.correo || !body.password){ toast("Todos los campos son obligatorios","err"); return; }
      try{ await api("/usuarios/", { method:"POST", body });
        closeModal(); toast("Usuario creado"); cargar();
      }catch(ex){ toast(ex.detail || "No se pudo crear (¿correo duplicado?)","err"); }
    });
  }
  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ""; };

  cargar();
})();

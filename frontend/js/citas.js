(function(){
  const user = renderShell("citas.html", "Agenda de citas");
  if(!user) return;
  const puede = ["recepcionista","odontologa"].includes(user.rol);
  const c = document.getElementById("content");
  const hoyStr = new Date().toISOString().slice(0,10);

  c.innerHTML = `
    <div class="toolbar">
      <div class="field" style="flex-direction:row;align-items:center;gap:8px">
        <label style="margin:0">Fecha:</label>
        <input type="date" id="fecha" value="${hoyStr}">
        <button class="btn-ghost btn-sm" id="todas">Ver todas</button>
      </div>
      ${puede ? `<button class="btn" id="nueva" style="margin-left:auto">+ Agendar cita</button>` : ""}
    </div>
    <div class="card"><div id="tabla"></div></div>`;

  async function cargar(){
    const fecha = document.getElementById("fecha").value;
    const tabla = document.getElementById("tabla");
    tabla.innerHTML = `<div class="empty">Cargando...</div>`;
    try{
      const lista = await api("/citas/" + (fecha ? "?fecha="+fecha : ""));
      if(!lista.length){ tabla.innerHTML = `<div class="empty">No hay citas para mostrar.</div>`; return; }
      tabla.innerHTML = `<table><thead><tr>
        <th>Fecha</th><th>Hora</th><th>Paciente</th><th>Motivo</th><th>Estado</th><th></th>
        </tr></thead><tbody>${lista.map(x => `<tr>
          <td>${esc(x.fecha)}</td><td><strong>${esc(x.hora)}</strong></td>
          <td>${esc(x.paciente_nombre)}</td><td>${esc(x.motivo)}</td><td>${badgeEstado(x.estado)}</td>
          <td style="text-align:right;white-space:nowrap">
            ${puede && x.estado!=="Cancelada" ? `
              <button class="btn-ghost btn-sm" onclick='reprogramar("${x.id}","${x.fecha}","${x.hora}")'>Reprogramar</button>
              <button class="btn-danger btn-sm" onclick='cancelar("${x.id}")'>Cancelar</button>` : ""}
          </td></tr>`).join("")}</tbody></table>`;
    }catch(ex){ tabla.innerHTML = `<div class="empty">Error: ${esc(ex.detail||"")}</div>`; }
  }

  document.getElementById("fecha").addEventListener("change", cargar);
  document.getElementById("todas").addEventListener("click", () => { document.getElementById("fecha").value = ""; cargar(); });
  if(puede) document.getElementById("nueva").addEventListener("click", modalNueva);

  window.cancelar = function(id){
    openModal("Cancelar cita", `<p>¿Confirma la cancelación de esta cita?</p>
      <div class="field" style="margin-top:12px"><label>Motivo (opcional)</label><input id="motivo"></div>`,
      `<button class="btn-ghost" onclick="closeModal()">No</button>
       <button class="btn-danger" id="ok">Sí, cancelar</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      try{ await api("/citas/"+id+"/cancelar", { method:"PUT", body:{ motivo: val("motivo") } });
        closeModal(); toast("Cita cancelada"); cargar();
      }catch(ex){ toast(ex.detail||"Error","err"); }
    });
  };

  window.reprogramar = function(id, fecha, hora){
    openModal("Reprogramar cita", `<div class="form-grid">
        <div class="field"><label>Nueva fecha</label><input type="date" id="r_fecha" value="${fecha}"></div>
        <div class="field"><label>Nueva hora</label><input type="time" id="r_hora" value="${hora}"></div>
      </div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button>
       <button class="btn" id="ok">Guardar</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      try{ await api("/citas/"+id, { method:"PUT", body:{ fecha: val("r_fecha"), hora: val("r_hora") } });
        closeModal(); toast("Cita reprogramada"); cargar();
      }catch(ex){ toast(ex.detail||"Horario no disponible","err"); }
    });
  };

  async function modalNueva(){
    let pacientes = [];
    try{ pacientes = await api("/pacientes/"); }catch(ex){}
    const opciones = pacientes.map(p => `<option value="${p.id}">${esc(p.nombres)} ${esc(p.apellidos)} — ${esc(p.documento)}</option>`).join("");
    openModal("Agendar nueva cita", `<div class="form-grid">
        <div class="field full"><label>Paciente *</label><select id="c_pac">${opciones}</select></div>
        <div class="field"><label>Fecha *</label><input type="date" id="c_fecha" value="${hoyStr}"></div>
        <div class="field"><label>Hora *</label><input type="time" id="c_hora" value="09:00"></div>
        <div class="field full"><label>Motivo *</label><input id="c_motivo" placeholder="Valoración, control, limpieza..."></div>
        <div class="field full"><label>Profesional</label><input id="c_prof" value="Dra. Laura Gómez"></div>
      </div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button>
       <button class="btn" id="ok">Agendar</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      const body = { paciente_id: val("c_pac"), fecha: val("c_fecha"), hora: val("c_hora"),
                     motivo: val("c_motivo"), profesional: val("c_prof") };
      if(!body.paciente_id || !body.motivo){ toast("Seleccione paciente e indique el motivo","err"); return; }
      try{ await api("/citas/", { method:"POST", body });
        closeModal(); toast("Cita agendada"); cargar();
      }catch(ex){ toast(ex.detail || "No se pudo agendar","err"); }
    });
  }
  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ""; };

  cargar();
})();

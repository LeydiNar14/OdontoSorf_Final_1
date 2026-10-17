/* ===== Sala de espera ===== 
   Atención de pacientes por orden de llegada (estructura Cola / FIFO en el backend). */
(function () {
  const user = renderShell("sala.html", "Sala de espera");
  if (!user) return;
  const puede = ["recepcionista", "odontologa"].includes(user.rol);
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="toolbar">
      <div class="field" style="flex-direction:row;align-items:center;gap:8px;flex-wrap:wrap;margin:0">
        <label style="margin:0">Registrar llegada:</label>
        <select id="pac" style="min-width:230px"></select>
        <button class="btn btn-sm" id="add" ${puede ? "" : "disabled"}>+ A la sala</button>
      </div>
      <button class="btn-light" id="next" style="margin-left:auto" ${puede ? "" : "disabled"}>▶ Llamar siguiente</button>
    </div>
    <div class="grid kpis" id="kpis"></div>
    <div class="card"><div class="card-head"><h2>Pacientes en espera</h2><span style="font-size:12px;color:#64748b">orden de llegada</span></div>
      <div class="card-body"><div id="espera"></div></div></div>
    <div class="card"><div class="card-head"><h2>En atención</h2></div>
      <div class="card-body"><div id="atencion"></div></div></div>`;

  async function cargarPacientes() {
    try {
      const pacientes = await api("/pacientes/");
      document.getElementById("pac").innerHTML = pacientes.map(p =>
        `<option value="${p.id}">${esc(p.nombres)} ${esc(p.apellidos)} — ${esc(p.documento)}</option>`).join("");
    } catch (e) {}
  }

  async function cargar() {
    try {
      const est = await api("/turnos/");
      const esp = est.en_espera || [], at = est.en_atencion || [];

      document.getElementById("kpis").innerHTML = `
        <div class="kpi"><div class="num">${est.total_en_espera}</div><div class="lbl">En espera</div></div>
        <div class="kpi green"><div class="num">${at.length}</div><div class="lbl">En atención</div></div>
        <div class="kpi amber"><div class="num">${est.siguiente ? esc(est.siguiente.paciente_nombre.split(" ")[0]) : "—"}</div><div class="lbl">Siguiente</div></div>`;

      const espera = document.getElementById("espera");
      espera.innerHTML = esp.length ? `<div class="queue">` + esp.map((t, i) =>
        (i > 0 ? `<span class="queue-arrow">→</span>` : "") +
        `<div class="queue-item ${i === 0 ? "frente" : ""}">${i === 0 ? '<span class="q-tag">siguiente</span>' : ""}
          <div class="q-ord">Turno ${t.orden}</div><div class="q-name">${esc(t.paciente_nombre)}</div></div>`
      ).join("") + `</div>` : `<div class="empty">No hay pacientes en espera.</div>`;

      const aten = document.getElementById("atencion");
      aten.innerHTML = at.length ? `<table><tbody>${at.map(t => `<tr>
        <td><strong>${esc(t.paciente_nombre)}</strong></td><td>Turno ${t.orden}</td>
        <td style="text-align:right">${puede ? `<button class="btn-ghost btn-sm" onclick='finalizar("${t.id}")'>Finalizar atención</button>` : ""}</td>
        </tr>`).join("")}</tbody></table>` : `<div class="empty">Nadie en atención.</div>`;
    } catch (e) { toast(e.detail || "Error al cargar la sala", "err"); }
  }

  window.finalizar = async function (id) {
    try { await api(`/turnos/${id}/finalizar`, { method: "PUT" }); toast("Atención finalizada"); cargar(); }
    catch (e) { toast(e.detail || "Error", "err"); }
  };

  if (puede) {
    document.getElementById("add").addEventListener("click", async () => {
      const pid = document.getElementById("pac").value;
      if (!pid) return;
      try { await api("/turnos/encolar", { method: "POST", body: { paciente_id: pid } }); toast("Paciente registrado en la sala"); cargar(); }
      catch (e) { toast(e.detail || "Error", "err"); }
    });
    document.getElementById("next").addEventListener("click", async () => {
      try { const r = await api("/turnos/siguiente", { method: "POST" }); toast(r.mensaje); cargar(); }
      catch (e) { toast(e.detail || "No hay pacientes en espera", "err"); }
    });
  }

  cargarPacientes();
  cargar();
})();

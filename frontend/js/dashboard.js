(async function(){
  const user = renderShell("dashboard.html", "Inicio");
  if(!user) return;
  const c = document.getElementById("content");
  c.innerHTML = `<p style="color:#64748b;margin-bottom:18px">Bienvenido(a), <strong>${esc(user.nombre)}</strong>. Resumen de la actividad del consultorio.</p>
    <div class="grid kpis" id="kpis"></div>
    <div class="card"><div class="card-head"><h2>Citas de hoy</h2><a class="btn btn-sm" href="citas.html">Ver agenda</a></div>
      <div id="hoy"></div></div>`;

  const hoyStr = new Date().toISOString().slice(0,10);
  try{
    const pacientes = await api("/pacientes/");
    const todas = await api("/citas/");
    const citasHoy = todas.filter(x => x.fecha === hoyStr);
    const pendientes = todas.filter(x => x.estado === "Pendiente");

    document.getElementById("kpis").innerHTML = `
      <div class="kpi"><div class="num">${citasHoy.length}</div><div class="lbl">Citas para hoy</div></div>
      <div class="kpi green"><div class="num">${pacientes.length}</div><div class="lbl">Pacientes registrados</div></div>
      <div class="kpi amber"><div class="num">${pendientes.length}</div><div class="lbl">Citas pendientes</div></div>
      <div class="kpi purple"><div class="num">${todas.length}</div><div class="lbl">Citas totales</div></div>`;

    const cont = document.getElementById("hoy");
    if(!citasHoy.length){ cont.innerHTML = `<div class="empty">No hay citas programadas para hoy.</div>`; return; }
    cont.innerHTML = `<table><thead><tr><th>Hora</th><th>Paciente</th><th>Motivo</th><th>Profesional</th><th>Estado</th></tr></thead>
      <tbody>${citasHoy.map(x => `<tr>
        <td><strong>${esc(x.hora)}</strong></td><td>${esc(x.paciente_nombre)}</td>
        <td>${esc(x.motivo)}</td><td>${esc(x.profesional||"")}</td><td>${badgeEstado(x.estado)}</td>
      </tr>`).join("")}</tbody></table>`;
  }catch(ex){ c.innerHTML += `<div class="empty">No se pudo cargar la información: ${esc(ex.detail||"")}.</div>`; }
})();

(function(){
  const user = renderShell("historia.html", "Historia clínica");
  if(!user) return;
  const c = document.getElementById("content");
  const params = new URLSearchParams(location.search);
  let pacienteId = params.get("paciente");
  let odoApi = null;   // API del odontograma de trabajo (para la función Deshacer)

  c.innerHTML = `
    <div class="toolbar">
      <div class="search" style="max-width:420px"><input id="q" placeholder="Buscar paciente por nombre o documento..."></div>
      <div id="selInfo" style="color:#64748b"></div>
    </div>
    <div id="sugerencias" class="card" style="display:none"><div id="lista"></div></div>
    <div id="hc"></div>`;

  let timer;
  document.getElementById("q").addEventListener("input", e => {
    clearTimeout(timer); timer = setTimeout(()=> buscar(e.target.value), 250);
  });

  async function buscar(q){
    const box = document.getElementById("sugerencias");
    const lista = document.getElementById("lista");
    if(!q){ box.style.display="none"; return; }
    try{
      const res = await api("/pacientes/?q=" + encodeURIComponent(q));
      box.style.display = "block";
      if(!res.length){ lista.innerHTML = `<div class="empty">Sin resultados</div>`; return; }
      lista.innerHTML = `<table><tbody>${res.map(p => `<tr>
        <td>${esc(p.nombres)} ${esc(p.apellidos)}</td><td>${esc(p.documento)}</td>
        <td style="text-align:right"><button class="btn btn-sm" onclick='abrir("${p.id}")'>Abrir historia</button></td>
      </tr>`).join("")}</tbody></table>`;
    }catch(ex){}
  }

  window.abrir = function(id){
    pacienteId = id;
    document.getElementById("sugerencias").style.display = "none";
    document.getElementById("q").value = "";
    cargar();
  };

  async function cargar(){
    const hc = document.getElementById("hc");
    if(!pacienteId){ hc.innerHTML = `<div class="card"><div class="empty">Busque y seleccione un paciente para ver su historia clínica.</div></div>`; return; }
    hc.innerHTML = `<div class="card"><div class="empty">Cargando historia clínica...</div></div>`;
    try{
      const p = await api("/pacientes/" + pacienteId);
      const h = await api("/historias/" + pacienteId);
      document.getElementById("selInfo").innerHTML = `Paciente: <strong>${esc(p.nombres)} ${esc(p.apellidos)}</strong> · ${esc(p.tipo_documento||"CC")} ${esc(p.documento)}`;
      render(p, h);
    }catch(ex){ hc.innerHTML = `<div class="card"><div class="empty">Error: ${esc(ex.detail||"")}</div></div>`; }
  }

  function render(p, h){
    const ant = h.antecedentes || {};
    const hc = document.getElementById("hc");
    hc.innerHTML = `
      <div class="card"><div class="card-head"><h2>🦷 Datos clínicos — ${esc(p.nombres)} ${esc(p.apellidos)}</h2>
        <button class="btn" id="btnNueva">+ Nueva valoración</button></div>
        <div class="card-body">
          <div class="section-title">Antecedentes</div>
          <div class="form-grid">
            <div class="field"><label>Enfermedades</label><input id="a_enf" value="${esc(ant.enfermedades||"")}"></div>
            <div class="field"><label>Medicamentos</label><input id="a_med" value="${esc(ant.medicamentos||"")}"></div>
            <div class="field"><label>Alergias</label><input id="a_ale" value="${esc(ant.alergias||p.alergias||"")}"></div>
            <div class="field"><label>Cirugías</label><input id="a_cir" value="${esc(ant.cirugias||"")}"></div>
          </div>
          <div style="margin-top:10px"><button class="btn-light btn-sm" id="btnAnt">Guardar antecedentes</button></div>
        </div>
      </div>

      <div class="card"><div class="card-head"><h2>Odontograma</h2>
        <button class="btn-ghost btn-sm" id="btnDeshacer">↶ Deshacer</button></div>
        <div class="card-body">
          <div id="odoTrabajo"></div>
          <div id="odoCambios" style="margin-top:10px"></div>
        </div></div>

      <div class="card"><div class="card-head"><h2>Plan de tratamiento</h2>
        <button class="btn btn-sm" id="btnProc">+ Procedimiento</button></div>
        <div id="plan"></div></div>

      <div class="card"><div class="card-head"><h2>Secuencia recomendada de procedimientos</h2></div>
        <div class="card-body">
          <p style="font-size:12.5px;color:#64748b;margin-bottom:8px">Selecciona los procedimientos a realizar; el sistema calcula el orden clínico recomendado y agrega los pasos previos necesarios.</p>
          <div id="secProcs" style="display:flex;flex-wrap:wrap;gap:10px 18px;margin-bottom:10px"></div>
          <button class="btn btn-sm" id="btnSecuencia">Calcular secuencia</button>
          <div id="secResultado" style="margin-top:10px"></div>
        </div></div>

      <div class="card"><div class="card-head"><h2>Evolución / Valoraciones</h2></div>
        <div class="card-body"><div class="timeline" id="timeline"></div></div></div>`;

    // Plan de tratamiento
    const plan = document.getElementById("plan");
    const procs = h.plan_tratamiento || [];
    plan.innerHTML = procs.length ? `<table><thead><tr><th>Diente</th><th>Tratamiento</th><th>Estado</th><th>Fecha</th><th></th></tr></thead>
      <tbody>${procs.map(pr => `<tr>
        <td><strong>${esc(pr.diente)}</strong></td><td>${esc(pr.tratamiento)}</td><td>${badgeEstado(pr.estado)}</td>
        <td>${soloFecha(pr.fecha)}</td>
        <td style="text-align:right">
          <select class="btn-sm" onchange='cambiarEstado("${pr.id}", this.value)' style="padding:5px">
            ${["Pendiente","En proceso","Finalizado"].map(s=>`<option ${s===pr.estado?"selected":""}>${s}</option>`).join("")}
          </select></td></tr>`).join("")}</tbody></table>`
      : `<div class="empty">Sin procedimientos en el plan.</div>`;

    // Timeline de valoraciones
    const tl = document.getElementById("timeline");
    const vals = h.valoraciones || [];
    tl.innerHTML = vals.length ? vals.map(v => `
      <div class="tl-item">
        <div class="tl-date">${fmtFecha(v.fecha)}</div>
        <div class="tl-card">
          <h4>${esc(v.motivo)}</h4>
          ${v.anamnesis ? `<p><strong>Anamnesis:</strong> ${esc(v.anamnesis)}</p>` : ""}
          ${v.observaciones ? `<p><strong>Observaciones:</strong> ${esc(v.observaciones)}</p>` : ""}
          <p><strong>Odontograma:</strong></p><div>${resumenOdontograma(v.odontograma)}</div>
          ${(v.archivos&&v.archivos.length) ? `<p style="margin-top:6px"><strong>Adjuntos:</strong> ${v.archivos.map(a=>`<a class="chip" href="${API_BASE}/historias/archivos/${a.file_id}" target="_blank">📎 ${esc(a.filename)}</a>`).join("")}</p>`:""}
          <button class="btn-ghost btn-sm" style="margin-top:8px" onclick='verOdontograma("${v.id}")'>Ver odontograma completo</button>
        </div>
      </div>`).join("") : `<div class="empty">Sin valoraciones registradas.</div>`;

    window._valoraciones = vals;

    document.getElementById("btnNueva").addEventListener("click", () => modalValoracion(p));
    document.getElementById("btnAnt").addEventListener("click", guardarAntecedentes);
    document.getElementById("btnProc").addEventListener("click", modalProcedimiento);
    document.getElementById("btnDeshacer").addEventListener("click", deshacerOdontograma);
    document.getElementById("btnSecuencia").addEventListener("click", calcularSecuencia);
    cargarOdontogramaTrabajo();
    cargarCatalogoProcedimientos();
  }

  // ----- Odontograma de trabajo con Deshacer (estructura Pila) -----
  async function cargarOdontogramaTrabajo(){
    try{
      const est = await api("/odontograma/" + pacienteId);
      odoApi = renderOdontograma(document.getElementById("odoTrabajo"), est.odontograma_actual, {
        editable: true,
        onChange: async (diente, estado) => {
          try{ await api(`/odontograma/${pacienteId}/cambio`, { method:"POST", body:{ diente, estado } }); refrescarPila(); }
          catch(ex){ toast(ex.detail||"Error","err"); }
        }
      });
      pintarPila(est);
    }catch(ex){ document.getElementById("odoTrabajo").innerHTML = `<div class="empty">No disponible</div>`; }
  }
  async function refrescarPila(){ try{ pintarPila(await api("/odontograma/" + pacienteId)); }catch(ex){} }
  function pintarPila(est){
    const btn = document.getElementById("btnDeshacer");
    if(btn) btn.disabled = !est.puede_deshacer;
    const pila = est.pila_deshacer || [];
    document.getElementById("odoCambios").innerHTML = pila.length
      ? `<div style="font-size:12px;color:#64748b">Cambios recientes (se pueden deshacer): ` +
        pila.slice(0,6).map(ch => `<span class="chip">${esc(ch.diente)}: ${esc(ch.nuevo)}</span>`).join("") + `</div>`
      : `<div style="font-size:12px;color:#94a3b8">Sin cambios recientes.</div>`;
  }
  async function deshacerOdontograma(){
    try{
      const r = await api(`/odontograma/${pacienteId}/deshacer`, { method:"POST" });
      const est = await api("/odontograma/" + pacienteId);
      if(odoApi) odoApi.setValores(est.odontograma_actual);
      pintarPila(est); toast(r.mensaje);
    }catch(ex){ toast(ex.detail||"No hay cambios para deshacer","err"); }
  }

  // ----- Secuencia recomendada de procedimientos (estructura Grafo) -----
  async function cargarCatalogoProcedimientos(){
    const cont = document.getElementById("secProcs");
    try{
      const procs = await api("/estructuras/procedimientos");
      if(!procs.length){
        cont.innerHTML = `<div style="font-size:12.5px;color:#c62828">No hay procedimientos cargados en la base de datos. Ejecute <b>cargar_procedimientos.py</b> (o <b>seed.py</b>) en el backend para crear la colección <b>procedimientos</b>.</div>`;
        return;
      }
      cont.innerHTML = procs.map(p =>
        `<label style="font-size:12.5px;display:flex;align-items:center;gap:5px"><input type="checkbox" value="${p.codigo}"> ${esc(p.nombre)}</label>`).join("");
    }catch(ex){
      cont.innerHTML = `<div style="font-size:12.5px;color:#c62828">No se pudo cargar el catálogo de procedimientos.</div>`;
    }
  }
  async function calcularSecuencia(){
    const sel = Array.from(document.querySelectorAll("#secProcs input:checked")).map(x => x.value);
    if(!sel.length){ toast("Selecciona al menos un procedimiento","err"); return; }
    try{
      const r = await api("/estructuras/plan-orden", { method:"POST", body:{ procedimientos: sel } });
      const pre = r.incluye_prerrequisitos.length
        ? `<div style="font-size:12px;color:#64748b;margin-bottom:6px">Pasos previos necesarios: ${r.incluye_prerrequisitos.map(esc).join(", ")}</div>` : "";
      const chips = r.orden_nombres.map((nom,i) =>
        `<span class="chip-ord"><span class="n">${i+1}</span>${esc(nom)}</span>`).join('<span class="ord-arrow">→</span>');
      document.getElementById("secResultado").innerHTML = pre + `<div class="chips-order">${chips}</div>`;
    }catch(ex){ toast(ex.detail||"Error","err"); }
  }

  window.verOdontograma = function(valId){
    const v = (window._valoraciones||[]).find(x => x.id === valId);
    if(!v) return;
    openModal("Odontograma — " + fmtFecha(v.fecha), `<div id="odoView"></div>`, `<button class="btn-ghost" onclick="closeModal()">Cerrar</button>`, true);
    renderOdontograma(document.getElementById("odoView"), v.odontograma, { editable:false });
  };

  window.cambiarEstado = async function(procId, estado){
    try{ await api(`/historias/${pacienteId}/tratamiento/${procId}`, { method:"PUT", body:{ estado } });
      toast("Estado actualizado"); cargar();
    }catch(ex){ toast(ex.detail||"Error","err"); }
  };

  async function guardarAntecedentes(){
    const body = { enfermedades:val("a_enf"), medicamentos:val("a_med"), alergias:val("a_ale"), cirugias:val("a_cir") };
    try{ await api(`/historias/${pacienteId}/antecedentes`, { method:"PUT", body });
      toast("Antecedentes guardados");
    }catch(ex){ toast(ex.detail||"Error","err"); }
  }

  function modalProcedimiento(){
    openModal("Agregar procedimiento al plan", `<div class="form-grid">
        <div class="field"><label>Diente (FDI) *</label><input id="p_diente" placeholder="16, 37..."></div>
        <div class="field"><label>Estado</label><select id="p_estado"><option>Pendiente</option><option>En proceso</option><option>Finalizado</option></select></div>
        <div class="field full"><label>Tratamiento *</label><input id="p_trat" placeholder="Resina, endodoncia, exodoncia..."></div>
        <div class="field full"><label>Observaciones</label><input id="p_obs"></div>
      </div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn" id="ok">Agregar</button>`);
    document.getElementById("ok").addEventListener("click", async () => {
      const body = { diente:val("p_diente"), tratamiento:val("p_trat"), estado:val("p_estado"), observaciones:val("p_obs") };
      if(!body.diente || !body.tratamiento){ toast("Diente y tratamiento son obligatorios","err"); return; }
      try{ await api(`/historias/${pacienteId}/tratamiento`, { method:"POST", body });
        closeModal(); toast("Procedimiento agregado"); cargar();
      }catch(ex){ toast(ex.detail||"Error","err"); }
    });
  }

  function modalValoracion(p){
    const actual = odoApi ? odoApi.getValores() : {};
    openModal("Nueva valoración clínica", `
      <div class="form-grid">
        <div class="field full"><label>Motivo de consulta *</label><input id="v_motivo"></div>
        <div class="field full"><label>Anamnesis</label><textarea id="v_anam" rows="2"></textarea></div>
      </div>
      <div class="section-title">Odontograma que se guardará (estado actual)</div>
      <div id="odoEdit"></div>
      <div class="field full" style="margin-top:14px"><label>Observaciones</label><textarea id="v_obs" rows="2"></textarea></div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn" id="ok">Guardar valoración</button>`, true);

    renderOdontograma(document.getElementById("odoEdit"), actual, { editable:false });

    document.getElementById("ok").addEventListener("click", async () => {
      const body = { motivo:val("v_motivo"), anamnesis:val("v_anam"),
                     odontograma: actual, observaciones:val("v_obs") };
      if(!body.motivo){ toast("Indique el motivo de consulta","err"); return; }
      try{ await api(`/historias/${pacienteId}/valoraciones`, { method:"POST", body });
        closeModal(); toast("Valoración registrada"); cargar();
      }catch(ex){ toast(ex.detail||"No se pudo guardar","err"); }
    });
  }

  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ""; };
  cargar();
})();

(function(){
  const user = renderShell("pacientes.html", "Pacientes");
  if(!user) return;
  const puedeEditar = ["recepcionista","odontologa"].includes(user.rol);
  const esOdontologa = user.rol === "odontologa";
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="toolbar">
      <div class="search" style="position:relative">
        <input id="q" placeholder="Buscar por nombre, apellido o documento..." autocomplete="off">
        <div id="autocompletar" style="position:absolute;left:0;right:0;z-index:20"></div>
      </div>
      <select id="orden" style="padding:9px 10px;border:1px solid var(--line);border-radius:9px;font-size:13px;background:#fff">
        <option value="nombre">Ordenar: nombre</option>
        <option value="documento">Ordenar: documento</option>
      </select>
      ${puedeEditar ? `<button class="btn" id="nuevo">+ Nuevo paciente</button>` : ""}
    </div>
    <div class="card"><div id="tabla"></div></div>`;

  function renderTabla(lista){
    const tabla = document.getElementById("tabla");
    if(!lista.length){ tabla.innerHTML = `<div class="empty">No se encontraron pacientes.</div>`; return; }
    tabla.innerHTML = `<table><thead><tr>
      <th>Documento</th><th>Nombres</th><th>Apellidos</th><th>Teléfono</th><th>EPS</th><th></th>
      </tr></thead><tbody>${lista.map(p => `<tr>
        <td>${esc(p.tipo_documento||"CC")} ${esc(p.documento)}</td>
        <td>${esc(p.nombres)}</td><td>${esc(p.apellidos)}</td>
        <td>${esc(p.telefono||"-")}</td><td>${esc(p.eps||"-")}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn-ghost btn-sm" onclick='verFicha("${p.id}")'>Ver ficha</button>
          ${esOdontologa ? `<a class="btn btn-sm" href="historia.html?paciente=${p.id}">Historia</a>` : ""}
        </td></tr>`).join("")}</tbody></table>`;
  }

  async function cargar(q){
    const tabla = document.getElementById("tabla");
    tabla.innerHTML = `<div class="empty">Cargando...</div>`;
    try{
      const lista = await api("/pacientes/?q=" + encodeURIComponent(q||""));
      const orden = document.getElementById("orden").value;
      let ordenada = lista;
      if(orden === "documento"){
        // Orden por documento mediante el Árbol Binario de Búsqueda (recorrido inorden)
        try{
          const bst = await api("/estructuras/pacientes-bst");
          const pos = {}; bst.ordenados.forEach((p,i)=> pos[p.documento] = i);
          ordenada = [...lista].sort((a,b)=> (pos[a.documento] ?? 9999) - (pos[b.documento] ?? 9999));
        }catch(ex){}
      }else{
        ordenada = [...lista].sort((a,b)=> `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`));
      }
      renderTabla(ordenada);
    }catch(ex){ tabla.innerHTML = `<div class="empty">Error: ${esc(ex.detail||"")}</div>`; }
  }

  // Autocompletado de búsqueda (estructura Trie)
  async function autocompletar(q){
    const drop = document.getElementById("autocompletar");
    if(!q){ drop.innerHTML = ""; return; }
    try{
      const r = await api("/estructuras/autocompletar?prefijo=" + encodeURIComponent(q) + "&limite=6");
      drop.innerHTML = r.coincidencias.length
        ? `<div class="trie-drop">` + r.coincidencias.map(p =>
            `<div class="ti" style="cursor:pointer" onclick='verFicha("${p.id}")'><span>${esc(p.nombres)} ${esc(p.apellidos)}</span><small>${esc(p.documento)}</small></div>`).join("") + `</div>`
        : "";
    }catch(ex){}
  }

  let timer;
  document.getElementById("q").addEventListener("input", e => {
    clearTimeout(timer);
    const q = e.target.value;
    timer = setTimeout(()=> { cargar(q); autocompletar(q); }, 220);
  });
  document.getElementById("q").addEventListener("blur", ()=> setTimeout(()=>{ const d=document.getElementById("autocompletar"); if(d) d.innerHTML=""; }, 200));
  document.getElementById("orden").addEventListener("change", ()=> cargar(document.getElementById("q").value));
  if(puedeEditar) document.getElementById("nuevo").addEventListener("click", modalNuevo);

  window.verFicha = async function(id){
    const d = document.getElementById("autocompletar"); if(d) d.innerHTML = "";
    try{
      const p = await api("/pacientes/" + id);
      openModal("Ficha del paciente", `
        <div class="form-grid">
          ${campo("Nombres", p.nombres)} ${campo("Apellidos", p.apellidos)}
          ${campo("Documento", (p.tipo_documento||"CC")+" "+p.documento)} ${campo("Fecha de nacimiento", p.fecha_nacimiento||"-")}
          ${campo("Género", p.genero||"-")} ${campo("Teléfono", p.telefono||"-")}
          ${campo("Correo", p.correo||"-")} ${campo("EPS", p.eps||"-")}
          ${campo("Grupo sanguíneo", p.grupo_sanguineo||"-")} ${campo("Alergias", p.alergias||"-")}
          <div class="field full">${campo("Dirección", p.direccion||"-")}</div>
          ${p.acudiente ? `<div class="field full">${campo("Acudiente", p.acudiente)}</div>` : ""}
        </div>`,
        `${esOdontologa ? `<a class="btn" href="historia.html?paciente=${p.id}">Abrir historia clínica</a>` : ""}
         <button class="btn-ghost" onclick="closeModal()">Cerrar</button>`);
    }catch(ex){ toast(ex.detail||"Error", "err"); }
  };

  function campo(label, valor){
    return `<div class="field"><label>${label}</label>
      <div style="padding:8px 0;font-weight:600;color:#1e293b">${esc(valor)}</div></div>`;
  }

  function modalNuevo(){
    openModal("Registrar nuevo paciente", `
      <div class="form-grid">
        <div class="field"><label>Nombres *</label><input id="f_nombres"></div>
        <div class="field"><label>Apellidos *</label><input id="f_apellidos"></div>
        <div class="field"><label>Tipo de documento</label>
          <select id="f_tipo"><option>CC</option><option>TI</option><option>CE</option><option>PA</option></select></div>
        <div class="field"><label>Número de documento *</label><input id="f_doc"></div>
        <div class="field"><label>Fecha de nacimiento</label><input id="f_nac" type="date"></div>
        <div class="field"><label>Género</label>
          <select id="f_genero"><option value="">--</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select></div>
        <div class="field"><label>Teléfono</label><input id="f_tel"></div>
        <div class="field"><label>Correo</label><input id="f_correo" type="email"></div>
        <div class="field"><label>EPS</label><input id="f_eps"></div>
        <div class="field"><label>Grupo sanguíneo</label><input id="f_gs" placeholder="O+, A-, ..."></div>
        <div class="field full"><label>Dirección</label><input id="f_dir"></div>
        <div class="field full"><label>Acudiente (si es menor de edad)</label><input id="f_acu"></div>
        <div class="field full"><label>Alergias</label><input id="f_ale"></div>
      </div>`,
      `<button class="btn-ghost" onclick="closeModal()">Cancelar</button>
       <button class="btn" id="guardar">Registrar paciente</button>`);

    document.getElementById("guardar").addEventListener("click", async () => {
      const body = {
        nombres: val("f_nombres"), apellidos: val("f_apellidos"),
        tipo_documento: val("f_tipo"), documento: val("f_doc"),
        fecha_nacimiento: val("f_nac"), genero: val("f_genero"),
        telefono: val("f_tel"), correo: val("f_correo"), eps: val("f_eps"),
        grupo_sanguineo: val("f_gs"), direccion: val("f_dir"),
        acudiente: val("f_acu"), alergias: val("f_ale"),
      };
      if(!body.nombres || !body.apellidos || !body.documento){ toast("Nombres, apellidos y documento son obligatorios", "err"); return; }
      try{
        await api("/pacientes/", { method:"POST", body });
        closeModal(); toast("Paciente registrado correctamente"); cargar(document.getElementById("q").value);
      }catch(ex){ toast(ex.detail || "No se pudo registrar", "err"); }
    });
  }
  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ""; };

  cargar("");
})();

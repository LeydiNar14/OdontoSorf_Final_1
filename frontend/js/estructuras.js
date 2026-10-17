/* ===== Página "Estructuras de datos": demostración visual de las 5 estructuras ===== */
(function () {
  const user = renderShell("estructuras.html", "Estructuras de datos");
  if (!user) return;
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="est-why" style="margin-bottom:16px"><b>Anexo técnico (para evaluación).</b> En el producto, estas estructuras están integradas de forma transparente dentro de los módulos (Sala de espera, Pacientes e Historia clínica). Esta página las reúne en un solo lugar para verificar su funcionamiento.</div>
    <p style="color:#64748b;margin-bottom:18px">OdontoSoft implementa <b>5 estructuras de datos</b> (2 lineales, 2 jerárquicas y 1 grafo), cada una resolviendo una necesidad real de la clínica.</p>

    <div class="card"><div class="card-head"><h2>1 · Cola (FIFO) <span class="badge-struct">lineal</span></h2></div>
      <div class="card-body">
        <div class="est-why"><b>Uso:</b> sala de espera. Los pacientes se atienden en el orden en que llegan (el primero en entrar es el primero en salir). <b>Operaciones:</b> encolar y desencolar O(1).</div>
        <div class="est-controls">
          <div class="field"><label>Agregar paciente a la cola</label><select id="cola-pac"></select></div>
          <button class="btn btn-sm" id="cola-encolar">Encolar</button>
          <button class="btn-light btn-sm" id="cola-siguiente">▶ Llamar siguiente (desencolar)</button>
        </div>
        <div id="cola-view"></div>
      </div></div>

    <div class="card"><div class="card-head"><h2>2 · Pila (LIFO) — Deshacer odontograma <span class="badge-struct">lineal</span></h2></div>
      <div class="card-body">
        <div class="est-why"><b>Uso:</b> deshacer (undo) cambios en el odontograma. El último cambio aplicado es el primero en revertirse. <b>Operaciones:</b> apilar y desapilar O(1).</div>
        <div id="pila-cont"></div>
      </div></div>

    <div class="card"><div class="card-head"><h2>3 · Trie — Autocompletado <span class="badge-struct">jerárquica</span></h2></div>
      <div class="card-body">
        <div class="est-why"><b>Uso:</b> búsqueda de pacientes por prefijo (nombre, apellido o documento). El tiempo de búsqueda depende de la longitud del texto, no del número de pacientes. <b>Búsqueda:</b> O(L).</div>
        <div class="trie-box">
          <div class="field"><label>Escribe un prefijo</label><input id="trie-input" placeholder="Ej.: mar, car, 109..." autocomplete="off"></div>
          <div id="trie-drop"></div>
        </div>
      </div></div>

    <div class="card"><div class="card-head"><h2>4 · Árbol Binario de Búsqueda — Pacientes por documento <span class="badge-struct">jerárquica</span></h2></div>
      <div class="card-body">
        <div class="est-why"><b>Uso:</b> índice de pacientes ordenados por número de documento. El recorrido <i>inorden</i> los devuelve ordenados y la búsqueda es O(log n) si el árbol está equilibrado.</div>
        <div class="est-controls">
          <div class="field"><label>Buscar por documento (en el BST)</label><input id="bst-doc" placeholder="1006148034"></div>
          <button class="btn btn-sm" id="bst-buscar">Buscar</button>
          <div id="bst-stats" style="color:#64748b;font-size:12.5px"></div>
        </div>
        <div id="bst-result" style="margin-bottom:8px"></div>
        <div class="section-title">Recorrido inorden (orden ascendente)</div>
        <div id="bst-inorden" class="chips-order"></div>
        <div class="section-title" style="margin-top:14px">Forma del árbol</div>
        <div class="svg-wrap"><div id="bst-svg"></div></div>
      </div></div>

    <div class="card"><div class="card-head"><h2>5 · Grafo dirigido — Dependencias de procedimientos <span class="badge-struct">grafo</span></h2></div>
      <div class="card-body">
        <div class="est-why"><b>Uso:</b> precedencias entre procedimientos del plan de tratamiento (A → B significa "A antes que B"). El <b>orden topológico</b> (algoritmo de Kahn, O(V+E)) calcula una secuencia válida de ejecución y detecta inconsistencias (ciclos).</div>
        <div class="section-title">Grafo de dependencias</div>
        <div class="svg-wrap"><div id="grafo-svg"></div></div>
        <div class="section-title" style="margin-top:14px">Orden topológico del catálogo completo</div>
        <div id="grafo-orden" class="chips-order"></div>
        <div class="section-title" style="margin-top:16px">Calcular el orden de un plan de tratamiento</div>
        <p style="font-size:12.5px;color:#64748b;margin-bottom:8px">Selecciona procedimientos; el sistema añade los prerrequisitos y calcula el orden.</p>
        <div id="grafo-checks" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px"></div>
        <button class="btn btn-sm" id="grafo-plan">Calcular orden del plan</button>
        <div id="grafo-plan-result" style="margin-top:10px"></div>
      </div></div>
  `;

  // ---------------- 1 · COLA ----------------
  async function cargarCola() {
    try {
      const estado = await api("/turnos/");
      const cont = document.getElementById("cola-view");
      const esp = estado.en_espera || [];
      let html = `<div style="font-size:12.5px;color:#64748b;margin-top:6px">Sala de espera (${estado.total_en_espera}):</div><div class="queue">`;
      if (!esp.length) html += `<span class="empty" style="padding:10px">Cola vacía</span>`;
      esp.forEach((t, i) => {
        if (i > 0) html += `<span class="queue-arrow">→</span>`;
        html += `<div class="queue-item ${i === 0 ? "frente" : ""}">${i === 0 ? '<span class="q-tag">frente</span>' : ""}
          <div class="q-ord">Turno ${t.orden}</div><div class="q-name">${esc(t.paciente_nombre)}</div></div>`;
      });
      html += `</div>`;
      if ((estado.en_atencion || []).length) {
        html += `<div style="font-size:12.5px;color:#64748b;margin-top:12px">En atención:</div><div class="queue">`;
        estado.en_atencion.forEach(t => {
          html += `<div class="queue-item" style="border-color:var(--green)"><div class="q-ord">Turno ${t.orden}</div><div class="q-name">${esc(t.paciente_nombre)} 🦷</div></div>`;
        });
        html += `</div>`;
      }
      cont.innerHTML = html;
    } catch (e) { toast(e.detail || "Error al cargar la cola", "err"); }
  }

  async function initCola() {
    const sel = document.getElementById("cola-pac");
    try {
      const pacientes = await api("/pacientes/");
      sel.innerHTML = pacientes.map(p => `<option value="${p.id}">${esc(p.nombres)} ${esc(p.apellidos)}</option>`).join("");
    } catch (e) {}
    const esRecepOdo = ["recepcionista", "odontologa"].includes(user.rol);
    const bEnc = document.getElementById("cola-encolar");
    const bSig = document.getElementById("cola-siguiente");
    if (!esRecepOdo) {
      bEnc.disabled = bSig.disabled = true;
      bEnc.title = bSig.title = "Disponible para recepción u odontóloga";
      bEnc.style.opacity = bSig.style.opacity = ".5";
    } else {
      bEnc.addEventListener("click", async () => {
        try { await api("/turnos/encolar", { method: "POST", body: { paciente_id: sel.value } }); toast("Paciente encolado"); cargarCola(); }
        catch (e) { toast(e.detail || "Error", "err"); }
      });
      bSig.addEventListener("click", async () => {
        try { const r = await api("/turnos/siguiente", { method: "POST" }); toast(r.mensaje); cargarCola(); }
        catch (e) { toast(e.detail || "No hay pacientes en espera", "err"); }
      });
    }
    cargarCola();
  }

  // ---------------- 2 · PILA (odontograma undo) ----------------
  const DIENTES = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,38,37,36,35,34,33,32,31,41,42,43,44,45,46,47,48];
  const ESTADOS_ODO = ["sano","caries","obturado","sellante","corona","tratamiento","extraccion","ausente"];

  async function initPila() {
    const cont = document.getElementById("pila-cont");
    if (user.rol !== "odontologa") {
      cont.innerHTML = `<div class="empty">La edición del odontograma (pila de deshacer) está disponible para el rol <b>odontóloga</b>.</div>`;
      return;
    }
    let pacientes = [];
    try { pacientes = await api("/pacientes/"); } catch (e) {}
    cont.innerHTML = `
      <div class="est-controls">
        <div class="field"><label>Paciente</label><select id="pila-pac">${pacientes.map(p => `<option value="${p.id}">${esc(p.nombres)} ${esc(p.apellidos)}</option>`).join("")}</select></div>
        <div class="field"><label>Diente (FDI)</label><select id="pila-diente">${DIENTES.map(d => `<option>${d}</option>`).join("")}</select></div>
        <div class="field"><label>Nuevo estado</label><select id="pila-estado">${ESTADOS_ODO.map(e => `<option>${e}</option>`).join("")}</select></div>
        <button class="btn btn-sm" id="pila-aplicar">Aplicar (apilar)</button>
        <button class="btn-light btn-sm" id="pila-deshacer">↶ Deshacer (desapilar)</button>
      </div>
      <div class="form-grid" style="grid-template-columns:1.4fr 1fr">
        <div><div class="section-title">Odontograma actual</div><div id="pila-odo"></div></div>
        <div><div class="section-title">Pila de cambios (cima arriba)</div><div id="pila-stack"></div></div>
      </div>`;

    const selPac = document.getElementById("pila-pac");
    async function cargar() {
      const pid = selPac.value;
      try {
        const est = await api("/odontograma/" + pid);
        renderOdontograma(document.getElementById("pila-odo"), est.odontograma_actual, { editable: false });
        const stack = est.pila_deshacer || [];
        const cont2 = document.getElementById("pila-stack");
        if (!stack.length) { cont2.innerHTML = `<div class="empty">Pila vacía</div>`; return; }
        cont2.innerHTML = `<div class="stack">` + stack.map((ch, i) =>
          `<div class="stack-item ${i === 0 ? "cima" : ""}">
             <span>${i === 0 ? '<span class="s-tag">cima ▸ </span>' : ""}Diente ${esc(ch.diente)}: ${esc(ch.anterior)} → <b>${esc(ch.nuevo)}</b></span>
           </div>`).join("") + `</div>`;
      } catch (e) { toast(e.detail || "Error", "err"); }
    }
    selPac.addEventListener("change", cargar);
    document.getElementById("pila-aplicar").addEventListener("click", async () => {
      try {
        await api(`/odontograma/${selPac.value}/cambio`, { method: "POST",
          body: { diente: document.getElementById("pila-diente").value, estado: document.getElementById("pila-estado").value } });
        toast("Cambio aplicado (apilado)"); cargar();
      } catch (e) { toast(e.detail || "Error", "err"); }
    });
    document.getElementById("pila-deshacer").addEventListener("click", async () => {
      try { const r = await api(`/odontograma/${selPac.value}/deshacer`, { method: "POST" }); toast(r.mensaje); cargar(); }
      catch (e) { toast(e.detail || "No hay cambios para deshacer", "err"); }
    });
    cargar();
  }

  // ---------------- 3 · TRIE (autocompletar) ----------------
  function initTrie() {
    const input = document.getElementById("trie-input");
    const drop = document.getElementById("trie-drop");
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) { drop.innerHTML = ""; return; }
      timer = setTimeout(async () => {
        try {
          const r = await api("/estructuras/autocompletar?prefijo=" + encodeURIComponent(q));
          if (!r.coincidencias.length) { drop.innerHTML = `<div class="trie-drop"><div class="ti">Sin coincidencias</div></div>`; return; }
          drop.innerHTML = `<div class="trie-drop">` + r.coincidencias.map(p =>
            `<div class="ti"><span>${esc(p.nombres)} ${esc(p.apellidos)}</span><small>${esc(p.documento)}</small></div>`).join("") + `</div>`;
        } catch (e) {}
      }, 180);
    });
  }

  // ---------------- 4 · BST ----------------
  function BSTjs() { this.raiz = null; }
  BSTjs.prototype.insertar = function (clave, datos) {
    const nodo = { clave, datos, izq: null, der: null };
    if (!this.raiz) { this.raiz = nodo; return; }
    let n = this.raiz;
    while (true) {
      if (clave < n.clave) { if (!n.izq) { n.izq = nodo; return; } n = n.izq; }
      else if (clave > n.clave) { if (!n.der) { n.der = nodo; return; } n = n.der; }
      else return;
    }
  };
  function layoutBST(raiz) {
    let idx = 0; const nodos = [], aristas = [];
    (function rec(n, depth, parent) {
      if (!n) return;
      rec(n.izq, depth + 1, n);
      n._x = idx++; n._y = depth; nodos.push(n);
      if (parent) aristas.push([parent, n]);
      rec(n.der, depth + 1, n);
    })(raiz, 0, null);
    return { nodos, aristas, count: idx };
  }
  function dibujarBST(cont, raiz) {
    if (!raiz) { cont.innerHTML = `<div class="empty">Árbol vacío</div>`; return; }
    const { nodos, aristas } = layoutBST(raiz);
    const gx = 70, gy = 70, m = 30, r = 22;
    const w = Math.max(...nodos.map(n => n._x)) * gx + m * 2 + r;
    const h = Math.max(...nodos.map(n => n._y)) * gy + m * 2 + r;
    const X = n => n._x * gx + m + r, Y = n => n._y * gy + m + r;
    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    aristas.forEach(([a, b]) => { svg += `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="#94a3b8" stroke-width="1.5"/>`; });
    nodos.forEach(n => {
      const etiqueta = `${String(n.clave)} · ${(n.datos && (n.datos.nombres || n.datos.nombre_completo)) || ""}`;
      svg += `<circle cx="${X(n)}" cy="${Y(n)}" r="${r}" fill="#ffffff" stroke="#2E5496" stroke-width="2"><title>${esc(etiqueta)}</title></circle>
        <text x="${X(n)}" y="${Y(n)}" fill="#1F3864" font-size="11" font-weight="600" text-anchor="middle" dominant-baseline="central" pointer-events="none">${esc(String(n.clave).slice(-4))}</text>`;
    });
    svg += `</svg>`;
    cont.innerHTML = svg;
  }
  async function initBST() {
    try {
      const data = await api("/estructuras/pacientes-bst");
      document.getElementById("bst-stats").textContent = `Nodos: ${data.total} · Altura: ${data.altura}`;
      document.getElementById("bst-inorden").innerHTML = data.ordenados.map((p, i) =>
        `<span class="chip-ord"><span class="n">${i + 1}</span>${esc(p.documento)} · ${esc(p.nombres)}</span>`).join('<span class="ord-arrow">→</span>');
      // construir el árbol en el navegador con el mismo orden de inserción (orden de la BD)
      const pacientes = await api("/pacientes/");
      const bst = new BSTjs();
      pacientes.forEach(p => bst.insertar(p.documento, p));
      dibujarBST(document.getElementById("bst-svg"), bst.raiz);
    } catch (e) {}
    document.getElementById("bst-buscar").addEventListener("click", async () => {
      const doc = document.getElementById("bst-doc").value.trim();
      if (!doc) return;
      try {
        const r = await api("/estructuras/pacientes-bst/buscar?documento=" + encodeURIComponent(doc));
        document.getElementById("bst-result").innerHTML = r.encontrado
          ? `<span class="badge b-ok">Encontrado</span> ${esc(r.paciente.nombres)} ${esc(r.paciente.apellidos)} (doc. ${esc(r.paciente.documento)})`
          : `<span class="badge b-cancel">No encontrado</span> documento ${esc(doc)}`;
      } catch (e) { toast(e.detail || "Error", "err"); }
    });
  }

  // ---------------- 5 · GRAFO ----------------
  function dibujarGrafo(cont, grafo, nombres, orden) {
    const nodos = grafo.nodos, aristas = grafo.aristas;
    // nivel = posición en el orden topológico por "capas" (longest path desde las fuentes)
    const nivel = {}; nodos.forEach(n => nivel[n] = 0);
    const pred = {}; nodos.forEach(n => pred[n] = []);
    aristas.forEach(([a, b]) => pred[b].push(a));
    orden.forEach(n => { (pred[n] || []).forEach(p => { nivel[n] = Math.max(nivel[n], nivel[p] + 1); }); });
    const porNivel = {};
    nodos.forEach(n => { (porNivel[nivel[n]] = porNivel[nivel[n]] || []).push(n); });
    const gx = 150, gy = 72, m = 30, rx = 44, ry = 20;
    const maxNivel = Math.max(...nodos.map(n => nivel[n]));
    const maxEnNivel = Math.max(...Object.values(porNivel).map(a => a.length));
    const w = maxNivel * gx + m * 2 + rx * 2;
    const h = maxEnNivel * gy + m * 2 + ry * 2;
    const pos = {};
    Object.keys(porNivel).forEach(lv => {
      porNivel[lv].forEach((n, i) => { pos[n] = { x: lv * gx + m + rx, y: i * gy + m + ry }; });
    });
    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><marker id="flecha" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/></marker></defs>`;
    aristas.forEach(([a, b]) => {
      const pa = pos[a], pb = pos[b];
      if (!pa || !pb) return;
      // acortar la línea para que la flecha llegue al borde del nodo destino
      const dx = pb.x - pa.x, dy = pb.y - pa.y, len = Math.hypot(dx, dy) || 1;
      const x2 = pb.x - (dx / len) * (rx + 4), y2 = pb.y - (dy / len) * (ry + 4);
      svg += `<line x1="${pa.x}" y1="${pa.y}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#flecha)"/>`;
    });
    nodos.forEach(n => {
      const p = pos[n];
      svg += `<rect x="${p.x - rx}" y="${p.y - ry}" width="${rx * 2}" height="${ry * 2}" rx="8" fill="#ffffff" stroke="#2E5496" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 4}" fill="#1F3864" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="central">${esc(n)}</text>
        <text x="${p.x}" y="${p.y + 9}" fill="#64748b" font-size="8.5" text-anchor="middle" dominant-baseline="central">${esc((nombres[n] || "").slice(0, 14))}</text>`;
    });
    svg += `</svg>`;
    cont.innerHTML = svg;
  }
  async function initGrafo() {
    try {
      const data = await api("/estructuras/grafo");
      dibujarGrafo(document.getElementById("grafo-svg"), data.grafo, data.nombres, data.orden_topologico);
      document.getElementById("grafo-orden").innerHTML = data.orden_topologico.map((cod, i) =>
        `<span class="chip-ord"><span class="n">${i + 1}</span>${esc(cod)} · ${esc(data.nombres[cod] || "")}</span>`).join('<span class="ord-arrow">→</span>');
      const procs = await api("/estructuras/procedimientos");
      document.getElementById("grafo-checks").innerHTML = procs.map(p =>
        `<label style="font-size:12.5px;display:flex;align-items:center;gap:5px"><input type="checkbox" value="${p.codigo}"> ${esc(p.codigo)} · ${esc(p.nombre)}</label>`).join("");
    } catch (e) {}
    document.getElementById("grafo-plan").addEventListener("click", async () => {
      const sel = Array.from(document.querySelectorAll("#grafo-checks input:checked")).map(x => x.value);
      if (!sel.length) { toast("Selecciona al menos un procedimiento", "err"); return; }
      try {
        const r = await api("/estructuras/plan-orden", { method: "POST", body: { procedimientos: sel } });
        const pre = r.incluye_prerrequisitos.length ? `<div style="font-size:12px;color:#64748b;margin-bottom:6px">Prerrequisitos añadidos automáticamente: ${r.incluye_prerrequisitos.map(esc).join(", ")}</div>` : "";
        const chips = r.orden_topologico.map((cod, i) => {
          const esPre = r.incluye_prerrequisitos.includes(cod);
          return `<span class="chip-ord ${esPre ? "pre" : ""}"><span class="n">${i + 1}</span>${esc(cod)}</span>`;
        }).join('<span class="ord-arrow">→</span>');
        document.getElementById("grafo-plan-result").innerHTML = pre + `<div class="chips-order">${chips}</div>` +
          (r.hay_ciclo ? `<div style="color:var(--red);margin-top:6px">⚠ El plan tiene dependencias contradictorias (ciclo).</div>` : "");
      } catch (e) { toast(e.detail || "Error", "err"); }
    });
  }

  // Inicializar todas las secciones
  initCola(); initPila(); initTrie(); initBST(); initGrafo();
})();

/* ===== Odontograma interactivo (notación FDI, 32 dientes permanentes) ===== */
const ODO_ESTADOS = {
  sano:        { label:"Sano",            color:"#ffffff", txt:"#475569", border:"#cbd5e1" },
  caries:      { label:"Caries",          color:"#e53935", txt:"#fff" },
  obturado:    { label:"Obturado/Resina", color:"#1e88e5", txt:"#fff" },
  sellante:    { label:"Sellante",        color:"#f9a825", txt:"#3a2e00" },
  corona:      { label:"Corona",          color:"#6a1b9a", txt:"#fff" },
  tratamiento: { label:"En tratamiento",  color:"#ef6c00", txt:"#fff" },
  extraccion:  { label:"Para extracción", color:"#ad1457", txt:"#fff" },
  ausente:     { label:"Ausente",         color:"#9e9e9e", txt:"#fff", mark:"✕" },
};

// Cuadrantes en disposición de carta dental
const ODO_SUP_DER = [18,17,16,15,14,13,12,11];
const ODO_SUP_IZQ = [21,22,23,24,25,26,27,28];
const ODO_INF_DER = [48,47,46,45,44,43,42,41];
const ODO_INF_IZQ = [31,32,33,34,35,36,37,38];
const ODO_TODOS = [...ODO_SUP_DER,...ODO_SUP_IZQ,...ODO_INF_DER,...ODO_INF_IZQ];

function odontogramaVacio(){ const o={}; ODO_TODOS.forEach(d=> o[String(d)]="sano"); return o; }

function _pintarDiente(el, estado){
  const e = ODO_ESTADOS[estado] || ODO_ESTADOS.sano;
  const box = el.querySelector(".box");
  box.style.background = e.color;
  box.style.color = e.txt;
  box.style.borderColor = e.border || e.color;
  box.textContent = e.mark || "";
  el.dataset.estado = estado;
}

/**
 * Renderiza el odontograma dentro de `container`.
 * @param {object} valores  mapa { "11":"caries", ... }
 * @param {object} opts      { editable:boolean }
 * @returns {object} API con getValores()
 */
function renderOdontograma(container, valores, opts){
  opts = opts || {};
  const editable = !!opts.editable;
  const estado = Object.assign(odontogramaVacio(), valores || {});
  let activo = "caries"; // estado seleccionado en la paleta
  const celdas = {};      // num -> elemento del diente (para repintar)

  const quad = dientes => {
    const wrap = document.createElement("div");
    wrap.className = "odo-quad";
    dientes.forEach(num => {
      const t = document.createElement("div");
      t.className = "odo-tooth";
      t.innerHTML = `<div class="box"></div><div class="num">${num}</div>`;
      celdas[String(num)] = t;
      _pintarDiente(t, estado[String(num)]);
      if(editable){
        t.addEventListener("click", () => {
          const anterior = estado[String(num)];
          estado[String(num)] = activo;
          _pintarDiente(t, activo);
          if(typeof opts.onChange === "function") opts.onChange(String(num), activo, anterior);
        });
      }
      wrap.appendChild(t);
    });
    return wrap;
  };

  const fila = (izq, der) => {
    const f = document.createElement("div");
    f.className = "odo-arch";
    f.appendChild(quad(izq));
    const div = document.createElement("div"); div.className = "odo-divider"; f.appendChild(div);
    f.appendChild(quad(der));
    return f;
  };

  container.innerHTML = "";
  const root = document.createElement("div");
  root.className = "odo-wrap" + (editable ? "" : " odo-readonly");

  // Paleta (solo en modo edición)
  if(editable){
    const pal = document.createElement("div");
    pal.className = "odo-palette";
    Object.entries(ODO_ESTADOS).forEach(([key,e]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "odo-state" + (key===activo?" sel":"");
      b.innerHTML = `<span class="dot" style="background:${e.color}"></span>${e.label}`;
      b.addEventListener("click", () => {
        activo = key;
        pal.querySelectorAll(".odo-state").forEach(x=>x.classList.remove("sel"));
        b.classList.add("sel");
      });
      pal.appendChild(b);
    });
    root.appendChild(pal);
    const hint = document.createElement("div");
    hint.style.cssText="font-size:11.5px;color:#64748b;margin-bottom:10px";
    hint.textContent = "Seleccione un estado y haga clic sobre los dientes para marcarlos (manipulación directa).";
    root.appendChild(hint);
  }

  root.appendChild(fila(ODO_SUP_DER, ODO_SUP_IZQ));
  root.appendChild(fila(ODO_INF_DER, ODO_INF_IZQ));

  // Leyenda
  const leg = document.createElement("div");
  leg.className = "odo-legend";
  leg.innerHTML = Object.values(ODO_ESTADOS).map(e =>
    `<span><span class="dot" style="background:${e.color};border:1px solid #cbd5e1"></span>${e.label}</span>`).join("");
  root.appendChild(leg);

  container.appendChild(root);
  return {
    getValores: () => Object.assign({}, estado),
    setValores: (nuevos) => {
      Object.assign(estado, nuevos || {});
      Object.keys(celdas).forEach(num => _pintarDiente(celdas[num], estado[num]));
    },
  };
}

// Resumen compacto de dientes afectados (para vistas de solo lectura)
function resumenOdontograma(valores){
  const afectados = Object.entries(valores||{}).filter(([d,e]) => e && e!=="sano");
  if(!afectados.length) return '<span style="color:#64748b">Sin hallazgos registrados (todos sanos).</span>';
  return afectados.map(([d,e]) =>
    `<span class="chip">${d}: ${ODO_ESTADOS[e]?ODO_ESTADOS[e].label:e}</span>`).join("");
}

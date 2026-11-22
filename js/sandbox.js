/* sandbox.js — Editor de maquetas SIN MODOS, estilo Tinkercad:
   - Clic en un agujero/pin y clic en otro = cable. La isla del origen se ilumina.
   - Arrastrar un componente = moverlo (con imán a los agujeros).
   - Paleta → fantasma que sigue al ratón → clic para soltar.
   - Todo lo que no se puede hacer se EXPLICA en la barra de estado (nada de silencios). */
'use strict';

const Sandbox = (() => {
  const LS_KEY = 'tallerArduinoSandboxV1';
  let state = { components: [], wires: [] };
  let selectedComp = null, selectedWire = null;
  let placingType = null, wireStart = null, wireColor = '#d92b2b';
  let hoverPoint = null;                 // agujero o pin bajo el ratón ('E20' | 'P:D9')
  let netHighlight = new Set(), netText = '';
  let flash = '';                        // aviso visible (errores y confirmaciones)
  let els = null, seq = 1;
  let drag = null, suppressClick = false;

  const clone = o => JSON.parse(JSON.stringify(o));
  function freshIds(layout) {
    const l = clone(layout);
    l.components.forEach(c => c.id = 'sb' + (seq++));
    l.wires.forEach(w => w.id = 'sbw' + (seq++));
    return l;
  }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { state = JSON.parse(raw); return; }
    } catch (e) {}
    state = freshIds(EXERCISES.find(e => e.id === 7).layout);
    state.exId = 7;
    save();
  }
  function loadLayout(layout, label, exId) {
    state = freshIds(layout);
    state.exId = exId || null;
    selectedComp = selectedWire = null; wireStart = null; placingType = null;
    netHighlight = new Set(); netText = '';
    flash = label ? `✅ Maqueta cargada: ${label} (${state.components.length} componentes · ${state.wires.length} cables). Lo que hubiera en la placa se ha sustituido.` : '';
    save(); render();
  }

  function occupiedHoles(exceptId) {
    const occ = new Map();
    for (const c of state.components) {
      if (c.id === exceptId) continue;
      Board.legsOf(c).forEach(l => { if (l) occ.set(l, c.id); });
    }
    return occ;
  }
  function placementOK(comp) {
    const occ = occupiedHoles(comp.id);
    return Board.legsOf(comp).every(l => l && !occ.has(l));
  }
  function nearestPoint(x, y, maxD, holesOnly) {
    let best = null, bd = maxD * maxD;
    for (const h of Board.allHoles()) {
      const p = Board.pointXY(h), d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = h; }
    }
    if (!holesOnly) for (const k of Object.keys(Board.PIN_POS)) {
      const p = Board.PIN_POS[k], d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = 'P:' + k; }
    }
    return best;
  }
  const pretty = p => p.startsWith('P:') ? 'pin ' + p.slice(2) : 'agujero ' + p;

  /* ¿Qué componente tapa este punto? La capa de agujeros va encima de los cuerpos,
     así que un clic sobre el cuerpo (p. ej. el disco del piezo, centrado en un agujero
     que NO es pata) llega como clic de agujero: hay que reclamarlo para el componente.
     Si el punto cae sobre una PATA de verdad, manda el agujero (para cablear desde ella). */
  function compAtPoint(pt) {
    for (const c of state.components) for (const l of Board.legsOf(c)) {
      if (!l) continue;
      const p = Board.pointXY(l);
      if ((p.x - pt.x) ** 2 + (p.y - pt.y) ** 2 < 64) return null;
    }
    for (let i = state.components.length - 1; i >= 0; i--) {
      const c = state.components[i];
      const L = Board.legsOf(c).filter(Boolean).map(Board.pointXY);
      if (!L.length) continue;
      const xs = L.map(p => p.x), ys = L.map(p => p.y);
      if (pt.x >= Math.min(...xs) - 13 && pt.x <= Math.max(...xs) + 13 &&
          pt.y >= Math.min(...ys) - 22 && pt.y <= Math.max(...ys) + 22) return c;
    }
    return null;
  }

  /* ---------- render + capa fantasma ---------- */
  function render() {
    if (!els) return;
    els.canvas.innerHTML = Board.render(state, {
      interactive: true, hits: true,
      selectedComp, selectedWire, highlight: netHighlight,
    });
    const svg = els.canvas.querySelector('svg');
    const ov = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    ov.id = 'sb-overlay';
    svg.appendChild(ov);
    paintOverlay();
    renderProps();
    els.status.innerHTML = statusHtml();
    document.querySelectorAll('.pal-item').forEach(b =>
      b.classList.toggle('active', b.dataset.type === placingType));
  }

  function paintOverlay() {
    const ov = els && els.canvas.querySelector('#sb-overlay');
    if (!ov) return;
    let s = '';
    if (wireStart) {
      const a = Board.pointXY(wireStart);
      s += `<circle cx="${a.x}" cy="${a.y}" r="11" fill="none" stroke="#f5a623" stroke-width="2.6"/><circle cx="${a.x}" cy="${a.y}" r="3.5" fill="#f5a623"/>`;
      if (hoverPoint && hoverPoint !== wireStart) {
        const b = Board.pointXY(hoverPoint);
        s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#f5a623" stroke-width="2.4" stroke-dasharray="7 5"/>`;
      }
    }
    if (placingType && hoverPoint && !hoverPoint.startsWith('P:')) {
      const ghost = { id: 'ghost', type: placingType, anchor: hoverPoint, rot: 0,
                      props: Object.assign({}, Board.DEFS[placingType].defProps) };
      const ok = placementOK(ghost);
      const { x, y } = Board.pointXY(hoverPoint);
      s += Board.drawComp(ghost, true);
      s += `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${ok ? '#2a9e4f' : '#d92b2b'}" stroke-width="2.6"/>`;
    }
    ov.innerHTML = s;
  }

  function statusHtml() {
    const nc = state.components.length, nw = state.wires.length;
    let msg = `<b>${nc}</b> componentes · <b>${nw}</b> cables. `;
    if (flash) msg += `<span style="color:${flash.startsWith('✅') ? '#137333' : '#c22525'};font-weight:600">${flash}</span> `;
    if (placingType) msg += `Colocando <b>${Board.DEFS[placingType].name}</b>: el fantasma te sigue; clica un agujero libre (círculo verde) para soltarlo. Clic derecho o <span class="kbd">Esc</span> para terminar.`;
    else if (wireStart) msg += `Cable desde el <b>${pretty(wireStart)}</b>: clica el agujero o pin de destino. La isla del origen va iluminada en naranja. <span class="kbd">Esc</span> cancela.`;
    else if (selectedComp) {
      const c = state.components.find(x => x.id === selectedComp);
      msg += c ? `<b>${Board.DEFS[c.type].name}</b> seleccionado: arrástralo para moverlo, <span class="kbd">R</span> gira, <span class="kbd">Supr</span> borra, y a la derecha cambias sus valores.` : '';
    }
    else msg += 'Clica un <b>agujero</b> para empezar un cable (y ver su isla) · <b>arrastra</b> un componente para moverlo · elige uno en la <b>paleta</b> para añadirlo.';
    if (netText) msg += `<div class="net-info" style="margin-top:8px">${netText}</div>`;
    return msg;
  }

  /* ---------- panel de propiedades ---------- */
  function renderProps() {
    const p = els.props;
    if (placingType) {
      p.innerHTML = `<h3>Colocando</h3><p class="hint">${Board.DEFS[placingType].icon} <b>${Board.DEFS[placingType].name}</b></p>
        <p class="hint">El fantasma sigue al ratón: donde el círculo se ponga <b style="color:#2a9e4f">verde</b>, cabe; en <b style="color:#d92b2b">rojo</b>, alguna pata cae en un agujero ocupado. Clic para soltar (puedes poner varios seguidos) y <span class="kbd">Esc</span> para terminar.</p>`;
      return;
    }
    if (selectedComp) {
      const c = state.components.find(x => x.id === selectedComp);
      if (!c) { selectedComp = null; renderProps(); return; }
      const def = Board.DEFS[c.type];
      let fields = '';
      (def.propFields || []).forEach(f => {
        if (f.type === 'number') fields += `<div class="row"><label>${f.label}</label><input type="number" min="1" step="1" value="${c.props[f.k]}" data-prop="${f.k}"></div>`;
        if (f.type === 'color') fields += `<div class="row"><label>${f.label}</label><select data-prop="${f.k}">${f.options.map(o => `<option value="${o}" ${o === c.props[f.k] ? 'selected' : ''} style="background:${o}">${o}</option>`).join('')}</select></div>`;
      });
      if (c.type === 'resistor' || c.type === 'pot') {
        fields += `<div class="row"><label>Valores típicos</label><div class="btns">${[220, 470, 1000, 10000, 100000, 1000000].map(v =>
          `<button class="tool-btn small" data-quick="${v}">${Board.fmtOhms(v)}</button>`).join(' ')}</div></div>`;
      }
      p.innerHTML = `<h3>${def.icon} ${def.name}</h3>${fields}
        <div class="btns">
          <button class="btn small ghost" id="sb-rotate">↻ Girar (R)</button>
          <button class="btn small danger" id="sb-del">Eliminar</button>
        </div>
        <p class="hint" style="margin-top:10px">Ancla: ${c.anchor} · rotación ${c.rot * 90}°. Arrástralo sobre la placa para moverlo.</p>`;
      p.querySelectorAll('[data-prop]').forEach(inp => inp.addEventListener('change', () => {
        const k = inp.dataset.prop;
        c.props[k] = inp.type === 'number' ? Math.max(1, parseInt(inp.value, 10) || 1) : inp.value;
        save(); render();
      }));
      p.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
        c.props.value = parseInt(b.dataset.quick, 10); save(); render();
      }));
      p.querySelector('#sb-rotate').addEventListener('click', rotateSelected);
      p.querySelector('#sb-del').addEventListener('click', deleteSelected);
      return;
    }
    if (selectedWire) {
      const w = state.wires.find(x => x.id === selectedWire);
      if (!w) { selectedWire = null; renderProps(); return; }
      const colors = ['#d92b2b','#2b2b30','#f07d18','#d9a416','#2a9e4f','#2456c8','#8b46c7','#7d838a','#7a4a21'];
      p.innerHTML = `<h3>🔌 Cable</h3>
        <p class="hint">Del <b>${pretty(w.from)}</b> al <b>${pretty(w.to)}</b></p>
        <div class="row"><label>Color</label><select id="sb-wire-color">${colors.map(o => `<option value="${o}" ${o === w.color ? 'selected' : ''} style="background:${o}">${o}</option>`).join('')}</select></div>
        <div class="btns"><button class="btn small danger" id="sb-del">Eliminar cable</button></div>`;
      p.querySelector('#sb-wire-color').addEventListener('change', e => { w.color = e.target.value; save(); render(); });
      p.querySelector('#sb-del').addEventListener('click', deleteSelected);
      return;
    }
    p.innerHTML = `<h3>Cómo se usa (sin modos)</h3>
      <ul class="hint">
        <li><b>Cablear</b>: clic en un agujero o pin, y clic en el destino. Como en Tinkercad.</li>
        <li><b>Ver una isla</b>: al empezar un cable, la isla del origen se ilumina en naranja con su explicación debajo. <span class="kbd">Esc</span> cancela el cable.</li>
        <li><b>Añadir</b>: elige el componente en la paleta y clica donde quieras soltarlo.</li>
        <li><b>Mover</b>: arrastra cualquier componente; encaja solo en los agujeros.</li>
        <li><b>Editar</b>: clic en un componente o cable para cambiar sus valores, girarlo o borrarlo.</li>
      </ul>
      <p class="hint" style="margin-top:8px">Todo se guarda solo en este navegador. Puedes cargar la maqueta de cualquier ejercicio desde su página o desde el selector de arriba.</p>`;
  }

  function rotateSelected() {
    const c = state.components.find(x => x.id === selectedComp);
    if (!c) return;
    const old = c.rot;
    c.rot = (c.rot + 1) % 4;
    if (!placementOK(c)) { c.rot = old; flash = 'No cabe girado ahí: alguna pata caería en un agujero ocupado.'; }
    else flash = '';
    save(); render();
  }
  function deleteSelected() {
    if (selectedComp) state.components = state.components.filter(c => c.id !== selectedComp);
    if (selectedWire) state.wires = state.wires.filter(w => w.id !== selectedWire);
    selectedComp = selectedWire = null; flash = '';
    save(); render();
  }

  function svgPoint(evt) {
    const svg = els.canvas.querySelector('svg');
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function describeNet(point) {
    netHighlight = Board.netPoints(state, point);
    const pins = [...netHighlight].filter(x => x.startsWith('P:')).map(x => x.slice(2));
    const has5V = pins.includes('5V'), hasGND = pins.includes('GND');
    netText = `La isla del <b>${pretty(point)}</b> tiene <b>${netHighlight.size} puntos</b>` +
      (pins.length ? ` y llega a: <b>${pins.join(', ')}</b>.` : ' y no llega a ningún pin del UNO.') +
      (has5V && hasGND ? ' ⚠️ ¡Une +5V con GND: cortocircuito!' : has5V ? ' Está unida a +5V.' : hasGND ? ' Está unida a GND.' : '');
  }

  /* ---------- clic principal ---------- */
  function onClick(evt) {
    if (suppressClick) { suppressClick = false; return; }
    const pt = svgPoint(evt);
    const hit = evt.target.closest('.hit');
    const compEl = evt.target.closest('.comp');
    const wireEl = evt.target.closest('.wire-hit');
    let point = hit ? hit.dataset.point : null;
    if (!point && !compEl && !wireEl && !placingType && !wireStart) point = nearestPoint(pt.x, pt.y, 16, false);
    const occComp = (!compEl && !placingType && !wireStart) ? compAtPoint(pt) : null;
    const clickedCompId = compEl ? compEl.dataset.id : (occComp ? occComp.id : null);

    if (placingType) {
      if (point && !point.startsWith('P:')) {
        const comp = { id: 'sb' + (seq++), type: placingType, anchor: point, rot: 0,
                       props: Object.assign({}, Board.DEFS[placingType].defProps) };
        if (placementOK(comp)) {
          state.components.push(comp); selectedComp = comp.id; selectedWire = null;
          flash = ''; save();
        } else {
          flash = 'Ahí no cabe: alguna pata cae en un agujero ya ocupado. Busca el círculo verde.';
        }
      } else if (point) {
        flash = 'Los componentes van en los agujeros de la placa, no en los pines del UNO.';
      }
      render();
      return;
    }

    if (wireStart) {
      if (point) {
        if (point === wireStart) { wireStart = null; netHighlight = new Set(); netText = ''; flash = 'Cable cancelado.'; }
        else if (state.wires.some(w => (w.from === wireStart && w.to === point) || (w.from === point && w.to === wireStart))) {
          flash = 'Ese cable ya existe.'; wireStart = null;
        } else {
          state.wires.push({ id: 'sbw' + (seq++), from: wireStart, to: point, color: wireColor });
          flash = ''; wireStart = null; netHighlight = new Set(); netText = ''; save();
        }
      }
      render();
      return;
    }

    if (clickedCompId) { selectedComp = clickedCompId; selectedWire = null; flash = ''; render(); return; }
    if (wireEl) { selectedWire = wireEl.dataset.id; selectedComp = null; flash = ''; render(); return; }
    if (point) {
      wireStart = point; selectedComp = selectedWire = null; flash = '';
      describeNet(point);
      render();
      return;
    }
    selectedComp = selectedWire = null; netHighlight = new Set(); netText = ''; flash = '';
    render();
  }

  /* ---------- arrastre ---------- */
  function onPointerDown(evt) {
    if (evt.button !== 0 || placingType || wireStart) return;
    const compEl = evt.target.closest('.comp');
    let c = compEl ? state.components.find(x => x.id === compEl.dataset.id) : null;
    if (!c) c = compAtPoint(svgPoint(evt));
    if (!c) return;
    selectedComp = c.id; selectedWire = null;
    drag = { id: c.id, start: svgPoint(evt), moved: false,
             el: els.canvas.querySelector(`.comp[data-id="${c.id}"]`) };
    try { els.canvas.setPointerCapture(evt.pointerId); } catch (e) {}
    renderProps(); els.status.innerHTML = statusHtml();
  }
  function onPointerMove(evt) {
    const pt = svgPoint(evt);
    if (drag) {
      const c = state.components.find(x => x.id === drag.id);
      if (!c) { drag = null; return; }
      const dx = pt.x - drag.start.x, dy = pt.y - drag.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (drag.moved && drag.el) drag.el.setAttribute('transform', `translate(${dx} ${dy})`);
      return;
    }
    const np = nearestPoint(pt.x, pt.y, 30, false);
    if (np !== hoverPoint) { hoverPoint = np; paintOverlay(); }
  }
  function onPointerUp(evt) {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) return;               // fue un clic: lo gestiona onClick
    suppressClick = true;
    const c = state.components.find(x => x.id === d.id);
    if (!c) { render(); return; }
    const pt = svgPoint(evt);
    const aXY = Board.pointXY(c.anchor);
    const target = nearestPoint(aXY.x + (pt.x - d.start.x), aXY.y + (pt.y - d.start.y), 1e9, true);
    const old = c.anchor;
    if (target) {
      c.anchor = target;
      if (placementOK(c)) { flash = ''; save(); }
      else { c.anchor = old; flash = 'No cabe ahí: alguna pata caería en un agujero ocupado. Se queda donde estaba.'; }
    }
    render();
  }

  function cancelPending() {
    if (placingType || wireStart) {
      placingType = null; wireStart = null; netHighlight = new Set(); netText = ''; flash = '';
      render();
    }
  }

  function init(refs) {
    els = refs;
    load();
    seq = 1000 + state.components.length + state.wires.length;
    els.canvas.addEventListener('click', onClick);
    els.canvas.addEventListener('pointerdown', onPointerDown);
    els.canvas.addEventListener('pointermove', onPointerMove);
    els.canvas.addEventListener('pointerup', onPointerUp);
    els.canvas.addEventListener('contextmenu', e => { e.preventDefault(); cancelPending(); });
    document.querySelectorAll('.pal-item').forEach(b => b.addEventListener('click', () => {
      placingType = (placingType === b.dataset.type) ? null : b.dataset.type;
      wireStart = null; selectedComp = selectedWire = null; flash = '';
      render();
    }));
    const wc = document.getElementById('sb-wirecolor');
    if (wc) wc.addEventListener('change', e => { wireColor = e.target.value; });
    const loadSel = document.getElementById('sb-load-ex');
    if (loadSel) {
      loadSel.value = state.exId ? String(state.exId) : '';
      loadSel.addEventListener('change', e => {
        const ex = EXERCISES.find(x => x.id === parseInt(e.target.value, 10));
        if (ex) loadLayout(ex.layout, `Ejercicio ${ex.id} · ${ex.title}`, ex.id);
      });
    }
    const clearBtn = document.getElementById('sb-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      state = { components: [], wires: [], exId: null };
      selectedComp = selectedWire = null; placingType = null; wireStart = null;
      netHighlight = new Set(); netText = ''; flash = '';
      if (loadSel) loadSel.value = '';
      save(); render();
    });
    if (!Sandbox._keyBound) {
      Sandbox._keyBound = true;
      document.addEventListener('keydown', e => {
        if (!document.getElementById('sb-canvas')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'Escape') cancelPending();
        if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedComp || selectedWire)) deleteSelected();
        if ((e.key === 'r' || e.key === 'R') && selectedComp) rotateSelected();
      });
    }
    render();
  }

  return { init, loadLayout };
})();

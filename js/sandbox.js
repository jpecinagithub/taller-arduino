/* sandbox.js — Editor interactivo tipo Tinkercad: añadir/quitar componentes,
   editar sus parámetros, cablear, mover, girar e inspeccionar redes (islas). */
'use strict';

const Sandbox = (() => {
  const LS_KEY = 'tallerArduinoSandboxV1';
  let state = { components: [], wires: [] };
  let mode = 'mover';           // mover | cable | red
  let selectedComp = null, selectedWire = null;
  let placingType = null, wireStart = null, wireColor = '#d92b2b';
  let netHighlight = new Set(), netText = '';
  let els = null, seq = 1;

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
    const ex7 = EXERCISES.find(e => e.id === 7);
    state = freshIds(ex7.layout);
    save();
  }
  function loadLayout(layout) {
    state = freshIds(layout);
    selectedComp = selectedWire = null; wireStart = null; netHighlight = new Set(); netText = '';
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

  function render() {
    if (!els) return;
    let extra = '';
    if (wireStart) {
      const { x, y } = Board.pointXY(wireStart);
      extra = `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#f5a623" stroke-width="2.6"/><circle cx="${x}" cy="${y}" r="3.5" fill="#f5a623"/>`;
    }
    els.canvas.innerHTML = Board.render(state, {
      interactive: true, hits: mode !== 'mover' || !!placingType,
      selectedComp, selectedWire, highlight: netHighlight, extra,
    });
    renderProps();
    els.status.innerHTML = statusHtml();
    document.querySelectorAll('#sb-modes .tool-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode && !placingType));
  }

  function statusHtml() {
    const nc = state.components.length, nw = state.wires.length;
    let msg = `<b>${nc}</b> componentes · <b>${nw}</b> cables. `;
    if (placingType) msg += `Colocando <b>${Board.DEFS[placingType].name}</b>: clica un agujero libre (Esc para terminar).`;
    else if (mode === 'cable') msg += wireStart ? `Cable desde <b>${wireStart.replace('P:','')}</b>: clica el agujero o pin de destino.` : 'Modo cable: clica el agujero o pin de origen.';
    else if (mode === 'red') msg += 'Modo red: clica cualquier agujero para ver su isla completa (todo lo que está conectado con él).';
    else msg += 'Modo mover: arrastra los componentes, clic para seleccionar, <span class="kbd">R</span> gira, <span class="kbd">Supr</span> borra.';
    if (netText) msg += `<div class="net-info" style="margin-top:8px">${netText}</div>`;
    return msg;
  }

  function renderProps() {
    const p = els.props;
    if (placingType) {
      p.innerHTML = `<h3>Colocando</h3><p class="hint">${Board.DEFS[placingType].icon} <b>${Board.DEFS[placingType].name}</b></p>
        <p class="hint">Clica un agujero libre de la placa para soltarlo. Puedes colocar varios seguidos; pulsa <span class="kbd">Esc</span> o cambia de modo para terminar.</p>`;
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
        const quick = [220, 470, 1000, 10000, 100000, 1000000].map(v =>
          `<button class="tool-btn small" data-quick="${v}">${Board.fmtOhms(v)}</button>`).join(' ');
        fields += `<div class="row"><label>Valores típicos</label><div class="btns">${quick}</div></div>`;
      }
      p.innerHTML = `<h3>${def.icon} ${def.name}</h3>${fields}
        <div class="btns">
          <button class="btn small ghost" id="sb-rotate">↻ Girar (R)</button>
          <button class="btn small danger" id="sb-del">Eliminar</button>
        </div>
        <p class="hint" style="margin-top:10px">Ancla: ${c.anchor} · rotación ${c.rot * 90}°</p>`;
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
        <p class="hint">De <b>${w.from.replace('P:','')}</b> a <b>${w.to.replace('P:','')}</b></p>
        <div class="row"><label>Color</label><select id="sb-wire-color">${colors.map(o => `<option value="${o}" ${o === w.color ? 'selected' : ''} style="background:${o}">${o}</option>`).join('')}</select></div>
        <div class="btns"><button class="btn small danger" id="sb-del">Eliminar cable</button></div>`;
      p.querySelector('#sb-wire-color').addEventListener('change', e => { w.color = e.target.value; save(); render(); });
      p.querySelector('#sb-del').addEventListener('click', deleteSelected);
      return;
    }
    p.innerHTML = `<h3>Cómo se usa</h3>
      <ul class="hint">
        <li><b>Componentes</b>: elige uno en la paleta y cícalo en la placa.</li>
        <li><b>Mover</b>: arrastra cualquier componente.</li>
        <li><b>Cable</b>: modo cable, clic en el origen y clic en el destino (agujeros o pines del UNO).</li>
        <li><b>Red</b>: modo red y clic en un agujero: se ilumina su isla entera, como en la placa real.</li>
        <li><b>Parámetros</b>: selecciona una resistencia o un LED para cambiar su valor o color.</li>
      </ul>
      <p class="hint" style="margin-top:8px">Todo se guarda solo en este navegador. Puedes cargar la maqueta de cualquier ejercicio desde su página o desde el selector de arriba.</p>`;
  }

  function rotateSelected() {
    const c = state.components.find(x => x.id === selectedComp);
    if (!c) return;
    const old = c.rot;
    c.rot = (c.rot + 1) % 4;
    if (!placementOK(c)) { c.rot = old; return; }
    save(); render();
  }
  function deleteSelected() {
    if (selectedComp) state.components = state.components.filter(c => c.id !== selectedComp);
    if (selectedWire) state.wires = state.wires.filter(w => w.id !== selectedWire);
    selectedComp = selectedWire = null;
    save(); render();
  }

  function svgPoint(evt) {
    const svg = els.canvas.querySelector('svg');
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function onClick(evt) {
    const hit = evt.target.closest('.hit');
    const compEl = evt.target.closest('.comp');
    const wireEl = evt.target.closest('.wire-hit');
    if (placingType) {
      if (hit && !hit.dataset.point.startsWith('P:')) {
        const comp = { id:'sb' + (seq++), type:placingType, anchor:hit.dataset.point, rot:0,
                       props: Object.assign({}, Board.DEFS[placingType].defProps) };
        if (placementOK(comp)) { state.components.push(comp); selectedComp = comp.id; selectedWire = null; save(); }
        render();
      }
      return;
    }
    if (mode === 'cable') {
      if (hit) {
        const p = hit.dataset.point;
        if (!wireStart) { wireStart = p; }
        else if (p !== wireStart) {
          if (!state.wires.some(w => (w.from === wireStart && w.to === p) || (w.from === p && w.to === wireStart))) {
            state.wires.push({ id:'sbw' + (seq++), from:wireStart, to:p, color:wireColor });
            save();
          }
          wireStart = null;
        }
        render();
      }
      return;
    }
    if (mode === 'red') {
      if (hit && !hit.dataset.point.startsWith('P:')) {
        netHighlight = Board.netPoints(state, hit.dataset.point);
        const pins = [...netHighlight].filter(x => x.startsWith('P:')).map(x => x.slice(2));
        const has5V = pins.includes('5V'), hasGND = pins.includes('GND');
        netText = `La isla de <b>${hit.dataset.point}</b> tiene <b>${netHighlight.size} puntos</b>` +
          (pins.length ? ` y llega a: <b>${pins.join(', ')}</b>.` : ' y no llega a ningún pin del UNO.') +
          (has5V && hasGND ? ' ⚠️ ¡Une +5V con GND: cortocircuito!' : has5V ? ' Está unida a +5V.' : hasGND ? ' Está unida a GND.' : '');
      } else if (hit) {
        netHighlight = Board.netPoints(state, hit.dataset.point);
        netText = `El pin <b>${hit.dataset.point.slice(2)}</b> está conectado con <b>${netHighlight.size} puntos</b> de la placa.`;
      }
      render();
      return;
    }
    /* modo mover */
    if (wireEl) { selectedWire = wireEl.dataset.id; selectedComp = null; netHighlight = new Set(); netText = ''; render(); return; }
    if (compEl) { selectedComp = compEl.dataset.id; selectedWire = null; render(); return; }
    selectedComp = selectedWire = null; render();
  }

  /* arrastre de componentes (modo mover) */
  let drag = null;
  function onPointerDown(evt) {
    if (mode !== 'mover' || placingType) return;
    const compEl = evt.target.closest('.comp');
    if (!compEl) return;
    const c = state.components.find(x => x.id === compEl.dataset.id);
    if (!c) return;
    selectedComp = c.id; selectedWire = null;
    drag = { id: c.id, start: svgPoint(evt), anchor: c.anchor };
    render();
  }
  function onPointerMove(evt) {
    if (!drag) return;
    const c = state.components.find(x => x.id === drag.id);
    if (!c) return;
    const now = svgPoint(evt);
    const aXY = Board.pointXY(drag.anchor);
    const tx = aXY.x + (now.x - drag.start.x), ty = aXY.y + (now.y - drag.start.y);
    let best = null, bd = 1e9;
    for (const h of Board.allHoles()) {
      const { x, y } = Board.pointXY(h);
      const d = (x - tx) ** 2 + (y - ty) ** 2;
      if (d < bd) { bd = d; best = h; }
    }
    if (best && best !== c.anchor) {
      const old = c.anchor;
      c.anchor = best;
      if (placementOK(c)) { render(); } else { c.anchor = old; }
    }
  }
  function onPointerUp() { if (drag) { drag = null; save(); } }

  let bound = false;
  function init(refs) {
    els = refs;
    load();
    seq = 1000 + state.components.length + state.wires.length;
    els.canvas.addEventListener('click', onClick);
    els.canvas.addEventListener('pointerdown', onPointerDown);
    els.canvas.addEventListener('pointermove', onPointerMove);
    if (!bound) { bound = true; window.addEventListener('pointerup', onPointerUp); }
    document.querySelectorAll('#sb-modes .tool-btn').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode; placingType = null; wireStart = null; render();
    }));
    document.querySelectorAll('.pal-item').forEach(b => b.addEventListener('click', () => {
      placingType = b.dataset.type; selectedComp = selectedWire = null; render();
    }));
    const wc = document.getElementById('sb-wirecolor');
    if (wc) wc.addEventListener('change', e => { wireColor = e.target.value; });
    const loadSel = document.getElementById('sb-load-ex');
    if (loadSel) loadSel.addEventListener('change', e => {
      const ex = EXERCISES.find(x => x.id === parseInt(e.target.value, 10));
      if (ex) loadLayout(ex.layout);
      e.target.value = '';
    });
    const clearBtn = document.getElementById('sb-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      state = { components: [], wires: [] };
      selectedComp = selectedWire = null; netHighlight = new Set(); netText = '';
      save(); render();
    });
    if (!Sandbox._keyBound) {
      Sandbox._keyBound = true;
      document.addEventListener('keydown', e => {
        if (!document.getElementById('sb-canvas')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'Escape') { placingType = null; wireStart = null; render(); }
        if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedComp || selectedWire)) deleteSelected();
        if ((e.key === 'r' || e.key === 'R') && selectedComp) rotateSelected();
      });
    }
    render();
  }

  return { init, loadLayout };
})();

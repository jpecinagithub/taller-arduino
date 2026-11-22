/* board.js — Modelo de la protoboard + Arduino UNO y render SVG.
   Lo usan la vista de maqueta de cada ejercicio y el sandbox editable.
   Puntos: agujeros "E20" / "T+20" / "B-5" y pines "P:D13", "P:A0", "P:5V", "P:GND"... */
'use strict';

const Board = (() => {
  const COLS = 63;
  const PITCH = 15;
  const ROW_ORDER = ['T-','T+','A','B','C','D','E','F','G','H','I','J','B-','B+'];
  const ROW_Y = { 'T-':22, 'T+':37, 'A':59, 'B':74, 'C':89, 'D':104, 'E':119,
                  'F':152, 'G':167, 'H':182, 'I':197, 'J':212, 'B-':234, 'B+':249 };
  const BOARD_W = 1010, BOARD_H = 272;

  const colX = c => 46 + (c - 1) * PITCH;

  function parsePoint(id) {
    if (id.startsWith('P:')) return { kind:'pin', pin:id.slice(2) };
    const m = id.match(/^(T-|T\+|B\+|B-|[A-J])(\d{1,2})$/);
    if (!m) return null;
    return { kind:'hole', row:m[1], col:parseInt(m[2],10) };
  }
  function pointXY(id) {
    const p = parsePoint(id);
    if (!p) return { x:0, y:0 };
    if (p.kind === 'pin') return PIN_POS[p.pin] || { x:0, y:0 };
    return { x: colX(p.col), y: ROW_Y[p.row] };
  }
  function islandOf(id) {
    const p = parsePoint(id);
    if (!p) return id;
    if (p.kind === 'pin') return 'PIN:' + p.pin;
    if ('ABCDE'.includes(p.row)) return 'U' + p.col;
    if ('FGHIJ'.includes(p.row)) return 'L' + p.col;
    return p.row + ':' + (p.col <= 30 ? 'a' : 'b'); // raíles cortados a mitad de placa
  }
  function shiftHole(id, dc, dr) {
    const p = parsePoint(id);
    if (!p || p.kind !== 'hole') return null;
    const ri = ROW_ORDER.indexOf(p.row) + dr;
    const c = p.col + dc;
    if (ri < 0 || ri >= ROW_ORDER.length || c < 1 || c > COLS) return null;
    return ROW_ORDER[ri] + c;
  }
  function allHoles() {
    const out = [];
    for (const r of ROW_ORDER) for (let c = 1; c <= COLS; c++) out.push(r + c);
    return out;
  }

  /* ---------- Arduino UNO: geometría y pines ---------- */
  const UNO = { x:70, y:332, w:560, h:196 };
  const PIN_POS = {};
  const TOP_PINS = ['AREF','GND','D13','D12','D11','D10','D9','D8','D7','D6','D5','D4','D3','D2','D1','D0'];
  TOP_PINS.forEach((p,i) => { PIN_POS[p] = { x: UNO.x + 44 + i*32, y: UNO.y + 14 }; });
  const PWR_PINS = ['3V3','5V','GND','VIN'];
  PWR_PINS.forEach((p,i) => { if (!PIN_POS[p]) PIN_POS[p] = { x: UNO.x + 44 + i*32, y: UNO.y + UNO.h - 14 }; });
  ['A0','A1','A2','A3','A4','A5'].forEach((p,i) => { PIN_POS[p] = { x: UNO.x + 300 + i*32, y: UNO.y + UNO.h - 14 }; });
  const PIN_LABEL = { '3V3':'3.3V' };

  /* ---------- Utilidades de resistencias ---------- */
  const DIGIT_COLORS = ['#202020','#7a4a21','#d92b2b','#f07d18','#f5d90a','#2a9e4f','#2456c8','#8b46c7','#8a8a8a','#f2f2f2'];
  function fmtOhms(v) {
    if (v >= 1e6) return (v/1e6).toString().replace('.',',') + ' MΩ';
    if (v >= 1e3) return (v/1e3).toString().replace('.',',') + ' kΩ';
    return v + ' Ω';
  }
  function bandsFor(v) {
    if (v < 10) return [0, Math.round(v), 0];
    let exp = Math.floor(Math.log10(v)) - 1;
    let d = Math.round(v / Math.pow(10, exp));
    if (d >= 100) { d = Math.round(d/10); exp++; }
    return [Math.floor(d/10), d % 10, exp];
  }

  /* ---------- Definiciones de componentes ----------
     legs: desplazamientos [dCol, dFila] desde el ancla (primera pata).
     joins: parejas de patas unidas por dentro (solo el pulsador). */
  const DEFS = {
    resistor: { name:'Resistencia', icon:'〰️', legs:[[0,0],[4,0]], defProps:{ value:220 },
      propFields:[{k:'value',label:'Valor (Ω)',type:'number'}] },
    led:      { name:'LED', icon:'💡', legs:[[0,0],[1,0]], defProps:{ color:'#d92b2b' },
      propFields:[{k:'color',label:'Color',type:'color',options:['#d92b2b','#2a9e4f','#2456c8','#f5d90a','#f07d18','#ffffff']}] },
    rgbled:   { name:'LED RGB', icon:'🌈', legs:[[0,0],[1,0],[2,0],[3,0]], defProps:{} },
    button:   { name:'Pulsador', icon:'🔘', legs:[[0,0],[3,0],[0,1],[3,1]], joins:[[0,2],[1,3]], defProps:{} },
    pot:      { name:'Potenciómetro', icon:'🎛️', legs:[[0,0],[1,0],[2,0]], defProps:{ value:10000 },
      propFields:[{k:'value',label:'Valor (Ω)',type:'number'}] },
    photo:    { name:'Fotorresistencia', icon:'🔆', legs:[[0,0],[2,0]], defProps:{} },
    tmp36:    { name:'Sensor TMP36', icon:'🌡️', legs:[[0,0],[1,0],[2,0]], defProps:{} },
    piezo:    { name:'Piezo / zumbador', icon:'🔊', legs:[[0,0],[4,0]], defProps:{} },
    servo:    { name:'Servo', icon:'🦾', legs:[[0,0],[1,0],[2,0]], defProps:{} },
    motor:    { name:'Motor DC', icon:'🌀', legs:[[0,0],[2,0]], defProps:{} },
    tilt:     { name:'Sensor de inclinación', icon:'🧭', legs:[[0,0],[2,0]], defProps:{} },
    transistor:{ name:'Transistor', icon:'⚡', legs:[[0,0],[1,0],[2,0]], defProps:{} },
    hbridge:  { name:'Puente H (L293D)', icon:'🎚️', legs:[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]], defProps:{} },
    lcd:      { name:'Pantalla LCD 16×2', icon:'🖥️', legs:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]], defProps:{} },
    battery:  { name:'Batería 9V', icon:'🔋', legs:[[0,0],[2,0]], defProps:{} },
    opto:     { name:'Optoacoplador', icon:'🔦', legs:[[0,0],[1,0],[0,1],[1,1]], defProps:{} },
    foil:     { name:'Lámina táctil', icon:'🖐️', legs:[[0,0]], defProps:{} },
  };

  function rotOffset(dc, dr, rot) {
    switch (((rot % 4) + 4) % 4) {
      case 1: return [-dr, dc];
      case 2: return [-dc, -dr];
      case 3: return [dr, -dc];
      default: return [dc, dr];
    }
  }
  function legsOf(comp) {
    const def = DEFS[comp.type];
    if (!def) return [];
    return def.legs.map(([dc, dr]) => {
      const [rc, rr] = rotOffset(dc, dr, comp.rot || 0);
      return shiftHole(comp.anchor, rc, rr);
    });
  }

  /* ---------- Redes (islas + cables + uniones internas) ---------- */
  function computeNets(state) {
    const parent = new Map();
    const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    const add = x => { if (!parent.has(x)) parent.set(x, x); };
    const union = (a, b) => { if (!a || !b) return; add(a); add(b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    for (const h of allHoles()) add('H:' + h);
    for (const h of allHoles()) union('H:' + h, 'I:' + islandOf(h));
    for (const c of state.components) {
      const legs = legsOf(c);
      legs.forEach(l => { if (l) union('H:' + l, 'I:' + islandOf(l)); });
      const joins = DEFS[c.type].joins || [];
      joins.forEach(([a, b]) => { if (legs[a] && legs[b]) union('H:' + legs[a], 'H:' + legs[b]); });
    }
    for (const w of state.wires) {
      const a = w.from.startsWith('P:') ? 'PIN:' + w.from.slice(2) : 'H:' + w.from;
      const b = w.to.startsWith('P:') ? 'PIN:' + w.to.slice(2) : 'H:' + w.to;
      if (!w.from.startsWith('P:')) union(a, 'I:' + islandOf(w.from));
      if (!w.to.startsWith('P:')) union(b, 'I:' + islandOf(w.to));
      union(a, b);
    }
    return { find: x => parent.has(x) ? find(x) : null, parent };
  }
  function netPoints(state, pointId) {
    const nets = computeNets(state);
    const root = pointId.startsWith('P:') ? nets.find('PIN:' + pointId.slice(2))
                                         : nets.find('I:' + islandOf(pointId));
    if (!root) return new Set();
    const out = new Set();
    for (const h of allHoles()) if (nets.find('I:' + islandOf(h)) === root) out.add(h);
    for (const p of Object.keys(PIN_POS)) if (nets.find('PIN:' + p) === root) out.add('P:' + p);
    return out;
  }

  /* ---------- Dibujo de componentes ---------- */
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const mid = (a,b) => ({ x:(a.x+b.x)/2, y:(a.y+b.y)/2 });
  const ang = (a,b) => Math.atan2(b.y-a.y, b.x-a.x) * 180/Math.PI;

  function drawResistor(c, L) {
    const m = mid(L[0], L[1]);
    const bands = bandsFor(c.props.value || 220).map(d => DIGIT_COLORS[d]);
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${L[1].x}" y2="${L[1].y}" stroke="#8a8f94" stroke-width="2.5"/>
    <g transform="translate(${m.x},${m.y}) rotate(${ang(L[0],L[1])})">
      <rect x="-27" y="-7.5" width="54" height="15" rx="6" fill="#dcb87f" stroke="#b08d4f"/>
      <rect x="-15" y="-7.5" width="5.5" height="15" fill="${bands[0]}"/>
      <rect x="-6" y="-7.5" width="5.5" height="15" fill="${bands[1]}"/>
      <rect x="3" y="-7.5" width="5.5" height="15" fill="${bands[2]}"/>
      <rect x="15" y="-7.5" width="4" height="15" fill="#c9a227"/>
    </g>
    <text x="${m.x}" y="${m.y - 15}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#5a4632">${esc(fmtOhms(c.props.value || 220))}</text>`;
  }
  function drawLed(c, L) {
    const m = mid(L[0], L[1]); const col = c.props.color || '#d92b2b';
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${m.x-4}" y2="${m.y-8}" stroke="#8a8f94" stroke-width="2.5"/>
    <line x1="${L[1].x}" y1="${L[1].y}" x2="${m.x+4}" y2="${m.y-8}" stroke="#8a8f94" stroke-width="2.5"/>
    <circle cx="${m.x}" cy="${m.y-17}" r="11.5" fill="${col}" fill-opacity="0.88" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/>
    <text x="${L[1].x + 3}" y="${L[1].y + 14}" font-size="11" font-weight="700" fill="#43525f">+</text>
    <text x="${L[0].x - 9}" y="${L[0].y + 14}" font-size="11" font-weight="700" fill="#43525f">−</text>`;
  }
  function drawRgb(c, L) {
    const cx = (L[0].x + L[3].x)/2, y = L[0].y;
    const stubs = L.map(p => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${y-10}" stroke="#8a8f94" stroke-width="2.5"/>`).join('');
    return `${stubs}<rect x="${cx-19}" y="${y-38}" width="38" height="28" rx="5" fill="#f4f6f7" fill-opacity="0.92" stroke="#b9bfc4"/>
    <circle cx="${cx-11}" cy="${y-24}" r="4.5" fill="#d92b2b"/><circle cx="${cx}" cy="${y-24}" r="4.5" fill="#2a9e4f"/><circle cx="${cx+11}" cy="${y-24}" r="4.5" fill="#2456c8"/>
    <text x="${cx}" y="${y+14}" text-anchor="middle" font-size="9.5" fill="#43525f">R − V A · cátodo común</text>`;
  }
  function drawButton(c, L) {
    const x0 = Math.min(...L.map(p=>p.x)), x1 = Math.max(...L.map(p=>p.x));
    const y0 = Math.min(...L.map(p=>p.y)), y1 = Math.max(...L.map(p=>p.y));
    return `<rect x="${x0-12}" y="${y0-12}" width="${x1-x0+24}" height="${y1-y0+24}" rx="6" fill="#2b2f33" stroke="#14171a"/>
    <circle cx="${(x0+x1)/2}" cy="${(y0+y1)/2}" r="11" fill="#4a5057" stroke="#14171a"/>`;
  }
  function drawPot(c, L) {
    const cx = (L[0].x + L[2].x)/2, y = L[0].y;
    const stubs = L.map(p => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${y-8}" stroke="#8a8f94" stroke-width="2.5"/>`).join('');
    return `${stubs}<rect x="${cx-21}" y="${y-40}" width="42" height="32" rx="5" fill="#2b3a67" stroke="#141c33"/>
    <circle cx="${cx}" cy="${y-24}" r="10.5" fill="#d8dde2" stroke="#8a929a"/>
    <line x1="${cx}" y1="${y-24}" x2="${cx+7}" y2="${y-30}" stroke="#2b3a67" stroke-width="2.5"/>
    <text x="${cx}" y="${y+14}" text-anchor="middle" font-size="10" fill="#43525f">${esc(fmtOhms(c.props.value || 10000))}</text>`;
  }
  function drawPhoto(c, L) {
    const m = mid(L[0], L[1]);
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${L[1].x}" y2="${L[1].y}" stroke="#8a8f94" stroke-width="2.5"/>
    <circle cx="${m.x}" cy="${m.y-13}" r="10.5" fill="#a34a28" stroke="#6e2f16"/>
    <path d="M ${m.x-6} ${m.y-13} q 3 -5 6 0 q 3 5 6 0" fill="none" stroke="#f3d9a4" stroke-width="1.8"/>
    <text x="${m.x}" y="${m.y+15}" text-anchor="middle" font-size="9.5" fill="#43525f">LDR</text>`;
  }
  function drawTmp36(c, L) {
    const cx = (L[0].x + L[2].x)/2, y = L[0].y;
    const stubs = L.map(p => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${y-6}" stroke="#8a8f94" stroke-width="2.5"/>`).join('');
    return `${stubs}<path d="M ${cx-16} ${y-6} v -10 a 16 13 0 0 1 32 0 v 10 z" fill="#22252a" stroke="#0c0e10"/>
    <text x="${cx}" y="${y+14}" text-anchor="middle" font-size="9.5" fill="#43525f">TMP36 · + S −</text>`;
  }
  function drawPiezo(c, L) {
    const m = mid(L[0], L[1]);
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${m.x-10}" y2="${m.y-6}" stroke="#8a8f94" stroke-width="2.5"/>
    <line x1="${L[1].x}" y1="${L[1].y}" x2="${m.x+10}" y2="${m.y-6}" stroke="#8a8f94" stroke-width="2.5"/>
    <circle cx="${m.x}" cy="${m.y-16}" r="16" fill="#1d1f22" stroke="#000"/>
    <circle cx="${m.x}" cy="${m.y-16}" r="6" fill="#7d838a"/>
    <text x="${L[0].x - 2}" y="${L[0].y + 14}" font-size="11" font-weight="700" fill="#43525f">+</text>`;
  }
  function drawServo(c, L) {
    const cx = (L[0].x + L[2].x)/2, y = L[0].y;
    const cols = ['#f07d18','#d92b2b','#7a4a21'];
    const stubs = L.map((p,i) => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${y-16}" stroke="${cols[i]}" stroke-width="2.5"/>`).join('');
    return `${stubs}<rect x="${cx-25}" y="${y-46}" width="50" height="30" rx="5" fill="#2456c8" stroke="#173a85"/>
    <text x="${cx}" y="${y-27}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">SERVO</text>
    <text x="${cx}" y="${y+14}" text-anchor="middle" font-size="9" fill="#43525f">señal · + · −</text>`;
  }
  function drawMotor(c, L) {
    const m = mid(L[0], L[1]);
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${m.x-8}" y2="${m.y-8}" stroke="#8a8f94" stroke-width="2.5"/>
    <line x1="${L[1].x}" y1="${L[1].y}" x2="${m.x+8}" y2="${m.y-8}" stroke="#8a8f94" stroke-width="2.5"/>
    <circle cx="${m.x}" cy="${m.y-18}" r="15" fill="#9aa3ab" stroke="#62686e"/>
    <text x="${m.x}" y="${m.y-13}" text-anchor="middle" font-size="13" font-weight="700" fill="#2c343a">M</text>`;
  }
  function drawTilt(c, L) {
    const m = mid(L[0], L[1]);
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${L[1].x}" y2="${L[1].y}" stroke="#8a8f94" stroke-width="2.5"/>
    <rect x="${m.x-13}" y="${m.y-19}" width="26" height="13" rx="6" fill="#c8ccd0" stroke="#8a929a"/>
    <text x="${m.x}" y="${m.y+15}" text-anchor="middle" font-size="9.5" fill="#43525f">inclinación</text>`;
  }
  function drawTransistor(c, L) {
    const cx = (L[0].x + L[2].x)/2, y = L[0].y;
    const stubs = L.map(p => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${y-8}" stroke="#8a8f94" stroke-width="2.5"/>`).join('');
    const labs = ['G','D','S'].map((t,i) => `<text x="${L[i].x}" y="${y+14}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#43525f">${t}</text>`).join('');
    return `${stubs}<rect x="${cx-15}" y="${y-38}" width="30" height="30" rx="3" fill="#22252a" stroke="#0c0e10"/>
    <rect x="${cx-9}" y="${y-44}" width="18" height="8" rx="2" fill="#9aa3ab"/><circle cx="${cx}" cy="${y-40}" r="2.4" fill="#62686e"/>${labs}`;
  }
  function drawIc(c, L, label) {
    const xs = L.map(p=>p.x), ys = L.map(p=>p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return `<rect x="${x0-10}" y="${y0-10}" width="${x1-x0+20}" height="${y1-y0+20}" rx="4" fill="#22252a" stroke="#0c0e10"/>
    <text x="${(x0+x1)/2}" y="${(y0+y1)/2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#e8ecef">${esc(label)}</text>`;
  }
  function drawLcd(c, L) {
    const cx = (L[0].x + L[5].x)/2, y = L[0].y;
    const stubs = L.map(p => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${y-8}" stroke="#8a8f94" stroke-width="2.5"/>`).join('');
    return `${stubs}<rect x="${cx-52}" y="${y-52}" width="104" height="44" rx="4" fill="#2a7d4f" stroke="#17573a"/>
    <rect x="${cx-42}" y="${y-44}" width="84" height="28" fill="#cfe8c9"/>
    <text x="${cx}" y="${y-26}" text-anchor="middle" font-size="10.5" fill="#2c4a34">LCD 16×2</text>`;
  }
  function drawBattery(c, L) {
    const m = mid(L[0], L[1]);
    return `<line x1="${L[0].x}" y1="${L[0].y}" x2="${m.x-6}" y2="${m.y-8}" stroke="#d92b2b" stroke-width="2.5"/>
    <line x1="${L[1].x}" y1="${L[1].y}" x2="${m.x+6}" y2="${m.y-8}" stroke="#333" stroke-width="2.5"/>
    <rect x="${m.x-15}" y="${m.y-46}" width="30" height="38" rx="3" fill="#2b2f33" stroke="#14171a"/>
    <rect x="${m.x-5}" y="${m.y-51}" width="10" height="5" fill="#9aa3ab"/>
    <text x="${m.x}" y="${m.y-22}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffd97a">9V</text>
    <text x="${L[0].x - 2}" y="${L[0].y + 14}" font-size="11" font-weight="700" fill="#43525f">+</text>`;
  }
  function drawFoil(c, L) {
    const p = L[0];
    return `<rect x="${p.x-16}" y="${p.y-34}" width="32" height="28" rx="3" fill="#c0c6cc" stroke="#8a929a"/>
    <text x="${p.x}" y="${p.y+14}" text-anchor="middle" font-size="9.5" fill="#43525f">lámina</text>`;
  }
  const DRAW = { resistor:drawResistor, led:drawLed, rgbled:drawRgb, button:drawButton, pot:drawPot,
    photo:drawPhoto, tmp36:drawTmp36, piezo:drawPiezo, servo:drawServo, motor:drawMotor, tilt:drawTilt,
    transistor:drawTransistor, hbridge:(c,L)=>drawIc(c,L,'L293D'), opto:(c,L)=>drawIc(c,L,'4N35'),
    lcd:drawLcd, battery:drawBattery, foil:drawFoil };

  /* ---------- Render completo ---------- */
  function wirePath(a, b) {
    const dy = Math.max(26, Math.abs(b.y - a.y) * 0.4);
    const dir = b.y >= a.y ? 1 : -1;
    return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy*dir}, ${b.x} ${b.y - dy*dir}, ${b.x} ${b.y}`;
  }
  function render(state, opts = {}) {
    const W = 1064, H = 560;
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,system-ui,sans-serif">`;
    /* placa */
    s += `<rect x="8" y="6" width="${BOARD_W}" height="${BOARD_H}" rx="10" fill="#eef0ee" stroke="#c4cacc"/>`;
    s += `<rect x="14" y="127" width="${BOARD_W-12}" height="17" fill="#dde1e3"/>`;
    s += `<line x1="40" y1="${ROW_Y['T+']-8}" x2="982" y2="${ROW_Y['T+']-8}" stroke="#d92b2b" stroke-width="1.6"/>`;
    s += `<line x1="40" y1="${ROW_Y['T-']-8}" x2="982" y2="${ROW_Y['T-']-8}" stroke="#2456c8" stroke-width="1.6"/>`;
    s += `<line x1="40" y1="${ROW_Y['B+']+9}" x2="982" y2="${ROW_Y['B+']+9}" stroke="#d92b2b" stroke-width="1.6"/>`;
    s += `<line x1="40" y1="${ROW_Y['B-']+9}" x2="982" y2="${ROW_Y['B-']+9}" stroke="#2456c8" stroke-width="1.6"/>`;
    s += `<text x="17" y="${ROW_Y['T-']+4}" font-size="13" font-weight="700" fill="#2456c8">−</text>
          <text x="17" y="${ROW_Y['T+']+4}" font-size="13" font-weight="700" fill="#d92b2b">+</text>
          <text x="17" y="${ROW_Y['B+']+4}" font-size="13" font-weight="700" fill="#d92b2b">+</text>
          <text x="17" y="${ROW_Y['B-']+4}" font-size="13" font-weight="700" fill="#2456c8">−</text>`;
    s += `<text x="995" y="${ROW_Y['T-']+4}" font-size="13" font-weight="700" fill="#2456c8">−</text>
          <text x="995" y="${ROW_Y['T+']+4}" font-size="13" font-weight="700" fill="#d92b2b">+</text>
          <text x="995" y="${ROW_Y['B+']+4}" font-size="13" font-weight="700" fill="#d92b2b">+</text>
          <text x="995" y="${ROW_Y['B-']+4}" font-size="13" font-weight="700" fill="#2456c8">−</text>`;
    for (let c = 1; c <= COLS; c += (c === 1 ? 4 : 5)) {
      s += `<text x="${colX(c)}" y="52" text-anchor="middle" font-size="9" fill="#98a1a8">${c}</text>`;
      s += `<text x="${colX(c)}" y="228" text-anchor="middle" font-size="9" fill="#98a1a8">${c}</text>`;
      if (c + 5 > COLS && c !== COLS) { s += `<text x="${colX(COLS)}" y="52" text-anchor="middle" font-size="9" fill="#98a1a8">${COLS}</text><text x="${colX(COLS)}" y="228" text-anchor="middle" font-size="9" fill="#98a1a8">${COLS}</text>`; }
    }
    /* corte de los raíles a mitad de placa */
    s += `<rect x="${colX(30)+7}" y="12" width="3" height="38" fill="#eef0ee"/><rect x="${colX(30)+7}" y="228" width="3" height="38" fill="#eef0ee"/>`;
    /* agujeros */
    const hl = opts.highlight || new Set();
    for (const h of allHoles()) {
      const { x, y } = pointXY(h);
      if (hl.has(h)) s += `<circle cx="${x}" cy="${y}" r="7" fill="rgba(245,166,35,.35)" stroke="#f5a623" stroke-width="2"/>`;
      else s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#b7bdc2"/>`;
    }
    /* UNO */
    s += `<g>
      <rect x="${UNO.x-22}" y="${UNO.y+56}" width="46" height="46" rx="4" fill="#c8ccd0" stroke="#9aa1a7"/>
      <rect x="${UNO.x}" y="${UNO.y}" width="${UNO.w}" height="${UNO.h}" rx="12" fill="#1f6fb2" stroke="#17517f"/>
      <rect x="${UNO.x+30}" y="${UNO.y+4}" width="${16*32}" height="20" fill="#14171a"/>
      <rect x="${UNO.x+30}" y="${UNO.y+UNO.h-24}" width="${4*32}" height="20" fill="#14171a"/>
      <rect x="${UNO.x+286}" y="${UNO.y+UNO.h-24}" width="${6*32}" height="20" fill="#14171a"/>
      <text x="${UNO.x+UNO.w/2}" y="${UNO.y+105}" text-anchor="middle" font-size="34" font-weight="700" fill="rgba(255,255,255,.9)">UNO</text>
      <text x="${UNO.x+UNO.w/2}" y="${UNO.y+126}" text-anchor="middle" font-size="12" letter-spacing="3" fill="rgba(255,255,255,.75)">ARDUINO</text>
      <text x="${UNO.x+290}" y="${UNO.y+62}" font-size="9.5" fill="rgba(255,255,255,.8)">DIGITAL (PWM ~)</text>
      <text x="${UNO.x+34}" y="${UNO.y+146}" font-size="9.5" fill="rgba(255,255,255,.8)">POWER</text>
      <text x="${UNO.x+290}" y="${UNO.y+146}" font-size="9.5" fill="rgba(255,255,255,.8)">ANALOG IN</text>
    </g>`;
    for (const p of Object.keys(PIN_POS)) {
      const { x, y } = PIN_POS[p];
      const top = y < UNO.y + 40;
      s += `<circle cx="${x}" cy="${y}" r="3.4" fill="#e8c85a" stroke="#8a6d1f" stroke-width="0.8"/>`;
      if (hl.has('P:' + p)) s += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#f5a623" stroke-width="2.2"/>`;
      s += `<text x="${x}" y="${top ? y + 30 : y - 22}" text-anchor="middle" font-size="8.6" fill="#fff">${esc(PIN_LABEL[p] || p.replace('D',''))}</text>`;
    }
    /* cables */
    for (const w of state.wires) {
      const a = pointXY(w.from), b = pointXY(w.to);
      const d = wirePath(a, b);
      if (opts.selectedWire === w.id) s += `<path d="${d}" fill="none" stroke="#f5a623" stroke-width="10" stroke-linecap="round" opacity="0.45"/>`;
      s += `<path class="${opts.interactive ? 'wire' : ''}" ${opts.interactive ? `data-id="${w.id}"` : ''} d="${d}" fill="none" stroke="${w.color}" stroke-width="4.4" stroke-linecap="round" opacity="0.94"/>`;
      if (opts.interactive) s += `<path class="wire-hit" data-id="${w.id}" d="${d}" fill="none" stroke="rgba(0,0,0,0)" stroke-width="13" stroke-linecap="round" style="cursor:pointer"/>`;
      s += `<circle cx="${a.x}" cy="${a.y}" r="3.1" fill="${w.color}"/><circle cx="${b.x}" cy="${b.y}" r="3.1" fill="${w.color}"/>`;
    }
    /* componentes */
    for (const c of state.components) {
      const legIds = legsOf(c);
      if (legIds.some(l => !l)) continue;
      const L = legIds.map(pointXY);
      let body = DRAW[c.type] ? DRAW[c.type](c, L) : '';
      let sel = '';
      if (opts.selectedComp === c.id) {
        const xs = L.map(p=>p.x), ys = L.map(p=>p.y);
        sel = `<rect x="${Math.min(...xs)-24}" y="${Math.min(...ys)-52}" width="${Math.max(...xs)-Math.min(...xs)+48}" height="${Math.max(...ys)-Math.min(...ys)+76}" rx="8" fill="none" stroke="#00979d" stroke-width="2" stroke-dasharray="6 4"/>`;
      }
      s += `<g class="${opts.interactive ? 'comp' : ''}" ${opts.interactive ? `data-id="${c.id}" style="cursor:grab"` : ''}>${body}${sel}</g>`;
      s += legIds.map(l => { const {x,y} = pointXY(l); return `<circle cx="${x}" cy="${y}" r="2.2" fill="#5c646a"/>`; }).join('');
    }
    /* capa de interacción: agujeros y pines clicables */
    if (opts.hits) {
      for (const h of allHoles()) { const {x,y} = pointXY(h); s += `<circle class="hit" data-point="${h}" cx="${x}" cy="${y}" r="7.2" fill="rgba(0,0,0,0)" style="cursor:pointer"/>`; }
      for (const p of Object.keys(PIN_POS)) { const {x,y} = PIN_POS[p]; s += `<circle class="hit" data-point="P:${p}" cx="${x}" cy="${y}" r="8.5" fill="rgba(0,0,0,0)" style="cursor:pointer"/>`; }
    }
    if (opts.extra) s += opts.extra;
    s += `</svg>`;
    return s;
  }

  return { COLS, ROW_ORDER, ROW_Y, BOARD_W, BOARD_H, UNO, PIN_POS, colX, parsePoint, pointXY,
           islandOf, shiftHole, allHoles, DEFS, legsOf, computeNets, netPoints, fmtOhms, bandsFor, render };
})();

/* schematic.js — Esquema eléctrico (sin micro) y electrónico (con UNO) a partir
   de la lista de ramas del circuito de cada ejercicio.
   Rama: { a:'D13'|'+5V'|'GND', via:[[tipo,etiqueta],...], b:'GND'|'+5V'|'A0' } */
'use strict';

const Schematic = (() => {
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

  function symbol(tipo, x, y, label) {
    const wire = `<line x1="${x-46}" y1="${y}" x2="${x+46}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
    let body = '';
    if (tipo === 'res') {
      body = `<polyline points="${x-22},${y} ${x-16},${y-9} ${x-8},${y+9} ${x},${y-9} ${x+8},${y+9} ${x+16},${y-9} ${x+22},${y}" fill="none" stroke="#1d2733" stroke-width="2.2"/>`;
    } else if (tipo === 'led') {
      body = `<polygon points="${x-10},${y-10} ${x-10},${y+10} ${x+8},${y}" fill="#ffd9d9" stroke="#1d2733" stroke-width="2"/>
              <line x1="${x+10}" y1="${y-10}" x2="${x+10}" y2="${y+10}" stroke="#1d2733" stroke-width="2.4"/>
              <path d="M ${x+2} ${y-16} l 7 -5 M ${x+9} ${y-13} l 7 -5" stroke="#d92b2b" stroke-width="1.8"/>
              <path d="M ${x+14} ${y-21} l -1 4 M ${x+21} ${y-18} l -1 4" stroke="#d92b2b" stroke-width="1.8"/>`;
    } else if (tipo === 'button') {
      body = `<circle cx="${x-14}" cy="${y}" r="2.6" fill="#1d2733"/><circle cx="${x+14}" cy="${y}" r="2.6" fill="#1d2733"/>
              <line x1="${x-14}" y1="${y}" x2="${x+12}" y2="${y-13}" stroke="#1d2733" stroke-width="2.4"/>
              <line x1="${x+2}" y1="${y-20}" x2="${x+2}" y2="${y-13}" stroke="#1d2733" stroke-width="1.6" stroke-dasharray="3 2"/>`;
    } else if (tipo === 'pot') {
      body = `<rect x="-16" y="-6" width="32" height="12" fill="#fff" stroke="#1d2733" stroke-width="2" transform="translate(${x},${y})"/>
              <line x1="${x-12}" y1="${y+12}" x2="${x+12}" y2="${y-12}" stroke="#1d2733" stroke-width="2"/>
              <path d="M ${x+12} ${y-12} l -6 0 M ${x+12} ${y-12} l 0 6" stroke="#1d2733" stroke-width="2"/>`;
    } else if (tipo === 'photo') {
      body = `<rect x="-16" y="-6" width="32" height="12" fill="#fff" stroke="#1d2733" stroke-width="2" transform="translate(${x},${y})"/>
              <path d="M ${x-16} ${y-20} l 8 8 M ${x-6} ${y-22} l 8 8" stroke="#f07d18" stroke-width="2"/>
              <path d="M ${x-9} ${y-20} l 1 4 M ${x+1} ${y-22} l 1 4" stroke="#f07d18" stroke-width="1.8"/>`;
    } else if (tipo === 'batt') {
      body = `<line x1="${x-3}" y1="${y-13}" x2="${x-3}" y2="${y+13}" stroke="#1d2733" stroke-width="4.5"/>
              <line x1="${x+5}" y1="${y-7}" x2="${x+5}" y2="${y+7}" stroke="#1d2733" stroke-width="2.2"/>`;
    } else if (tipo === 'piezo') {
      body = `<line x1="${x-8}" y1="${y-11}" x2="${x-8}" y2="${y+11}" stroke="#1d2733" stroke-width="3"/>
              <line x1="${x+2}" y1="${y-11}" x2="${x+2}" y2="${y+11}" stroke="#1d2733" stroke-width="3"/>
              <path d="M ${x+2} ${y-11} a 13 11 0 0 1 0 22" fill="none" stroke="#1d2733" stroke-width="2"/>`;
    } else if (tipo === 'tilt') {
      body = `<circle cx="${x}" cy="${y}" r="13" fill="#fff" stroke="#1d2733" stroke-width="2"/>
              <line x1="${x-13}" y1="${y}" x2="${x+9}" y2="${y-8}" stroke="#1d2733" stroke-width="2.2"/>
              <circle cx="${x+4}" cy="${y+5}" r="2.6" fill="#1d2733"/>`;
    } else if (tipo === 'dot') {
      body = `<circle cx="${x}" cy="${y}" r="3.4" fill="#1d2733"/>`;
    } else { /* cajas: tmp36, servo, motor, lcd, hbridge, opto, transistor, foil, rgbled */
      const w = tipo === 'lcd' ? 64 : 52;
      body = `<rect x="${x - w/2}" y="${y-13}" width="${w}" height="26" rx="4" fill="#eef4ff" stroke="#1d2733" stroke-width="2"/>`;
      if (tipo === 'motor') body = `<circle cx="${x}" cy="${y}" r="14" fill="#eef4ff" stroke="#1d2733" stroke-width="2"/><text x="${x}" y="${y+5}" text-anchor="middle" font-size="13" font-weight="700" fill="#1d2733">M</text>`;
    }
    const lab = label ? `<text x="${x}" y="${y + 30}" text-anchor="middle" font-size="11.5" fill="#43525f">${esc(label)}</text>` : '';
    return wire + body + lab;
  }

  function terminal(name, x, y, withUno, side, simple) {
    const isRail = name === '+5V' || name === 'GND' || name === '+9V';
    const col = name === 'GND' ? '#1d2733' : (isRail ? '#d92b2b' : '#006e72');
    if (withUno && !isRail) {
      return `<rect x="${side === 'a' ? x - 64 : x}" y="${y - 13}" width="64" height="26" rx="5" fill="#1f6fb2"/>
              <text x="${side === 'a' ? x - 32 : x + 32}" y="${y + 4.5}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">${esc(name)}</text>`;
    }
    if (name === 'SEÑAL') {
      return `<circle cx="${x}" cy="${y}" r="6" fill="#fff7e8" stroke="#b26a00" stroke-width="2.4"/>
              <circle cx="${x}" cy="${y}" r="1.8" fill="#b26a00"/>
              <text x="${x}" y="${side === 'a' ? y - 13 : y + 25}" text-anchor="middle" font-size="12" font-weight="700" fill="#b26a00">Señal</text>`;
    }
    const label = simple && name === '+5V' ? 'Fuente 5 V' : name;
    return `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="${col}" stroke-width="2.4"/>
            <text x="${x}" y="${side === 'a' ? y - 12 : y + 24}" text-anchor="middle" font-size="12" font-weight="700" fill="${col}">${esc(label)}</text>`;
  }

  /* El esquema eléctrico de verdad: sin microcontrolador.
     - Un pin que ALIMENTABA un componente (LED, servo, piezo…) pasa a ser la Fuente 5 V.
     - Un divisor de sensor leído por un pin se redibuja entero desde la fuente (+5V → sensor → R → GND).
     - Donde el circuito HABLABA con la placa (la placa escuchaba), queda un terminal abierto: SEÑAL.
     - Las ramas que solo existían por el micro (tomas de señal puras, control↔control) desaparecen.
     - El potenciómetro es un divisor entre la fuente y GND: así se dibuja. */
  const PIN_RE = /^[DA]\d+$/;
  const ACTUATORS = ['led', 'rgbled', 'piezo', 'servo', 'motor', 'lcd', 'hbridge', 'transistor', 'opto'];
  const SENSORS = ['photo', 'tmp36'];
  function electrify(br) {
    const types = br.via.map(v => v[0]);
    if (types.length === 1 && types[0] === 'dot') return null;
    let a = br.a, b = br.b;
    const aPin = PIN_RE.test(a), bPin = PIN_RE.test(b);
    if (aPin && bPin) return null;
    if (types.includes('pot')) { a = '+5V'; b = 'GND'; }
    else {
      if (aPin) a = types.some(t => ACTUATORS.includes(t) || SENSORS.includes(t)) ? '+5V' : 'SEÑAL';
      if (bPin) b = 'SEÑAL';
    }
    return { a, via: br.via, b };
  }

  function wrapNote(txt, max = 86) {
    const words = String(txt).split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  function draw(ex, withUno) {
    const branches = withUno ? (ex.circuit || []) : (ex.circuit || []).map(electrify).filter(Boolean);
    const slotW = 96, x0 = 210;
    const maxVia = Math.max(1, ...branches.map(b => b.via.length));
    const W = Math.max(x0 + maxVia * slotW + 130, 660), rowH = 88, H = branches.length * rowH + 44;
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,system-ui,sans-serif">`;
    if (withUno) {
      const y1 = 22, y2 = 22 + branches.length * rowH;
      s += `<rect x="14" y="${y1}" width="118" height="${y2 - y1}" rx="10" fill="#1f6fb2"/>
            <text x="73" y="${(y1 + y2)/2 - 6}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">UNO</text>
            <text x="73" y="${(y1 + y2)/2 + 14}" text-anchor="middle" font-size="9.5" letter-spacing="2" fill="rgba(255,255,255,.8)">ARDUINO</text>`;
    }
    branches.forEach((br, i) => {
      const y = 78 + i * rowH;
      /* terminal a */
      if (withUno && !(br.a === '+5V' || br.a === 'GND' || br.a === '+9V')) {
        s += `<circle cx="132" cy="${y}" r="4" fill="#e8c85a"/><text x="124" y="${y - 10}" text-anchor="end" font-size="11.5" font-weight="700" fill="#ffffff">${esc(br.a)}</text>`;
        s += `<line x1="132" y1="${y}" x2="${x0 - 46}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      } else {
        s += terminal(br.a, x0 - 92, y, false, 'a', !withUno);
        s += `<line x1="${x0 - 92}" y1="${y}" x2="${x0 - 46}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      }
      /* componentes de la rama */
      br.via.forEach(([tipo, label], j) => { s += symbol(tipo, x0 + j * slotW, y, label); });
      const lastX = x0 + (br.via.length - 1) * slotW;
      const endX = lastX + 92;
      s += `<line x1="${lastX + 46}" y1="${y}" x2="${endX}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      s += terminal(br.b, endX, y, withUno, 'b', !withUno);
      if (br.note) {
        const lines = wrapNote(br.note);
        lines.forEach((ln, j) => {
          s += `<text x="${x0 - 46}" y="${y - 26 - (lines.length - 1 - j) * 14}" font-size="11.5" fill="#63707e">${esc(ln)}</text>`;
        });
      }
    });
    s += `</svg>`;
    return s;
  }

  /* El esquema eléctrico como CIRCUITO de verdad (como los de los libros):
     la fuente es una batería dibujada a la izquierda, con su + arriba y su − abajo;
     dos raíles (arriba el +, abajo GND) y cada rama una columna en paralelo que la
     corriente atraviesa de arriba abajo. El raíl intermedio Señal recoge lo que la
     placa escuchaba. Las ramas que no van entre raíles se dibujan sueltas debajo. */
  function battV(x, cy, label) {
    return `<line x1="${x - 17}" y1="${cy - 7}" x2="${x + 17}" y2="${cy - 7}" stroke="#1d2733" stroke-width="2.2"/>
            <line x1="${x - 9}" y1="${cy + 7}" x2="${x + 9}" y2="${cy + 7}" stroke="#1d2733" stroke-width="5"/>
            <text x="${x - 25}" y="${cy - 10}" font-size="14" font-weight="700" fill="#d92b2b">+</text>
            <text x="${x - 25}" y="${cy + 17}" font-size="14" font-weight="700" fill="#1d2733">−</text>
            <text x="${x}" y="${cy + 32}" text-anchor="middle" font-size="12" font-weight="700" fill="#43525f">${esc(label)}</text>`;
  }

  function drawElectric(ex) {
    const branches = (ex.circuit || []).map(electrify).filter(Boolean);
    const rungs = [], floats = [];
    for (const br of branches) {
      if (br.a === '+5V' && br.b === 'GND') rungs.push({ ...br, kind: 'full' });
      else if (br.a === '+5V' && br.b === 'SEÑAL') rungs.push({ ...br, kind: 'top-signal' });
      else if (br.a === 'SEÑAL' && br.b === 'GND') rungs.push({ ...br, kind: 'signal-bottom' });
      else if (br.a === '+9V' && br.b === 'GND') rungs.push({ ...br, kind: 'full9' });
      else floats.push(br);
    }
    const order = { full: 0, 'top-signal': 1, 'signal-bottom': 2, full9: 3 };
    rungs.sort((p, q) => order[p.kind] - order[q.kind]);

    const maxK = Math.max(1, ...rungs.map(r => r.via.length));
    const topY = 64, span = maxK === 1 ? 178 : 96 * maxK + 62;
    const botY = topY + span, busY = Math.round((topY + botY) / 2), midY = Math.round((topY + botY) / 2);
    const rungX = i => 172 + i * 118;
    const sigIdx = rungs.map((r, i) => (r.kind.includes('signal') ? i : -1)).filter(i => i >= 0);
    const hasSignal = sigIdx.length > 0;
    const first9 = rungs.findIndex(r => r.kind === 'full9');
    const has9 = first9 >= 0;
    const lastMain = has9 ? first9 - 1 : rungs.length - 1;
    const mainRailEnd = rungs.length ? rungX(Math.max(0, lastMain)) + 44 : 216;
    const batt9X = has9 ? rungX(rungs.length - 1) + 122 : 0;
    const railEnd = has9 ? batt9X : (rungs.length ? rungX(rungs.length - 1) + 56 : 260);
    const floatW = floats.length ? 210 + Math.max(...floats.map(f => f.via.length)) * 96 + 130 : 0;
    const W = Math.max(railEnd + (hasSignal ? 76 : 30), floatW, 560);
    const floatY0 = botY + 58;
    const H = floats.length ? floatY0 + floats.length * 68 + 4 : botY + 42;

    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,system-ui,sans-serif">`;
    /* batería principal y raíles */
    s += `<line x1="56" y1="${topY}" x2="56" y2="${midY - 7}" stroke="#1d2733" stroke-width="2.2"/>
          <line x1="56" y1="${midY + 7}" x2="56" y2="${botY}" stroke="#1d2733" stroke-width="2.2"/>`;
    s += battV(56, midY, '5 V');
    s += `<line x1="56" y1="${topY}" x2="${mainRailEnd}" y2="${topY}" stroke="#1d2733" stroke-width="2.2"/>
          <line x1="56" y1="${botY}" x2="${railEnd}" y2="${botY}" stroke="#1d2733" stroke-width="2.2"/>`;
    /* flecha de la corriente en el raíl de vuelta */
    s += `<polygon points="102,${botY} 118,${botY - 5} 118,${botY + 5}" fill="#d92b2b"/>
          <text x="110" y="${botY + 21}" text-anchor="middle" font-size="11.5" font-style="italic" fill="#d92b2b">corriente I</text>`;
    /* raíl Señal */
    if (hasSignal) {
      const x1 = rungX(sigIdx[0]), x2 = rungX(sigIdx[sigIdx.length - 1]);
      s += `<line x1="${x1}" y1="${busY}" x2="${x2}" y2="${busY}" stroke="#b26a00" stroke-width="2.2"/>
            <text x="${x2 + 12}" y="${busY + 4}" font-size="12.5" font-weight="700" fill="#b26a00">Señal</text>`;
    }
    /* batería de 9 V si la hay */
    if (has9) {
      s += `<line x1="${rungX(first9)}" y1="${topY}" x2="${batt9X}" y2="${topY}" stroke="#1d2733" stroke-width="2.2"/>
            <line x1="${batt9X}" y1="${topY}" x2="${batt9X}" y2="${midY - 7}" stroke="#1d2733" stroke-width="2.2"/>
            <line x1="${batt9X}" y1="${midY + 7}" x2="${batt9X}" y2="${botY}" stroke="#1d2733" stroke-width="2.2"/>`;
      s += battV(batt9X, midY, '9 V');
    }
    /* ramas en paralelo */
    rungs.forEach((r, i) => {
      const x = rungX(i);
      const y1 = r.kind === 'signal-bottom' ? busY : topY;
      const y2 = r.kind === 'top-signal' ? busY : botY;
      s += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#1d2733" stroke-width="2.2"/>`;
      if (r.kind !== 'signal-bottom') s += `<circle cx="${x}" cy="${topY}" r="3.2" fill="#1d2733"/>`;
      if (r.kind !== 'top-signal') s += `<circle cx="${x}" cy="${botY}" r="3.2" fill="#1d2733"/>`;
      if (r.kind.includes('signal')) s += `<circle cx="${x}" cy="${busY}" r="3.2" fill="#b26a00"/>`;
      const k = r.via.length;
      r.via.forEach(([tipo, label], j) => {
        const cy = Math.round(y1 + (j + 1) * (y2 - y1) / (k + 1));
        if (tipo === 'motor') {
          s += `<line x1="${x}" y1="${cy - 46}" x2="${x}" y2="${cy + 46}" stroke="#43525f" stroke-width="2"/>
                <circle cx="${x}" cy="${cy}" r="14" fill="#eef4ff" stroke="#1d2733" stroke-width="2"/>
                <text x="${x}" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#1d2733">M</text>`;
        } else {
          s += `<g transform="translate(${x} ${cy}) rotate(90)">${symbol(tipo, 0, 0, '')}</g>`;
        }
        const lab = String(label || tipo).replace(/\s*\([^)]*\)/g, '');
        s += `<text x="${x + 15}" y="${cy + 4}" font-size="11.5" fill="#43525f">${esc(lab)}</text>`;
      });
    });
    /* ramas sueltas (no van entre raíles) */
    floats.forEach((br, i) => {
      const y = floatY0 + i * 68 + 14;
      s += terminal(br.a, 118, y, false, 'a', true);
      s += `<line x1="118" y1="${y}" x2="164" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      br.via.forEach(([tipo, label], j) => { s += symbol(tipo, 210 + j * 96, y, label); });
      const lastX = 210 + (br.via.length - 1) * 96;
      s += `<line x1="${lastX + 46}" y1="${y}" x2="${lastX + 92}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      s += terminal(br.b, lastX + 92, y, false, 'b', true);
    });
    s += `</svg>`;
    return s;
  }

  return { draw, drawElectric };
})();

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

  function terminal(name, x, y, withUno, side) {
    const isRail = name === '+5V' || name === 'GND' || name === '+9V';
    const col = name === 'GND' ? '#1d2733' : (isRail ? '#d92b2b' : '#006e72');
    if (withUno && !isRail) {
      return `<rect x="${side === 'a' ? x - 64 : x}" y="${y - 13}" width="64" height="26" rx="5" fill="#1f6fb2"/>
              <text x="${side === 'a' ? x - 32 : x + 32}" y="${y + 4.5}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">${esc(name)}</text>`;
    }
    return `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="${col}" stroke-width="2.4"/>
            <text x="${x}" y="${side === 'a' ? y - 12 : y + 24}" text-anchor="${side === 'a' ? 'middle' : 'middle'}" font-size="12" font-weight="700" fill="${col}">${esc(name)}</text>`;
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
    const branches = ex.circuit || [];
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
        s += terminal(br.a, x0 - 92, y, false, 'a');
        s += `<line x1="${x0 - 92}" y1="${y}" x2="${x0 - 46}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      }
      /* componentes de la rama */
      br.via.forEach(([tipo, label], j) => { s += symbol(tipo, x0 + j * slotW, y, label); });
      const lastX = x0 + (br.via.length - 1) * slotW;
      const endX = lastX + 92;
      s += `<line x1="${lastX + 46}" y1="${y}" x2="${endX}" y2="${y}" stroke="#43525f" stroke-width="2"/>`;
      s += terminal(br.b, endX, y, withUno, 'b');
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

  return { draw };
})();

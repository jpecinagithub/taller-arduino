/* app.js — Menú lateral, rutas y páginas de cada ejercicio. */
'use strict';

const App = (() => {
  const view = document.getElementById('view');
  const menu = document.getElementById('menu');
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

  function buildMenu() {
    const done = EXERCISES.filter(e => e.status === 'done').length;
    document.getElementById('progress-text').textContent = done + ' de 15';
    document.getElementById('progress-fill').style.width = (done / 15 * 100) + '%';
    let h = `<div class="menu-section">Tu laboratorio</div>
      <a class="menu-item sandbox-item" data-route="sandbox"><span class="num">🧪</span><span class="ttl">Sandbox editable<br><small style="color:#9fb6c0">Tu Tinkercad casero</small></span></a>
      <div class="menu-section">Los 15 proyectos del libro</div>`;
    for (const ex of EXERCISES) {
      h += `<a class="menu-item" data-route="ex-${ex.id}"><span class="num">${ex.id}</span><span class="ttl">${esc(ex.short)}</span><span class="dot ${ex.status === 'done' ? 'done' : 'planned'}"></span></a>`;
    }
    menu.innerHTML = h;
    menu.querySelectorAll('.menu-item').forEach(a => a.addEventListener('click', () => {
      location.hash = a.dataset.route === 'sandbox' ? '#/sandbox' : '#/ejercicio/' + a.dataset.route.slice(3);
    }));
  }
  function markActive(route) {
    menu.querySelectorAll('.menu-item').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  }

  function pinRows(ex) {
    return ex.circuit.map(br => {
      const via = br.via.map(([t, l]) => esc(l || t)).join(' → ');
      return `<tr><td><b>${esc(br.a)}</b></td><td>${via}</td><td><b>${esc(br.b)}</b></td></tr>`;
    }).join('');
  }

  function renderExercise(ex) {
    markActive('ex-' + ex.id);
    const prev = EXERCISES.find(e => e.id === ex.id - 1);
    const next = EXERCISES.find(e => e.id === ex.id + 1);
    const statusChip = ex.status === 'done'
      ? `<span class="chip done">✅ Completado · ${esc(ex.date)}</span>`
      : `<span class="chip planned">🕐 Planificado · aún no lo hemos hecho</span>`;
    view.innerHTML = `
    <div class="ex-head">
      <div>
        <div class="ex-kicker">Ejercicio ${ex.id} de 15 · Arduino Starter Kit</div>
        <h1 class="ex-title">${esc(ex.title)}</h1>
        <div class="ex-meta">${statusChip}<span class="chip design">Diseño en Tinkercad: «${esc(ex.design)}»</span></div>
      </div>
    </div>

    <section class="card">
      <h2><span class="h-ico">📖</span>Qué vamos a hacer</h2>
      <p>${esc(ex.intro)}</p>
      <div class="parts">${ex.parts.map(p => `<span class="part">${esc(p)}</span>`).join('')}</div>
    </section>

    <section class="card">
      <h2><span class="h-ico">💡</span>Las 3 ideas que tienes que sacar en claro</h2>
      <div class="ideas">
        ${ex.ideas.map((idea, i) => `<div class="idea"><div class="idea-num">Idea ${i + 1}</div><p>${esc(idea)}</p></div>`).join('')}
      </div>
    </section>

    <section class="card">
      <h2><span class="h-ico">⚡</span>Esquema eléctrico</h2>
      <p>El circuito a pelo, dibujado como los de los libros: una <b>batería de 5 V</b> en vez del Arduino, y la corriente recorriendo las ramas. Fuera microcontrolador, fuera código, fuera pines.</p>
      <div class="svg-wrap">${Schematic.drawElectric(ex)}</div>
      <p class="legend">La batería alimenta dos raíles: el de arriba sale de su <b>+</b> y el de abajo vuelve a su <b>−</b> (GND). Cada columna es una rama en paralelo: la corriente baja por ella atravesando sus componentes, y la flecha roja marca su sentido (<i>I</i>). Donde el circuito «hablaba» con la placa queda el raíl intermedio <b>Señal</b>, que no toca la batería: por ahí no manda corriente, ahí la placa escuchaba. Y lo que solo existía gracias al microcontrolador ni siquiera aparece: sin cerebro, no hay nada que lo sostenga.</p>
    </section>

    <section class="card">
      <h2><span class="h-ico">🔌</span>Esquema electrónico</h2>
      <p>El mismo circuito con el Arduino UNO gobernándolo: qué pin hace qué, y el código que lo mueve.</p>
      <div class="svg-wrap">${Schematic.draw(ex, true)}</div>
      <table class="pin-table"><thead><tr><th>Origen</th><th>Pasa por</th><th>Destino</th></tr></thead><tbody>${pinRows(ex)}</tbody></table>
      <div class="code-head" style="margin-top:18px">
        <h2 style="font-size:16px"><span class="h-ico">💻</span>${ex.status === 'done' ? 'El código final (el que funcionó)' : 'El código (del libro, punto de partida)'}</h2>
        <button class="btn ghost small" id="copy-code">Copiar código</button>
      </div>
      <pre class="code">${esc(ex.code)}</pre>
    </section>

    <section class="card">
      <h2><span class="h-ico">🧩</span>Maqueta en la protoboard</h2>
      <p>Así queda montado en la placa${ex.status === 'done' ? ' (tal como lo construimos en Tinkercad)' : ' (maqueta prevista según el libro; la ajustaremos al construirlo)'}. Los raíles + y − se alimentan desde los pines 5V y GND del UNO, y recuerda: cada raíl está cortado a mitad de placa (entre las columnas 30 y 31).</p>
      <div class="svg-wrap">${Board.render(ex.layout)}</div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="to-sandbox">🧪 Abrir esta maqueta en el sandbox</button>
      </div>
      <p class="legend">En el sandbox podrás mover componentes, cambiar valores, recablear y cargar cualquier otra maqueta.</p>
    </section>

    <nav class="ex-nav">
      ${prev ? `<a href="#/ejercicio/${prev.id}"><div class="nav-card"><div class="nav-dir">← Anterior</div><div class="nav-name">${prev.id}. ${esc(prev.short)}</div></div></a>` : '<span class="spacer"></span>'}
      ${next ? `<a href="#/ejercicio/${next.id}"><div class="nav-card" style="text-align:right"><div class="nav-dir">Siguiente →</div><div class="nav-name">${next.id}. ${esc(next.short)}</div></div></a>` : '<span class="spacer"></span>'}
    </nav>`;
    document.getElementById('copy-code').addEventListener('click', async ev => {
      try { await navigator.clipboard.writeText(ex.code); ev.target.textContent = '¡Copiado!'; }
      catch (e) { ev.target.textContent = 'No se pudo copiar'; }
      setTimeout(() => { ev.target.textContent = 'Copiar código'; }, 1600);
    });
    document.getElementById('to-sandbox').addEventListener('click', () => {
      Sandbox.loadLayout(ex.layout, `Ejercicio ${ex.id} · ${ex.title}`);
      location.hash = '#/sandbox';
    });
    window.scrollTo(0, 0);
  }

  function renderSandbox() {
    markActive('sandbox');
    const pal = Object.entries(Board.DEFS).map(([type, d]) =>
      `<button class="pal-item" data-type="${type}"><span class="pal-ico">${d.icon}</span>${d.name}</button>`).join('');
    const exOptions = EXERCISES.map(e => `<option value="${e.id}">Ejercicio ${e.id} · ${esc(e.short)}</option>`).join('');
    view.innerHTML = `
    <div class="ex-head"><div>
      <div class="ex-kicker">Tu laboratorio</div>
      <h1 class="ex-title">Sandbox editable</h1>
      <p style="color:var(--muted);max-width:720px;line-height:1.6;margin:6px 0 0">Una protoboard como la de Tinkercad para jugar sin miedo, <b>sin modos</b>: clic en un agujero y clic en otro para cablear (la isla del origen se ilumina sola, la lección del proyecto 07), arrastra los componentes para moverlos y elige en la paleta para añadir nuevos. Ojo: esto es un editor de maquetas, no un simulador — no ejecuta el código ni enciende los LED; para simular sigue mandando Tinkercad.</p>
    </div></div>
    <div class="sb-toolbar" style="margin-top:16px">
      <label style="font-size:13px;color:var(--muted)">Color del cable <select id="sb-wirecolor">
        <option value="#d92b2b">rojo</option><option value="#2b2b30">negro</option><option value="#f07d18">naranja</option>
        <option value="#d9a416">amarillo</option><option value="#2a9e4f">verde</option><option value="#2456c8">azul</option>
        <option value="#8b46c7">morado</option><option value="#7d838a">gris</option>
      </select></label>
      <div class="sep"></div>
      <label style="font-size:13px;color:var(--muted)">Cargar maqueta <select id="sb-load-ex"><option value="">elige un ejercicio…</option>${exOptions}</select></label>
      <button class="tool-btn" id="sb-clear">🗑️ Placa vacía</button>
    </div>
    <div class="sb-layout">
      <div class="sb-palette"><h3>Componentes</h3>${pal}</div>
      <div>
        <div class="sb-canvas" id="sb-canvas"></div>
        <div class="sb-status" id="sb-status"></div>
      </div>
      <div class="props" id="sb-props"></div>
    </div>`;
    Sandbox.init({
      canvas: document.getElementById('sb-canvas'),
      props: document.getElementById('sb-props'),
      status: document.getElementById('sb-status'),
    });
    window.scrollTo(0, 0);
  }

  function route() {
    const h = location.hash || '#/ejercicio/1';
    if (h.startsWith('#/sandbox')) { renderSandbox(); return; }
    const m = h.match(/#\/ejercicio\/(\d+)/);
    const ex = EXERCISES.find(e => e.id === (m ? parseInt(m[1], 10) : 1)) || EXERCISES[0];
    renderExercise(ex);
  }

  buildMenu();
  window.addEventListener('hashchange', route);
  route();
  return {};
})();

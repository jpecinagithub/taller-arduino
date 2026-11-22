# 🔌 Taller Arduino — Los 15 proyectos del Starter Kit

Web app personal de Jon para acompañar el **Arduino Official Starter Kit for Beginners (K030007)**:
los 15 proyectos del libro, hechos primero en Tinkercad mientras llega el kit físico.

## Qué hay en cada ejercicio

- **📖 Qué vamos a hacer** — explicación breve del proyecto y lista de componentes.
- **💡 Las 3 ideas** que hay que sacar en claro de cada ejercicio.
- **⚡ Esquema eléctrico** — el circuito sin microcontrolador.
- **🔌 Esquema electrónico** — el mismo circuito gobernado por el UNO: pines, tabla de conexiones y el código (el final verificado en los proyectos hechos; el del libro como punto de partida en los pendientes).
- **🧩 Maqueta** — el montaje en la protoboard tal como se construyó en Tinkercad.

## 🧪 Sandbox editable

Un editor de maquetas tipo Tinkercad, en el navegador:

- Añadir y quitar componentes (resistencias, LED, LED RGB, pulsadores, potenciómetro, LDR, TMP36, piezo, servo, motor, transistor, puente H, LCD, batería 9V, optoacoplador, lámina táctil…).
- Editar parámetros: valor de las resistencias (con sus bandas de colores calculadas), color de los LED…
- Cablear entre cualquier agujero o pin del UNO, mover y girar componentes.
- **Modo Red**: clic en un agujero y se ilumina su isla completa — la protoboard conecta por columnas, con los raíles cortados a mitad de placa, como la de verdad.
- Cargar la maqueta de cualquier ejercicio y guardado automático en el navegador.

Es un editor de maquetas, no un simulador: no ejecuta código. Para simular, Tinkercad.

## Estado

- ✅ Completados en Tinkercad: proyectos 01–07 (20–22 nov 2026).
- 🕐 Planificados: 08–15 (contenido del libro, maquetas previstas).

## Tecnología

HTML + CSS + JavaScript sin dependencias ni build: se sirve tal cual como sitio estático.
Los esquemas y las maquetas se dibujan como SVG generados desde los datos de cada ejercicio (`js/data.js`).

## Desarrollo local

```bash
python3 -m http.server 8000
# http://localhost:8000
```

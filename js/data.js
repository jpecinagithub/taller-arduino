/* data.js — Contenido de los 15 proyectos: explicación, 3 ideas, circuito,
   código y maqueta (componentes + cables sobre la protoboard). */
'use strict';

let _cid = 0, _wid = 0;
const C = (type, anchor, rot = 0, props = {}) =>
  ({ id:'c' + (++_cid), type, anchor, rot, props: Object.assign({}, Board.DEFS[type].defProps, props) });
const W = (from, to, color) => ({ id:'w' + (++_wid), from, to, color });
const RED = '#d92b2b', BLK = '#2b2b30', ORG = '#f07d18', YEL = '#d9a416',
      GRN = '#2a9e4f', BLU = '#2456c8', PUR = '#8b46c7', GRY = '#7d838a', BRN = '#7a4a21';

const EXERCISES = [
/* ================= 01 · BLINK ================= */
{ id:1, title:'Conoce tus herramientas · Blink', short:'Blink', design:'01 Blink',
  status:'done', date:'20 nov 2026',
  intro:'El primer contacto: hacer que un LED parpadee. Primero el LED interno de la placa (pin 13) sin tocar un solo cable, y después el mismo parpadeo con un LED de verdad pinchado en la protoboard, con su resistencia en serie. Es el «hola, mundo» de la electrónica: si esto funciona, la cadena entera (código → placa → circuito) está viva.',
  ideas:[
    'El Arduino es un ordenador diminuto que repite sin descanso un ciclo: mirar → decidir → actuar (el loop). No hace una cosa una vez: la hace millones de veces.',
    'Todo LED necesita una resistencia en serie que limite la corriente. Sin ese «freno», el LED se quema: con 220 Ω circulan unos 14 mA, una corriente sana.',
    'digitalWrite solo sabe decir 5V o 0V (HIGH/LOW). El parpadeo nace de alternar esos dos estados con pausas de delay(): el tiempo también se programa.',
  ],
  parts:['LED rojo','Resistencia 220 Ω','Cables'],
  circuit:[
    { a:'D13', via:[['res','220 Ω'],['led','LED rojo']], b:'GND', note:'En serie, el orden no importa: la resistencia frena igual antes o después del LED. La placa se alimenta por USB, y el pin 13 lleva además un LED interno en la propia placa.' },
  ],
  code:
`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);   // 5V: LED encendido
  delay(1000);              // espera 1 segundo
  digitalWrite(13, LOW);    // 0V: LED apagado
  delay(1000);
}`,
  layout:{ components:[
      C('led','C28',0,{ color:'#d92b2b' }),
      C('resistor','E28',1,{ value:220 }),
    ], wires:[
      W('P:GND','B-18',BLK),
      W('F28','B-28',BLK),
      W('A29','P:D13',ORG),
    ] } },

/* ================= 02 · NAVE ESPACIAL ================= */
{ id:2, title:'Interfaz de nave espacial', short:'Nave espacial', design:'02 Nave espacial',
  status:'done', date:'21 nov 2026',
  intro:'Un panel de control: en reposo luce un LED verde; al mantener apretado un pulsador, el verde se apaga y dos LED rojos parpadean alternándose cada 250 ms. Es el primer circuito que ESCUCHA: el Arduino lee el pulsador en el pin 2 y decide qué luces encender.',
  ideas:[
    'Una entrada sin camino definido «flota» y lee valores al azar. La resistencia de 10 kΩ a GND (pull-down) fija el valor cuando no aprietas: sin flujo también hay que decir qué vale.',
    'Las dos resistencias del kit tienen oficios distintos: la de 220 Ω limita un flujo que trabaja (el del LED); la de 10 kΩ fija un valor cuando no hay flujo (la señal del pulsador).',
    'digitalRead + if/else es la primera decisión de verdad: el mismo programa hace cosas distintas según lo que el mundo le dice.',
  ],
  parts:['Pulsador','LED verde','2× LED rojo','3× Resistencia 220 Ω','Resistencia 10 kΩ (pull-down)','Cables'],
  circuit:[
    { a:'+5V', via:[['button','Pulsador']], b:'D2', note:'Al apretar, los 5V llegan al pin 2 y este lee HIGH.' },
    { a:'D2', via:[['res','10 kΩ']], b:'GND', note:'Pull-down: sin apretar, el pin 2 queda anclado a 0V y lee LOW.' },
    { a:'D3', via:[['led','LED verde'],['res','220 Ω']], b:'GND' },
    { a:'D4', via:[['led','LED rojo'],['res','220 Ω']], b:'GND' },
    { a:'D5', via:[['led','LED rojo'],['res','220 Ω']], b:'GND' },
  ],
  code:
`int estado = 0;

void setup() {
  pinMode(2, INPUT);
  pinMode(3, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(5, OUTPUT);
}

void loop() {
  estado = digitalRead(2);
  if (estado == LOW) {          // sin apretar: solo el verde
    digitalWrite(3, HIGH);
    digitalWrite(4, LOW);
    digitalWrite(5, LOW);
  } else {                      // apretando: los rojos se alternan
    digitalWrite(3, LOW);
    digitalWrite(4, LOW);
    digitalWrite(5, HIGH);
    delay(250);
    digitalWrite(4, HIGH);
    digitalWrite(5, LOW);
    delay(250);
  }
}`,
  layout:{ components:[
      C('button','E20'),
      C('resistor','H24',0,{ value:10000 }),
      C('led','C10',0,{ color:'#2a9e4f' }), C('resistor','E10',1,{ value:220 }),
      C('led','C18',0,{ color:'#d92b2b' }), C('resistor','E18',1,{ value:220 }),
      C('led','C26',0,{ color:'#d92b2b' }), C('resistor','E26',1,{ value:220 }),
    ], wires:[
      W('P:5V','B+16',RED), W('P:GND','B-16',BLK),
      W('J20','B+20',RED),
      W('G23','P:D2',YEL), W('J23','J24',YEL), W('F28','B-28',BLK),
      W('A11','P:D3',GRN), W('F10','B-10',BLK),
      W('A19','P:D4',ORG), W('F18','B-18',BLK),
      W('A27','P:D5',ORG), W('F26','B-26',BLK),
    ] } },

/* ================= 03 · LOVE-O-METER ================= */
{ id:3, title:'Love-O-Meter · Termómetro de contacto', short:'Love-O-Meter', design:'03 Love-O-Meter',
  status:'done', date:'20 nov 2026',
  intro:'Un termómetro que se lee con los dedos: el sensor TMP36 convierte la temperatura en una tensión, el Arduino la mide por A0 y enciende 0, 1, 2 o 3 LED según te alejes de la temperatura base (24 °C). Al agarrar el sensor con la mano, tu calor hace subir la escalera de luces.',
  ideas:[
    'analogRead traduce una tensión a un número de 0 a 1023 (conversor de 10 bits: cada paso son unos 4,9 mV). Por primera vez el Arduino no oye «sí/no»: oye cantidades.',
    'El TMP36 habla en tensión: 0,5 V son 0 °C y cada grado suma 10 mV. Medir es traducir: lectura → tensión → temperatura, con dos cuentas encadenadas.',
    'El monitor serie es la ventana para VER lo que el Arduino mide. Sin él, programar sensores es ir a ciegas.',
  ],
  parts:['Sensor TMP36','3× LED rojo','3× Resistencia 220 Ω','Cables'],
  circuit:[
    { a:'+5V', via:[['tmp36','TMP36']], b:'GND', note:'El TMP36 se alimenta entre +5V y GND; su patilla central entrega la señal.' },
    { a:'A0', via:[['dot','señal']], b:'TMP36', note:'La señal es una tensión: 10 mV por grado, con 0,5 V a 0 °C.' },
    { a:'D2', via:[['led','LED 1'],['res','220 Ω']], b:'GND', note:'Nivel 1: temperatura base alcanzada.' },
    { a:'D3', via:[['led','LED 2'],['res','220 Ω']], b:'GND', note:'Nivel 2: base + 2 °C.' },
    { a:'D4', via:[['led','LED 3'],['res','220 Ω']], b:'GND', note:'Nivel 3: base + 4 °C.' },
  ],
  code:
`const int sensorPin = A0;
const float tempBase = 24.0;

void setup() {
  Serial.begin(9600);
  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(4, OUTPUT);
}

void loop() {
  int lectura = analogRead(sensorPin);
  float tension = (lectura / 1024.0) * 5.0;
  float temperatura = (tension - 0.5) * 100;

  Serial.print("Lectura: "); Serial.print(lectura);
  Serial.print("  Tension: "); Serial.print(tension);
  Serial.print("  Temperatura: "); Serial.println(temperatura);

  if (temperatura < tempBase) {
    digitalWrite(2, LOW);  digitalWrite(3, LOW);  digitalWrite(4, LOW);
  } else if (temperatura < tempBase + 2) {
    digitalWrite(2, HIGH); digitalWrite(3, LOW);  digitalWrite(4, LOW);
  } else if (temperatura < tempBase + 4) {
    digitalWrite(2, HIGH); digitalWrite(3, HIGH); digitalWrite(4, LOW);
  } else {
    digitalWrite(2, HIGH); digitalWrite(3, HIGH); digitalWrite(4, HIGH);
  }
  delay(500);
}`,
  layout:{ components:[
      C('tmp36','H10'),
      C('led','C20',0,{ color:'#d92b2b' }), C('resistor','E20',1,{ value:220 }),
      C('led','C27',0,{ color:'#d92b2b' }), C('resistor','E27',1,{ value:220 }),
      C('led','C29',0,{ color:'#d92b2b' }), C('resistor','E29',1,{ value:220 }),
    ], wires:[
      W('P:5V','B+14',RED), W('P:GND','B-14',BLK),
      W('J10','B+10',RED), W('J12','B-12',BLK), W('F11','P:A0',GRN),
      W('A21','P:D2',GRN), W('F20','B-20',BLK),
      W('A28','P:D3',ORG), W('F27','B-27',BLK),
      W('A30','P:D4',RED), W('F29','B-29',BLK),
    ] } },

/* ================= 04 · LÁMPARA DE COLOR ================= */
{ id:4, title:'Lámpara mezcladora de color', short:'Lámpara de color', design:'04 Lampara de color',
  status:'done', date:'21 nov 2026',
  intro:'Una lámpara que pinta con la luz que recibe: tres fotorresistencias (una por color, con sus filtros) miden cuánta luz roja, verde y azul hay en el ambiente, y un LED RGB reproduce esa mezcla brillando con el color resultante. Lo que el circuito ve, el circuito lo devuelve en luz.',
  ideas:[
    'El divisor de tensión es EL circuito de los sensores: dos resistencias en serie y la señal se lee en el punto medio. Si una de ellas cambia con el mundo (la LDR con la luz), el punto medio se mueve y el Arduino lo nota.',
    'analogWrite no regula la tensión: trocea la corriente (PWM, 0–255) encendiendo y apagando tan rápido que el ojo ve un brillo intermedio. Fingir cantidades con interruptores rapidísimos.',
    'El sistema completo tiene anatomía: ojos (sensores) → cerebro (código) → mano (LED). Y una regla de oro del taller: una resistencia solo trabaja entre DOS nodos distintos; dentro de una misma columna está puenteada y no hace nada.',
  ],
  parts:['LED RGB (cátodo común)','3× Fotorresistencia','3× Resistencia 220 Ω','3× Resistencia 10 kΩ','Cables'],
  circuit:[
    { a:'A0', via:[['photo','LDR rojo (a +5V)'],['res','10 kΩ (a GND)']], b:'GND', note:'Divisor del canal rojo: A0 lee el punto medio.' },
    { a:'A2', via:[['photo','LDR verde (a +5V)'],['res','10 kΩ (a GND)']], b:'GND', note:'Divisor del canal verde.' },
    { a:'A4', via:[['photo','LDR azul (a +5V)'],['res','10 kΩ (a GND)']], b:'GND', note:'Divisor del canal azul.' },
    { a:'D11', via:[['res','220 Ω'],['rgbled','RGB · rojo']], b:'GND', note:'El cátodo común va directo a GND; cada color lleva su 220 Ω y su pin PWM.' },
    { a:'D10', via:[['res','220 Ω'],['rgbled','RGB · verde']], b:'GND' },
    { a:'D9',  via:[['res','220 Ω'],['rgbled','RGB · azul']], b:'GND' },
  ],
  code:
`void setup() {
  Serial.begin(9600);
}

void loop() {
  int r = analogRead(A0);   // luz roja
  int v = analogRead(A2);   // luz verde
  int a = analogRead(A4);   // luz azul

  Serial.print("Sensores R/V/A: ");
  Serial.print(r); Serial.print(" / ");
  Serial.print(v); Serial.print(" / ");
  Serial.println(a);

  analogWrite(11, r / 4);   // de 0-1023 a 0-255
  analogWrite(10, v / 4);
  analogWrite(9, a / 4);
  delay(300);
}`,
  layout:{ components:[
      C('rgbled','C14'),
      C('resistor','A14',0,{ value:220 }), C('resistor','B16',0,{ value:220 }), C('resistor','A17',0,{ value:220 }),
      C('photo','H8'),  C('resistor','H12',0,{ value:10000 }),
      C('photo','H22'), C('resistor','H26',0,{ value:10000 }),
      C('photo','H38'), C('resistor','H42',0,{ value:10000 }),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('B+28','B+38',RED), W('B-29','B-40',BLK),
      W('E15','B-15',BLK),
      W('B18','P:D11',RED), W('A20','P:D10',GRN), W('B21','P:D9',BLU),
      W('J8','B+8',RED),   W('J10','J12',ORG), W('F16','B-16',BLK), W('G10','P:A0',ORG),
      W('J22','B+22',RED), W('J24','J26',YEL), W('F30','B-30',BLK), W('G24','P:A2',YEL),
      W('J38','B+38',BLU), W('J40','J42',BLU), W('F46','B-46',BLK), W('G40','P:A4',BLU),
    ] } },
];

EXERCISES.push(
/* ================= 05 · MOOD CUE ================= */
{ id:5, title:'Mood Cue · El servo que obedece al mando', short:'Mood Cue', design:'05 Mood Cue',
  status:'done', date:'21 nov 2026',
  intro:'Un potenciómetro (un mando giratorio) gobierna la posición de un servo: al girar el mando, el brazo del servo sigue el giro entre 0° y 179°. Es el primer actuador con movimiento de verdad, y salió a la primera, sin un solo fallo de cableado.',
  ideas:[
    'El potenciómetro es el divisor de tensión del proyecto 04… pero con mando: las dos resistencias son una sola pista y el cursor elige el punto medio al girar. Tú decides dónde se lee la señal.',
    'map() es un traductor de escalas: convierte la lectura 0–1023 en ángulo 0–179 guardando la proporción. Traducir sin deformar es la mitad de programar sensores.',
    'Las bibliotecas son código de otros que se trae con #include: Servo.h sabe generar los pulsos exactos que el servo entiende, y tú solo dices el ángulo. No reinventar lo que ya existe.',
  ],
  parts:['Potenciómetro 10 kΩ','Servo','Cables'],
  circuit:[
    { a:'A0', via:[['pot','Potenciómetro 10 kΩ']], b:'+5V', note:'Las patillas laterales van a +5V y GND; la central (el cursor) es la que lee A0.' },
    { a:'D9', via:[['servo','Servo · señal']], b:'GND', note:'El servo se alimenta de +5V (rojo) y GND (marrón); por la señal (naranja) viajan los pulsos que fijan el ángulo.' },
  ],
  code:
`#include <Servo.h>

Servo miServo;

void setup() {
  miServo.attach(9);
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(A0);
  int angulo = map(lectura, 0, 1023, 0, 179);
  miServo.write(angulo);

  Serial.print("Lectura: "); Serial.print(lectura);
  Serial.print("  Angulo: "); Serial.println(angulo);
  delay(15);
}`,
  layout:{ components:[
      C('pot','H10',0,{ value:10000 }),
      C('servo','H24'),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('J10','B+10',RED), W('J12','B-12',BLK), W('F11','P:A0',ORG),
      W('F24','P:D9',ORG), W('J25','B+25',RED), W('J26','B-26',BLK),
    ] } },

/* ================= 06 · THEREMIN ================= */
{ id:6, title:'Theremin de luz', short:'Theremin', design:'06 Theremin',
  status:'done', date:'21 nov 2026',
  intro:'Un instrumento que se toca sin tocarlo: la fotorresistencia mide la luz que le llega (tu mano haciendo sombra) y el piezo canta una nota tanto más aguda cuanta más luz. Antes de tocar hay que calibrarlo: durante 5 segundos el Arduino aprende cuál es tu oscuridad y cuál es tu luz.',
  ideas:[
    'Calibrar es medir TU mundo antes de traducir: un divisor real nunca lee 0 ni 1023 (la LDR fue de 54 en penumbra a 974 a plena luz). El instrumento se afina con los extremos reales, no con los teóricos.',
    'tone() no «pone una tensión»: conmuta el pin entre 0V y 5V a la frecuencia de la nota — una onda cuadrada. La altura del sonido ES la velocidad de ese parpadeo (f = 1/periodo), y se vio en el osciloscopio.',
    'El piezo convierte electricidad en vibración (y al revés: es el mismo cristal de los hermanos Curie, 1880). Aquí es altavoz; en el proyecto 12 será micrófono de golpes.',
  ],
  parts:['Fotorresistencia','Resistencia 10 kΩ','Piezo','Cables'],
  circuit:[
    { a:'A0', via:[['photo','LDR (a +5V)'],['res','10 kΩ (a GND)']], b:'GND', note:'El divisor de siempre: A0 lee el punto medio entre la LDR y los 10 kΩ.' },
    { a:'D8', via:[['piezo','Piezo']], b:'GND', note:'tone() conmuta el pin 8 entre 0 y 5V a la frecuencia de la nota.' },
  ],
  code:
`int sensorLow = 1023;
int sensorHigh = 0;

void setup() {
  pinMode(13, OUTPUT);
  digitalWrite(13, HIGH);          // LED encendido: calibrando
  Serial.begin(9600);

  while (millis() < 5000) {        // 5 segundos de calibración
    int lectura = analogRead(A0);
    if (lectura > sensorHigh) sensorHigh = lectura;
    if (lectura < sensorLow)  sensorLow  = lectura;
  }
  digitalWrite(13, LOW);
  Serial.print("Min: "); Serial.print(sensorLow);
  Serial.print("  Max: "); Serial.println(sensorHigh);
}

void loop() {
  int lectura = analogRead(A0);
  int nota = map(lectura, sensorLow, sensorHigh, 50, 4000);
  tone(8, nota, 20);
  delay(10);
}`,
  layout:{ components:[
      C('photo','H10'),
      C('resistor','H14',0,{ value:10000 }),
      C('piezo','C24'),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('J10','B+10',RED), W('J12','J14',ORG), W('F18','B-18',BLK), W('G12','P:A0',ORG),
      W('A24','P:D8',BLU), W('E28','B-28',BLK),
    ] } },

/* ================= 07 · TECLADO ================= */
{ id:7, title:'Teclado musical', short:'Teclado', design:'07 Teclado',
  status:'done', date:'22 nov 2026',
  intro:'Un piano de cuatro teclas con un solo oído: los cuatro pulsadores llegan al mismo pin A0, cada uno a través de una resistencia distinta (ninguna, 220 Ω, 10 kΩ y 1 MΩ). La tensión que lee A0 delata qué dedo apretó, y el piezo toca su nota: Do, Re, Mi o Sol. Fue el proyecto más peleado: una tarde entera cazando un cable que estaba a una columna de su isla.',
  ideas:[
    'Una sola entrada puede distinguir muchas teclas si cada una llega por un camino con resistencia distinta: una escalera de tensiones. Lo que identifica a la tecla no es el cable, es la altura a la que deja el nodo.',
    'Los umbrales del código se ponen en los puntos medios de TUS mediciones reales (1023 / 1001 / 510 / 10 → cortes en 1012 / 750 / 100 / 5), no en los valores del libro. Medir primero, programar después.',
    'La protoboard conecta por islas (columnas), no por cercanía: un cable a UNA columna de distancia es un circuito abierto invisible. Cuando algo falla, mandan las mediciones del monitor serie, no las fotos.',
  ],
  parts:['4× Pulsador','Resistencia 220 Ω','Resistencia 10 kΩ','Resistencia 1 MΩ','Resistencia 10 kΩ (pull-down)','Piezo','Cables'],
  circuit:[
    { a:'+5V', via:[['button','Tecla 1']], b:'A0', note:'Directa, sin resistencia: A0 lee 1023 → Do (262 Hz).' },
    { a:'+5V', via:[['button','Tecla 2'],['res','220 Ω']], b:'A0', note:'A0 lee 1001 → Re (294 Hz).' },
    { a:'+5V', via:[['button','Tecla 3'],['res','10 kΩ']], b:'A0', note:'A0 lee ~510 → Mi (330 Hz).' },
    { a:'+5V', via:[['button','Tecla 4'],['res','1 MΩ']], b:'A0', note:'A0 lee ~10 → Sol (392 Hz).' },
    { a:'A0', via:[['res','10 kΩ']], b:'GND', note:'El pull-down ancla el nodo: sin tecla apretada, A0 lee 0.' },
    { a:'D8', via:[['piezo','Piezo']], b:'GND', note:'El pin 8 aparece solo en el código final: es la voz del teclado.' },
  ],
  code:
`void setup() {
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(A0);
  Serial.println(lectura);

  if (lectura > 1012) {
    tone(8, 262);        // Tecla 1: Do
  } else if (lectura > 750) {
    tone(8, 294);        // Tecla 2: Re
  } else if (lectura > 100) {
    tone(8, 330);        // Tecla 3: Mi
  } else if (lectura > 5) {
    tone(8, 392);        // Tecla 4: Sol
  } else {
    noTone(8);
  }
  delay(50);
}`,
  layout:{ components:[
      C('button','E4'),  C('button','E12'), C('button','E20'), C('button','E28'),
      C('resistor','G15',0,{ value:220 }),
      C('resistor','G23',0,{ value:10000 }),
      C('resistor','G31',0,{ value:1000000 }),
      C('resistor','F44',0,{ value:10000 }),
      C('piezo','C40'),
    ], wires:[
      W('P:5V','B+20',RED), W('P:GND','B-21',BLK), W('B-29','B-42',BLK),
      W('J4','B+4',GRN),   W('G7','G44',GRN),
      W('J12','B+12',YEL), W('H19','G44',YEL),
      W('J20','B+20',ORG), W('H27','G44',ORG),
      W('J28','B+28',RED), W('H35','G44',RED),
      W('H44','P:A0',GRN), W('J48','B-48',BLK),
      W('A40','P:D8',BLU), W('E44','B-44',BLK),
    ] } },
);

EXERCISES.push(
/* ================= 08 · RELOJ DE ARENA ================= */
{ id:8, title:'Reloj de arena digital', short:'Reloj de arena', design:'08 Reloj de arena',
  status:'planned', date:null,
  intro:'Seis LED que se van encendiendo uno a uno a medida que pasa el tiempo, como la arena que cae. Al «girar el reloj» — el sensor de inclinación lo detecta — todos se apagan y la cuenta empieza de nuevo. El primer proyecto donde el tiempo manda sin detener el programa.',
  ideas:[
    'millis() es mirar el reloj de pared; delay() es echarse una siesta. Con millis() el programa sigue atento (al sensor, a los botones) mientras el tiempo pasa: nada de dormir.',
    'El estado también es un dato: una variable que recuerda qué LED toca ahora y cuándo se encendió el último. Los programas con memoria de lo que pasó se comportan como relojes, no como interruptores.',
    'El sensor de inclinación es un interruptor que obedece a la gravedad: una bolita que cierra el contacto al volcar. Detectar un gesto físico es convertirlo en un flanco (el cambio de 0 a 1), no en un nivel.',
  ],
  parts:['6× LED verde','6× Resistencia 220 Ω','Sensor de inclinación','Resistencia 10 kΩ','Cables'],
  circuit:[
    { a:'D2', via:[['led','LED 1'],['res','220 Ω']], b:'GND' },
    { a:'D3', via:[['led','LED 2'],['res','220 Ω']], b:'GND' },
    { a:'D4', via:[['led','LED 3'],['res','220 Ω']], b:'GND' },
    { a:'D5', via:[['led','LED 4'],['res','220 Ω']], b:'GND' },
    { a:'D6', via:[['led','LED 5'],['res','220 Ω']], b:'GND' },
    { a:'D7', via:[['led','LED 6'],['res','220 Ω']], b:'GND' },
    { a:'+5V', via:[['tilt','Inclinación']], b:'D8' },
    { a:'D8', via:[['res','10 kΩ']], b:'GND', note:'Al girar el reloj el sensor cierra, D8 lee HIGH y el código apaga todo y reinicia.' },
  ],
  code:
`const int switchPin = 8;
unsigned long tiempoAnterior = 0;
int ledEnCurso = 2;
int estadoAnterior = 0;

void setup() {
  for (int x = 2; x < 8; x++) pinMode(x, OUTPUT);
  pinMode(switchPin, INPUT);
}

void loop() {
  unsigned long ahora = millis();
  // En el libro el intervalo es de 10 minutos por LED;
  // en Tinkercad usaremos 2 segundos para verlo funcionar.
  if (ahora - tiempoAnterior > 2000) {
    tiempoAnterior = ahora;
    digitalWrite(ledEnCurso, HIGH);
    ledEnCurso++;
  }
  int estado = digitalRead(switchPin);
  if (estado != estadoAnterior && estado == HIGH) {
    // ¡Han girado el reloj! A empezar de cero.
    for (int x = 2; x < 8; x++) digitalWrite(x, LOW);
    ledEnCurso = 2;
    tiempoAnterior = ahora;
  }
  estadoAnterior = estado;
}`,
  layout:{ components:[
      C('led','C8',0,{ color:'#2a9e4f' }),  C('resistor','E8',1,{ value:220 }),
      C('led','C14',0,{ color:'#2a9e4f' }), C('resistor','E14',1,{ value:220 }),
      C('led','C20',0,{ color:'#2a9e4f' }), C('resistor','E20',1,{ value:220 }),
      C('led','C26',0,{ color:'#2a9e4f' }), C('resistor','E26',1,{ value:220 }),
      C('led','C32',0,{ color:'#2a9e4f' }), C('resistor','E32',1,{ value:220 }),
      C('led','C38',0,{ color:'#2a9e4f' }), C('resistor','E38',1,{ value:220 }),
      C('tilt','H44'), C('resistor','F46',0,{ value:10000 }),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('B+28','B+44',RED), W('B-29','B-48',BLK),
      W('A9','P:D2',GRN),  W('F8','B-8',BLK),
      W('A15','P:D3',ORG), W('F14','B-14',BLK),
      W('A21','P:D4',YEL), W('F20','B-20',BLK),
      W('A27','P:D5',BLU), W('F26','B-26',BLK),
      W('A33','P:D6',PUR), W('F32','B-32',BLK),
      W('A39','P:D7',RED), W('F38','B-38',BLK),
      W('J44','B+44',RED), W('J50','B-50',BLK), W('G46','P:D8',PUR),
    ] } },

/* ================= 09 · MOLINETE ================= */
{ id:9, title:'Molinete motorizado', short:'Molinete', design:'09 Molinete',
  status:'planned', date:null,
  intro:'Un motor de verdad gobernado por el potenciómetro: al girar el mando, el molinete acelera o frena. Entre el Arduino y el motor aparece el personaje nuevo del kit: el transistor, porque un pin no puede alimentar a un motor hambriento.',
  ideas:[
    'El transistor es un grifo con mano pequeña: una señal débil en la puerta (G) gobierna una corriente grande entre D y S. El Arduino ordena; la batería paga. Es la respuesta a la lección del proyecto 06: la LDR dejaba pasar poca corriente; el motor necesita músculo.',
    'Nunca se alimenta un motor desde un pin: el pin da 40 mA y el motor pide cientos. Cada actuador tiene su apetito y su fuente.',
    'Al parar, el motor devuelve una patada de tensión (su bobina se niega a quedarse sin corriente). El diodo en paralelo es la vía de escape que protege al transistor de esa patada.',
  ],
  parts:['Motor DC','Transistor MOSFET IRF520','Potenciómetro 10 kΩ','Batería 9V','Diodo 1N4007','Cables'],
  circuit:[
    { a:'A0', via:[['pot','Potenciómetro']], b:'+5V', note:'El mando regula la señal que llegará a la puerta del transistor.' },
    { a:'D9', via:[['transistor','MOSFET · puerta G']], b:'GND', note:'El pin 9 no mueve el motor: mueve la puerta que deja pasar la corriente grande (PWM = velocidad).' },
    { a:'+9V', via:[['motor','Motor DC'],['transistor','MOSFET · D–S']], b:'GND', note:'Circuito de potencia: 9V → motor → transistor → masa. El diodo va en paralelo al motor, contra su patada.' },
  ],
  code:
`const int potPin = A0;
const int motorPin = 9;   // a la PUERTA del transistor, no al motor

void setup() {
  pinMode(motorPin, OUTPUT);
}

void loop() {
  int lectura = analogRead(potPin);
  int velocidad = map(lectura, 0, 1023, 0, 255);
  analogWrite(motorPin, velocidad);
}`,
  layout:{ components:[
      C('pot','H8',0,{ value:10000 }),
      C('transistor','C20'),
      C('motor','C30'),
      C('battery','H30'),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('J8','B+8',RED), W('J10','B-10',BLK), W('F9','P:A0',ORG),
      W('A20','P:D9',PUR),
      W('F30','A30',RED), W('E32','E21',PUR), W('A22','J32',BLK),
    ] } },

/* ================= 10 · ZOÓTROPO ================= */
{ id:10, title:'Zoótropo', short:'Zoótropo', design:'10 Zootropo',
  status:'planned', date:null,
  intro:'El molinete crece: ahora el motor puede girar en los dos sentidos y cambiar de dirección con un botón, gracias al puente H. Con una tira de dibujos, el giro se convierte en cine primitivo: un zoótropo.',
  ideas:[
    'El puente H cruza la polaridad: con dos interruptores en diagonal la corriente atraviesa el motor al derecho, y con los otros dos, al revés. Invertir el giro es invertir el camino de la corriente.',
    'Velocidad y dirección son dos mandos independientes: el PWM regula cuánto (enable) y las entradas IN1/IN2 deciden hacia dónde.',
    'Un botón que «cambia de estado» no se lee por nivel sino por flanco: importa el instante de apretar, no el rato apretado. Si no, la dirección bailaría cien veces por segundo.',
  ],
  parts:['Puente H L293D','Motor DC','Potenciómetro 10 kΩ','Pulsador','Resistencia 10 kΩ','Batería 9V','Cables'],
  circuit:[
    { a:'A0', via:[['pot','Potenciómetro']], b:'+5V', note:'El mando fija la velocidad.' },
    { a:'D9', via:[['hbridge','L293D · enable']], b:'+9V', note:'PWM al enable: cuánto empuja el puente.' },
    { a:'D3', via:[['hbridge','L293D · IN1 / IN2']], b:'D4', note:'IN1 e IN2 siempre al contrario: una pareja ordena el sentido de la corriente por el motor.' },
    { a:'+5V', via:[['button','Botón de sentido']], b:'D2' },
    { a:'D2', via:[['res','10 kΩ']], b:'GND', note:'El pull-down de siempre.' },
  ],
  code:
`const int enablePin = 9;   // PWM: velocidad
const int in1Pin = 3;      // dirección
const int in2Pin = 4;      // dirección
const int botonPin = 2;    // cambia el sentido
const int potPin = A0;

int direccion = 1;
int estadoAnterior = 0;

void setup() {
  pinMode(enablePin, OUTPUT);
  pinMode(in1Pin, OUTPUT);
  pinMode(in2Pin, OUTPUT);
  pinMode(botonPin, INPUT);
}

void loop() {
  int velocidad = map(analogRead(potPin), 0, 1023, 0, 255);
  analogWrite(enablePin, velocidad);

  int estado = digitalRead(botonPin);
  if (estado == HIGH && estadoAnterior == LOW) direccion = -direccion;
  estadoAnterior = estado;

  if (direccion == 1) { digitalWrite(in1Pin, HIGH); digitalWrite(in2Pin, LOW); }
  else                { digitalWrite(in1Pin, LOW);  digitalWrite(in2Pin, HIGH); }
}`,
  layout:{ components:[
      C('pot','H8',0,{ value:10000 }),
      C('hbridge','E18'),
      C('button','E28'), C('resistor','H33',0,{ value:10000 }),
      C('motor','C34'),
      C('battery','H44'),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK), W('B-29','B-46',BLK),
      W('J8','B+8',RED), W('J10','B-10',BLK), W('F9','P:A0',ORG),
      W('F44','A18',RED), W('J46','B-46',BLK), W('J21','B-21',BLK),
      W('A19','P:D9',PUR), W('A20','P:D3',YEL), W('A21','P:D4',GRN),
      W('G19','A34',ORG), W('G20','A36',GRY),
      W('J28','B+28',RED), W('G31','P:D2',BLU), W('J31','J33',BLU), W('F37','B-37',BLK),
    ] } },

/* ================= 11 · BOLA DE CRISTAL ================= */
{ id:11, title:'Bola de cristal', short:'Bola de cristal', design:'11 Bola de cristal',
  status:'planned', date:null,
  intro:'Una bola mágica con pantalla: agitas el circuito (el sensor de inclinación lo nota) y la LCD 16×2 responde con una frase al azar de su repertorio. Es la llegada de las pantallas: el Arduino ya no solo enciende luces, escribe texto.',
  ideas:[
    'La LCD no recibe letras: recibe órdenes por 6 cables de señal que la biblioteca LiquidCrystal traduce. Otra vez la lección del servo: la biblioteca conoce el idioma; tú solo escribes el texto.',
    'random() necesita una semilla imprevisible o repetirá la misma «suerte» en cada encendido: se siembra leyendo un pin al aire, que siempre baila un poco.',
    'Las respuestas viven en una lista (un array de textos) y el azar elige el índice: datos y código se separan — para cambiar las frases no hay que tocar la lógica.',
  ],
  parts:['Pantalla LCD 16×2','Sensor de inclinación','Resistencia 10 kΩ','Potenciómetro (contraste)','Cables'],
  circuit:[
    { a:'D12', via:[['lcd','LCD 16×2']], b:'GND', note:'Seis señales (RS, E, D4–D7) más alimentación: la biblioteca LiquidCrystal habla con la pantalla por ellas.' },
    { a:'+5V', via:[['tilt','Inclinación']], b:'D6' },
    { a:'D6', via:[['res','10 kΩ']], b:'GND', note:'Agitar la bola = cerrar el sensor: D6 lee HIGH y la bola responde.' },
  ],
  code:
`#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
const int switchPin = 6;

const char* respuestas[8] = {
  "Si", "Seguro que si", "Sin duda",
  "Pregunta otra vez", "No lo veo claro",
  "Mejor no", "No", "Ni lo suenes"
};

void setup() {
  lcd.begin(16, 2);
  pinMode(switchPin, INPUT);
  randomSeed(analogRead(A5));   // semilla: un pin al aire
  lcd.print("La bola de cristal");
  lcd.setCursor(0, 1);
  lcd.print("esta lista");
}

void loop() {
  if (digitalRead(switchPin) == HIGH) {
    int r = random(8);
    lcd.clear();
    lcd.print("La bola dice:");
    lcd.setCursor(0, 1);
    lcd.print(respuestas[r]);
    delay(600);
  }
}`,
  layout:{ components:[
      C('lcd','A8'),
      C('tilt','H24'), C('resistor','H28',0,{ value:10000 }),
    ], wires:[
      W('P:5V','B+14',RED), W('P:GND','B-14',BLK), W('B-29','B-33',BLK),
      W('C8','P:D12',PUR), W('C9','P:D11',BLU), W('C10','P:D5',GRN),
      W('C11','P:D4',YEL), W('C12','P:D3',ORG), W('C13','P:D2',RED),
      W('J24','B+24',RED), W('J26','J28',ORG), W('F32','B-32',BLK), W('G26','P:D6',ORG),
    ] } },
);

EXERCISES.push(
/* ================= 12 · CANDADO CON GOLPES ================= */
{ id:12, title:'Candado que se abre con golpes', short:'Candado con golpes', design:'12 Candado',
  status:'planned', date:null,
  intro:'Una caja fuerte con contraseña rítmica: el servo hace de cerrojo y el piezo escucha los golpes en la puerta. Tres golpes con la fuerza suficiente y el cerrojo se abre. En Tinkercad los golpes se simulan con un pulsador, porque el simulador no sabe dar golpes; con el kit real se golpea de verdad.',
  ideas:[
    'El piezo es reversible: con electricidad vibra (proyecto 06) y con vibración produce electricidad. El mismo cristal es altavoz y micrófono; el circuito decide en qué dirección se usa.',
    'Reconocer un patrón no es medir un valor: es contar eventos que superan un umbral dentro de una lógica de estados (abierto/cerrado, cuántos golpes llevo). Por debajo del umbral, todo es ruido y se ignora.',
    'La resistencia de 1 MΩ junto al piezo es su «vía de descarga»: sin ella, la carga de un golpe se quedaría flotando y todos los golpes parecerían uno solo.',
  ],
  parts:['Piezo','Servo','Pulsador','3× LED (verde, amarillo, rojo)','3× Resistencia 220 Ω','Resistencia 1 MΩ','Resistencia 10 kΩ','Cables'],
  circuit:[
    { a:'A0', via:[['piezo','Piezo · escucha'],['res','1 MΩ']], b:'GND', note:'Cada golpe genera un pico de tensión que A0 caza si supera el umbral.' },
    { a:'D9', via:[['servo','Servo · cerrojo']], b:'GND', note:'0° = abierto, 90° = cerrado: el servo es la llave.' },
    { a:'+5V', via:[['button','Botón de cierre']], b:'D2' },
    { a:'D2', via:[['res','10 kΩ']], b:'GND' },
    { a:'D3', via:[['led','LED verde'],['res','220 Ω']], b:'GND', note:'Verde: abierto.' },
    { a:'D4', via:[['led','LED amarillo'],['res','220 Ω']], b:'GND', note:'Amarillo: golpe escuchado.' },
    { a:'D5', via:[['led','LED rojo'],['res','220 Ω']], b:'GND', note:'Rojo: cerrado.' },
  ],
  code:
`#include <Servo.h>

Servo cerrojo;
const int piezoPin = A0;
const int botonPin = 2;
const int ledVerde = 3, ledAmarillo = 4, ledRojo = 5;

bool cerrado = false;
int golpes = 0;
const int golpeMin = 100;   // umbral: por debajo es ruido

void setup() {
  cerrojo.attach(9);
  pinMode(botonPin, INPUT);
  pinMode(ledVerde, OUTPUT);
  pinMode(ledAmarillo, OUTPUT);
  pinMode(ledRojo, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (!cerrado && digitalRead(botonPin) == HIGH) {
    cerrado = true; golpes = 0;
    cerrojo.write(90);                       // cierra
    digitalWrite(ledRojo, HIGH);
    digitalWrite(ledVerde, LOW);
    delay(300);
  }
  if (cerrado) {
    int v = analogRead(piezoPin);
    if (v > golpeMin) {
      golpes++;
      digitalWrite(ledAmarillo, HIGH);
      delay(120);
      digitalWrite(ledAmarillo, LOW);
      Serial.print("Golpe "); Serial.println(golpes);
      if (golpes >= 3) {                     // la contraseña: 3 golpes
        cerrado = false;
        cerrojo.write(0);                    // abre
        digitalWrite(ledRojo, LOW);
        digitalWrite(ledVerde, HIGH);
      }
    }
  }
}`,
  layout:{ components:[
      C('piezo','C10'), C('resistor','B10',0,{ value:1000000 }),
      C('servo','H24'),
      C('led','C30',0,{ color:'#2a9e4f' }), C('resistor','E30',1,{ value:220 }),
      C('led','C36',0,{ color:'#f5d90a' }), C('resistor','E36',1,{ value:220 }),
      C('led','C42',0,{ color:'#d92b2b' }), C('resistor','E42',1,{ value:220 }),
      C('button','E48'), C('resistor','H53',0,{ value:10000 }),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('B+28','B+46',RED), W('B-29','B-52',BLK),
      W('A10','P:A0',ORG), W('E14','B-14',BLK),
      W('F24','P:D9',ORG), W('J25','B+25',RED), W('J26','B-26',BLK),
      W('A31','P:D3',GRN), W('F30','B-30',BLK),
      W('A37','P:D4',YEL), W('F36','B-36',BLK),
      W('A43','P:D5',RED), W('F42','B-42',BLK),
      W('J48','B+48',RED), W('G51','P:D2',BLU), W('J51','J53',BLU), W('F57','B-57',BLK),
    ] } },

/* ================= 13 · LÁMPARA TÁCTIL ================= */
{ id:13, title:'Lámpara que se enciende al tocarla', short:'Lámpara táctil', design:'13 Lampara tactil',
  status:'planned', date:null,
  intro:'Una lámpara sin interruptor: tocas una lámina metálica y se enciende. El truco no es un sensor comprado: es tu propio cuerpo, que funciona como una placa de condensador. Este proyecto NO se puede simular en Tinkercad (no hay dedos virtuales): se estudia el concepto y se monta con el kit real cuando llegue.',
  ideas:[
    'Tu cuerpo conduce y almacena carga: al tocar la lámina, la capacidad del circuito crece y tardar en cargarse a través de 1 MΩ se hace medible. El sensor es el hueco que tu dedo rellena.',
    'Medir tiempos minúsculos es otra forma de medir el mundo: la biblioteca CapacitiveSensor no lee una tensión, cronometra una carga. Cuando una magnitud no se deja medir directa, se mide su efecto en el tiempo.',
    'Hay fenómenos que el simulador no tiene: saber qué NO se puede simular (el tacto, los golpes reales) forma parte de conocer la herramienta.',
  ],
  parts:['Lámina metálica (papel de aluminio)','Resistencia 1 MΩ','LED','Resistencia 220 Ω','Cables'],
  circuit:[
    { a:'D2', via:[['res','1 MΩ'],['foil','Lámina táctil']], b:'D4', note:'D2 envía y D4 recibe a través de 1 MΩ; el dedo sobre la lámina cambia el tiempo de carga.' },
    { a:'D9', via:[['led','LED'],['res','220 Ω']], b:'GND', note:'La lámpara: se enciende mientras el dedo está presente.' },
  ],
  code:
`#include <CapacitiveSensor.h>

// Envia por D2, recibe por D4, con 1 MOhm entre ambos
CapacitiveSensor sensor = CapacitiveSensor(2, 4);
const int ledPin = 9;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  long valor = sensor.capacitiveSensor(30);
  Serial.println(valor);
  if (valor > 1000) digitalWrite(ledPin, HIGH);  // dedo presente
  else digitalWrite(ledPin, LOW);
  delay(50);
}`,
  layout:{ components:[
      C('foil','H10'), C('resistor','H12',0,{ value:1000000 }),
      C('led','C24',0,{ color:'#f5d90a' }), C('resistor','E24',1,{ value:220 }),
    ], wires:[
      W('P:5V','B+14',RED), W('P:GND','B-14',BLK),
      W('J10','J12',PUR), W('G16','P:D2',PUR), W('G10','P:D4',ORG),
      W('A25','P:D9',GRN), W('F24','B-24',BLK),
    ] } },

/* ================= 14 · LOGO DE ARDUINO ================= */
{ id:14, title:'Ajusta el logo de Arduino', short:'Logo de Arduino', design:'14 Logo',
  status:'planned', date:null,
  intro:'El potenciómetro deja de mover cosas en la placa y pasa a mover cosas en la pantalla del ordenador: el valor viaja por el cable USB hasta un programa en Processing que recolorea y gira el logo de Arduino. Dos programas, uno en cada máquina, cooperando por el puerto serie. La parte de Processing se hará con el kit y el IDE reales.',
  ideas:[
    'El puerto serie es una conversación, no un tablón de anuncios: hasta ahora solo imprimíamos para mirar; aquí el Arduino ENVÍA datos que otro programa consume y obedece.',
    'Serial.write manda un byte crudo (0–255), no texto: por eso la lectura se divide entre 4. Elegir el formato del mensaje es diseñar el idioma entre dos máquinas.',
    'El mismo gesto (girar un mando) puede gobernar cualquier mundo: un servo, un motor… o un dibujo. Cambia el receptor, no el sensor.',
  ],
  parts:['Potenciómetro 10 kΩ','Cables','Ordenador con Processing'],
  circuit:[
    { a:'A0', via:[['pot','Potenciómetro']], b:'+5V', note:'El circuito es el del proyecto 05; lo nuevo está al otro lado del USB.' },
  ],
  code:
`// --- Arduino: envia el valor por el puerto serie ---
void setup() {
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(A0);
  Serial.write(lectura / 4);   // un byte (0-255) para Processing
  delay(20);
}

/* --- Processing (en el ordenador): recibe y pinta ---
import processing.serial.*;
Serial puerto;
float angulo = 0;

void setup() {
  size(600, 400);
  puerto = new Serial(this, Serial.list()[0], 9600);
}

void draw() {
  background(255);
  if (puerto.available() > 0) angulo = map(puerto.read(), 0, 255, 0, TWO_PI);
  translate(width/2, height/2);
  rotate(angulo);
  // ... aqui se dibuja el logo de Arduino ...
}
*/`,
  layout:{ components:[
      C('pot','H10',0,{ value:10000 }),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK),
      W('J10','B+10',RED), W('J12','B-12',BLK), W('F11','P:A0',ORG),
    ] } },

/* ================= 15 · HACKEAR BOTONES ================= */
{ id:15, title:'Hackear botones', short:'Hackear botones', design:'15 Hacking Buttons',
  status:'planned', date:null,
  intro:'El proyecto final del libro: el Arduino aprende a pulsar los botones de OTROS aparatos. Un optoacoplador se conecta en paralelo al botón de un mando o un juguete, y cuando tu Arduino lo ordena, el aparato cree que un dedo lo ha pulsado. La despedida del kit une todo: entrada, salida y aislamiento.',
  ideas:[
    'El optoacoplador habla con luz: dentro de la cápsula hay un LED y un transistor que se miran, sin ningún contacto eléctrico. Dos circuitos pueden cooperar sin compartir ni un electrón: aislamiento total.',
    '«Pulsar» un botón ajeno es cerrar su circuito desde fuera: no hace falta entender todo el aparato, solo encontrar los dos lados de su interruptor.',
    'El patrón de todo el kit se repite una última vez: tu pulsador (entrada) → tu código (decisión) → el opto (salida). Cambian los actores; la anatomía — ojos, cerebro, mano — es la misma del proyecto 01.',
  ],
  parts:['Optoacoplador 4N35','Pulsador','Resistencia 220 Ω','Resistencia 10 kΩ','Un aparato con botón (mando, juguete…)','Cables'],
  circuit:[
    { a:'D9', via:[['res','220 Ω'],['opto','Opto · LED interno']], b:'GND', note:'Al encender el LED interno del optoacoplador…' },
    { a:'OPTO', via:[['button','Botón del aparato']], b:'APARATO', note:'…su transistor, al otro lado y sin contacto eléctrico, cierra el botón del aparato: este «cree» que lo han pulsado.' },
    { a:'+5V', via:[['button','Tu pulsador']], b:'D2' },
    { a:'D2', via:[['res','10 kΩ']], b:'GND' },
  ],
  code:
`const int botonPin = 2;
const int optoPin = 9;

void setup() {
  pinMode(botonPin, INPUT);
  pinMode(optoPin, OUTPUT);
}

void loop() {
  if (digitalRead(botonPin) == HIGH) {
    digitalWrite(optoPin, HIGH);  // el opto "pulsa" el boton del aparato
    delay(300);
    digitalWrite(optoPin, LOW);
    delay(300);
  }
}`,
  layout:{ components:[
      C('opto','E14'),
      C('button','E26'), C('resistor','H31',0,{ value:10000 }),
      C('resistor','A15',0,{ value:220 }),
      C('button','E40'),
    ], wires:[
      W('P:5V','B+12',RED), W('P:GND','B-12',BLK), W('B-29','B-36',BLK),
      W('A14','P:D9',ORG), W('E19','B-19',BLK),
      W('J26','B+26',RED), W('G29','P:D2',GRN), W('J29','J31',GRN), W('F35','B-35',BLK),
      W('H14','H40',GRY), W('H15','H43',GRY),
    ] } },
);

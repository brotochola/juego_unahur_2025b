function radianesAGrados(radianes) {
  return radianes * (180 / Math.PI);
}

function calcularDistancia(obj1, obj2) {
  return Math.sqrt((obj2.x - obj1.x) ** 2 + (obj2.y - obj1.y) ** 2);
}

function calcularDistanciaCuadrada(obj1, obj2) {
  return (obj2.x - obj1.x) ** 2 + (obj2.y - obj1.y) ** 2;
}

function calcularDistanciaCuadrada3D(obj1, obj2) {
  return (
    (obj2.x - obj1.x) ** 2 + (obj2.y - obj1.y) ** 2 + (obj2.z - obj1.z) ** 2
  );
}

/**
 * Remueve un elemento de un array usando el patrón swap-and-pop para O(1) performance.
 * Este método es mucho más eficiente que splice() o filter() porque:
 * - No necesita mover todos los elementos posteriores (splice es O(n))
 * - No crea un nuevo array (filter es O(n) + allocación)
 * - Solo hace 2 operaciones: swap + pop = O(1)
 *
 * NOTA: Este método NO preserva el orden del array.
 *
 * @param {Array} array - El array del cual remover el elemento
 * @param {*|number} itemOIndice - El item a remover o su índice
 * @param {boolean} esIndice - Si true, itemOIndice es un índice; si false, es el item
 * @returns {boolean} true si se removió exitosamente, false si no se encontró
 *
 * @example
 * // Remover por item
 * const arr = [1, 2, 3, 4, 5];
 * removerDeArrayConSwapAndPop(arr, 3); // arr = [1, 2, 5, 4]
 *
 * @example
 * // Remover por índice (más rápido si ya tienes el índice)
 * const arr = [1, 2, 3, 4, 5];
 * removerDeArrayConSwapAndPop(arr, 2, true); // arr = [1, 2, 5, 4]
 */
function removerDeArrayConSwapAndPop(array, itemOIndice, esIndice = false) {
  if (!array || array.length === 0) return false;

  let index;

  if (esIndice) {
    index = itemOIndice;
    // Validar que el índice esté en rango
    if (index < 0 || index >= array.length) return false;
  } else {
    // Buscar el item
    index = array.indexOf(itemOIndice);
    if (index === -1) return false;
  }

  // Swap con el último elemento (si no es ya el último)
  const lastIndex = array.length - 1;
  if (index !== lastIndex) {
    array[index] = array[lastIndex];
  }

  // Remover el último elemento
  array.pop();
  return true;
}
function limitarVector(vector, magnitudMaxima = 1) {
  const magnitudActual = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

  if (magnitudActual > magnitudMaxima) {
    const escala = magnitudMaxima / magnitudActual;
    return {
      x: vector.x * escala,
      y: vector.y * escala,
    };
  }

  // Si ya está dentro del límite, se devuelve igual
  return { ...vector };
}

// Cache para texturas negras para evitar recrearlas
const texturaNegrCache = new Map();

function crearSpriteNegro(anchoDelMapa, altoDelMapa) {
  // Verificar si ya tenemos esta textura en cache
  const cacheKey = `negro_${anchoDelMapa}x${altoDelMapa}`;
  let textura = texturaNegrCache.get(cacheKey);

  if (!textura) {
    // Crear un canvas negro del tamaño del mapa solo si no existe en cache
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = anchoDelMapa;
    canvas.height = altoDelMapa;

    // Llenar todo el canvas de negro
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crear textura PIXI a partir del canvas y guardarla en cache
    textura = PIXI.Texture.from(canvas);
    texturaNegrCache.set(cacheKey, textura);
  }

  // Crear sprite usando la textura (reutilizada o nueva)
  const sprite = new PIXI.Sprite(textura);

  // Posicionar el sprite en el origen del mapa
  sprite.x = 0;
  sprite.y = 0;

  return sprite;
}

// Cache para texturas de gradientes para evitar recrearlas
const texturaGradienteCache = new Map();

function crearSpriteConGradiente(radio = 300, color = 0xffffff) {
  // Verificar si ya tenemos esta textura en cache
  radio = Math.round(radio);
  const cacheKey = `gradiente_${radio}_${color}`;
  let textura = texturaGradienteCache.get(cacheKey);

  if (!textura) {
    // Crear un canvas para el gradiente individual solo si no existe en cache
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = radio * 2;
    canvas.width = size;
    canvas.height = size;

    // Crear gradiente radial centrado
    const gradient = ctx.createRadialGradient(
      radio,
      radio,
      0, // círculo interior (centro)
      radio,
      radio,
      radio // círculo exterior
    );

    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;

    const cantStops = 10;
    for (let i = 1; i <= cantStops; i++) {
      const value = 2 ** (1 - i);
      gradient.addColorStop(
        i / cantStops,
        "rgba(" + r + "," + g + "," + b + "," + value + ")"
      ); // Centro blanco (sin oscuridad)
    }
    // Configurar paradas del gradiente

    // Llenar todo el canvas de negro primero
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, size, size);

    // Dibujar el círculo con gradiente
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(radio, radio, radio, 0, Math.PI * 2);
    ctx.fill();

    // Crear textura PIXI a partir del canvas y guardarla en cache
    textura = PIXI.Texture.from(canvas);
    texturaGradienteCache.set(cacheKey, textura);
  }

  // Crear sprite usando la textura (reutilizada o nueva)
  const sprite = new PIXI.Sprite(textura);

  // Centrar el anchor para que el gradiente se centre en la posición del farol
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.y = 0.5;

  return sprite;
}

// Cache para texturas de círculos para evitar recrearlas
const texturaCirculoCache = new Map();

function crearCirculo(radio, color) {
  // Verificar si ya tenemos esta textura en cache
  const cacheKey = `circulo_${radio}_${color}`;
  let textura = texturaCirculoCache.get(cacheKey);

  if (!textura) {
    // Crear un canvas para el círculo solo si no existe en cache
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = radio * 2;
    canvas.width = size;
    canvas.height = size;

    // Llenar el canvas de transparente
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, size, size);

    // Dibujar el círculo con el color especificado
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(radio, radio, radio, 0, Math.PI * 2);
    ctx.fill();

    // Crear textura PIXI a partir del canvas y guardarla en cache
    textura = PIXI.Texture.from(canvas);
    texturaCirculoCache.set(cacheKey, textura);
  }

  return textura;
}

function isometricToCartesian(pos) {
  return {
    x: pos.x / 2 + pos.y,
    y: pos.y - pos.x / 2,
  };
}

function convertirCantidadDeMinutosDelDiaAStringDeHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = Math.floor(minutos % 60);
  return `${horas.toString().padStart(2, "0")}:${minutosRestantes
    .toString()
    .padStart(2, "0")}`;
}

function mapColors(color2, color1, mix) {
  const r1 = (color1 >> 16) & 255;
  const g1 = (color1 >> 8) & 255;
  const b1 = color1 & 255;
  const r2 = (color2 >> 16) & 255;
  const g2 = (color2 >> 8) & 255;
  const b2 = color2 & 255;
  const r = Math.round(r1 * mix + r2 * (1 - mix));
  const g = Math.round(g1 * mix + g2 * (1 - mix));
  const b = Math.round(b1 * mix + b2 * (1 - mix));
  return (r << 16) | (g << 8) | b;
}

function colorToHexString(color) {
  // Convierte un número hexadecimal (ej: 0xff0000) a string hexadecimal (ej: "#ff0000")
  return "#" + color.toString(16).padStart(6, "0");
}

function generateName() {
  const englishFirstNames = [
    "James",
    "John",
    "Robert",
    "Michael",
    "William",
    "David",
    "Richard",
    "Joseph",
    "Thomas",
    "Christopher",
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
    "Emma",
    "Olivia",
    "Ava",
    "Isabella",
    "Sophia",
    "Mia",
    "Charlotte",
    "Amelia",
    "Harper",
    "Evelyn",
    "Alexander",
    "Benjamin",
    "Lucas",
    "Henry",
    "Mason",
    "Ethan",
    "Noah",
    "Logan",
    "Sebastian",
    "Jack",
  ];

  const spanishFirstNames = [
    "José",
    "Antonio",
    "Manuel",
    "Francisco",
    "David",
    "Juan",
    "Javier",
    "Daniel",
    "Carlos",
    "Miguel",
    "María",
    "Carmen",
    "Josefa",
    "Isabel",
    "Ana",
    "Dolores",
    "Pilar",
    "Teresa",
    "Rosa",
    "Francisca",
    "Alejandro",
    "Diego",
    "Pablo",
    "Álvaro",
    "Adrián",
    "Gonzalo",
    "Fernando",
    "Eduardo",
    "Sergio",
    "Raúl",
    "Sofía",
    "Martina",
    "Lucía",
    "Valeria",
    "Paula",
    "Emma",
    "Daniela",
    "Carla",
    "Sara",
    "Jimena",
  ];

  const englishSurnames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Wilson",
    "Anderson",
    "Taylor",
    "Thomas",
    "Hernandez",
    "Moore",
    "Martin",
    "Jackson",
    "Thompson",
    "White",
    "Lopez",
    "Lee",
    "Gonzalez",
    "Harris",
    "Clark",
    "Lewis",
    "Robinson",
    "Walker",
    "Perez",
    "Hall",
    "Young",
    "Allen",
    "Sanchez",
    "Wright",
    "King",
    "Scott",
    "Green",
    "Baker",
    "Adams",
    "Nelson",
  ];

  const spanishSurnames = [
    "García",
    "González",
    "Rodríguez",
    "Fernández",
    "López",
    "Martínez",
    "Sánchez",
    "Pérez",
    "Gómez",
    "Martín",
    "Jiménez",
    "Ruiz",
    "Hernández",
    "Díaz",
    "Moreno",
    "Muñoz",
    "Álvarez",
    "Romero",
    "Alonso",
    "Gutiérrez",
    "Navarro",
    "Torres",
    "Domínguez",
    "Vázquez",
    "Ramos",
    "Gil",
    "Ramírez",
    "Serrano",
    "Blanco",
    "Suárez",
    "Molina",
    "Morales",
    "Ortega",
    "Delgado",
    "Castro",
    "Ortiz",
    "Rubio",
    "Marín",
    "Sanz",
    "Iglesias",
  ];

  const italianSurnames = [
    "Rossi",
    "Ferrari",
    "Russo",
    "Bianchi",
    "Romano",
    "Gallo",
    "Costa",
    "Fontana",
    "Conti",
    "Esposito",
    "Ricci",
    "Bruno",
    "Rizzo",
    "Moretti",
    "Marino",
    "Greco",
    "Ferrara",
    "Caruso",
    "Galli",
    "Ferrara",
    "Leone",
    "Longo",
    "Mancini",
    "Mazza",
    "Rinaldi",
    "Testa",
    "Grasso",
    "Pellegrini",
    "Ferraro",
    "Galli",
    "Bellini",
    "Basile",
    "Rizzo",
    "Vitale",
    "Parisi",
    "Ferrara",
    "Serra",
    "Valentini",
    "D'Angelo",
    "Marchetti",
  ];

  const portugueseSurnames = [
    "Silva",
    "Santos",
    "Oliveira",
    "Sousa",
    "Rodrigues",
    "Ferreira",
    "Alves",
    "Pereira",
    "Costa",
    "Martins",
    "Carvalho",
    "Fernandes",
    "Lopes",
    "Gomes",
    "Mendes",
    "Nunes",
    "Ribeiro",
    "Antunes",
    "Correia",
    "Dias",
    "Teixeira",
    "Monteiro",
    "Moreira",
    "Cardoso",
    "Soares",
    "Melo",
    "Pinto",
    "Fonseca",
    "Machado",
    "Araújo",
    "Barbosa",
    "Tavares",
    "Coelho",
    "Cruz",
    "Cunha",
    "Freitas",
    "Lima",
    "Mota",
    "Neves",
    "Rocha",
  ];

  // Randomly select from all available names and surnames
  const allFirstNames = [...englishFirstNames, ...spanishFirstNames];
  const allSurnames = [
    ...englishSurnames,
    ...spanishSurnames,
    ...italianSurnames,
    ...portugueseSurnames,
  ];

  const firstName =
    allFirstNames[Math.floor(Math.random() * allFirstNames.length)];
  const surname = allSurnames[Math.floor(Math.random() * allSurnames.length)];

  return `${firstName} ${surname}`;
}

function laDistanciaEntreDosObjetosEsMenorQue(obj1, obj2, distanciaMaxima) {
  if (Juego.CONFIG.comparar_distancias_cuadradas) {
    const distanciaCuadrada = calcularDistanciaCuadrada(obj1, obj2);
    return distanciaCuadrada < distanciaMaxima * distanciaMaxima;
  } else {
    const distancia = calcularDistancia(obj1, obj2);
    return distancia < distanciaMaxima;
  }
}

function laDistanciaEntreDosObjetosEsMayorQue(obj1, obj2, distanciaMinima) {
  if (Juego.CONFIG.comparar_distancias_cuadradas) {
    const distanciaCuadrada = calcularDistanciaCuadrada(obj1, obj2);
    return distanciaCuadrada > distanciaMinima * distanciaMinima;
  } else {
    const distancia = calcularDistancia(obj1, obj2);
    return distancia > distanciaMinima;
  }
}

function laDistanciaEntreDosObjetosEstaEntreDosDistancias(
  obj1,
  obj2,
  distanciaMinima,
  distanciaMaxima
) {
  if (Juego.CONFIG.comparar_distancias_cuadradas) {
    const distanciaCuadrada = calcularDistanciaCuadrada(obj1, obj2);
    return (
      distanciaCuadrada > distanciaMinima * distanciaMinima &&
      distanciaCuadrada < distanciaMaxima * distanciaMaxima
    );
  } else {
    const distancia = calcularDistancia(obj1, obj2);
    return distancia > distanciaMinima && distancia < distanciaMaxima;
  }
}

function calcularFactorDeReduccionSegunCantidadDeFrames(cantidadDeFrames) {
  return (cantidadDeFrames - 3) / cantidadDeFrames;
}

function obtenerHashDePosicion(x, y) {
  return "x_" + x + "_y_" + y;
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
function calculateProjectileVelocity(
  start,
  target,
  gravity = Juego.CONFIG.gravedad.z,
  angle = Math.PI / 4
) {
  // Diferencias de posición
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dz = (target.z || 0) - (start.z || 0);

  // Distancia horizontal en el plano XY (Z es vertical ahora)
  const horizontalDist = Math.sqrt(dx * dx + dy * dy);

  // Ángulo horizontal (dirección en el plano XY)
  const horizontalAngle = Math.atan2(dy, dx);

  // Calcular velocidad inicial usando la ecuación balística
  // v² = g * d² / (2 * cos²(θ) * (d * tan(θ) - h))
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tan = Math.tan(angle);

  const denominator = 2 * cos * cos * (horizontalDist * tan - dz);

  if (denominator <= 0) {
    console.warn("No hay solución con este ángulo");
    return null;
  }

  const v0_squared = (gravity * horizontalDist * horizontalDist) / denominator;

  if (v0_squared < 0) {
    console.warn("No hay solución física");
    return null;
  }

  const v0 = Math.sqrt(v0_squared);

  // Descomponer velocidad en componentes
  const vHorizontal = v0 * cos;
  const vVertical = v0 * sin;

  return {
    x: vHorizontal * Math.cos(horizontalAngle),
    y: vHorizontal * Math.sin(horizontalAngle),
    z: vVertical,
  };
}
// /**
//  * Versión alternativa: calcula velocidad con tiempo de vuelo específico
//  * @param {Object} start - Posición inicial {x, y, z}
//  * @param {Object} target - Posición objetivo {x, y, z}
//  * @param {number} gravity - Aceleración de gravedad
//  * @param {number} time - Tiempo de vuelo deseado
//  * @returns {Object} Velocidad inicial {x, y, z}
//  */
// function calculateProjectileVelocityWithTime(start, target, gravity, time) {
//   const dx = target.x - start.x;
//   const dy = target.y - start.y;
//   const dz = target.z - start.z;

//   return {
//     x: dx / time,
//     y: dy / time + (gravity * time) / 2,
//     z: dz / time,
//   };
// }

// // ========== EJEMPLOS DE USO ==========

// // Ejemplo 1: Usando ángulo de lanzamiento
// const start1 = { x: 0, y: 0, z: 0 };
// const target1 = { x: 100, y: 10, z: 50 };
// const gravity1 = 9.81;
// const angle1 = Math.PI / 4; // 45 grados

// const velocity1 = calculateProjectileVelocity(
//   start1,
//   target1,
//   gravity1,
//   angle1
// );
// console.log("Velocidad inicial (método ángulo):", velocity1);

// // Ejemplo 2: Usando tiempo de vuelo
// const start2 = { x: 0, y: 0, z: 0 };
// const target2 = { x: 100, y: 10, z: 50 };
// const gravity2 = 9.81;
// const time2 = 3; // 3 segundos

// const velocity2 = calculateProjectileVelocityWithTime(
//   start2,
//   target2,
//   gravity2,
//   time2
// );
// console.log("Velocidad inicial (método tiempo):", velocity2);

// // Función de ayuda para simular la trayectoria y verificar
// function simulateTrajectory(
//   start,
//   velocity,
//   gravity,
//   timeStep = 0.1,
//   maxTime = 10
// ) {
//   const trajectory = [];
//   let pos = { ...start };
//   let vel = { ...velocity };

//   for (let t = 0; t <= maxTime; t += timeStep) {
//     trajectory.push({ ...pos, time: t });

//     // Actualizar posición
//     pos.x += vel.x * timeStep;
//     pos.y += vel.y * timeStep;
//     pos.z += vel.z * timeStep;

//     // Actualizar velocidad (solo Y es afectada por gravedad)
//     vel.y -= gravity * timeStep;

//     // Detener si toca el suelo
//     if (pos.y < 0) break;
//   }

//   return trajectory;
// }

// // Verificar la trayectoria
// const trajectory = simulateTrajectory(start1, velocity1, gravity1);
// console.log("Puntos de la trayectoria:", trajectory.length);
// console.log("Posición final:", trajectory[trajectory.length - 1]);

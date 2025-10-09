function radianesAGrados(radianes) {
  return radianes * (180 / Math.PI);
}

function calcularDistancia(obj1, obj2) {
  const dx = obj2.x - obj1.x;
  const dy = obj2.y - obj1.y;
  return Math.sqrt(dx * dx + dy * dy);
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

function crearSpriteConGradiente(radio = 300) {
  // Verificar si ya tenemos esta textura en cache
  const cacheKey = `gradiente_${radio}`;
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

    const cantStops = 10;
    for (let i = 1; i <= cantStops; i++) {
      const value = 2 ** (1 - i);
      gradient.addColorStop(i / cantStops, "rgba(255,255,255," + value + ")"); // Centro blanco (sin oscuridad)
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

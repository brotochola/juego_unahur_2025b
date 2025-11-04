class Camara {
  constructor(juego) {
    this.juego = juego;

    // Variables para el zoom
    this.zoom = 1;
    this.minZoom = 0.25;
    this.maxZoom = 2;
    this.zoomStep = 0.1;

    // Variables para el camera shake
    this.shakeActive = false;
    this.shakeStartTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeFrequencyX = 20;
    this.shakeFrequencyY = 25;

    // Target que la cámara debe seguir
    this.target = null;
  }

  tick() {
    this.seguirAlTarget();
    this.updateShake();
  }

  shake(duration, intensity) {
    // Inicializar el shake
    this.shakeActive = true;
    this.shakeStartTime = performance.now();
    this.shakeDuration = duration * 1000; // Convertir a milisegundos
    this.shakeIntensity = intensity;
  }

  updateShake() {
    // Primero, restar el offset anterior para volver a la posición base
    this.juego.containerPrincipal.x -= this.shakeOffsetX;
    this.juego.containerPrincipal.y -= this.shakeOffsetY;
    this.juego.containerBG.x -= this.shakeOffsetX;
    this.juego.containerBG.y -= this.shakeOffsetY;

    if (!this.shakeActive) {
      // Si no hay shake activo, asegurarnos de que los offsets estén en 0
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      return;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - this.shakeStartTime;

    // Verificar si el shake terminó
    if (elapsed >= this.shakeDuration) {
      this.shakeActive = false;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      return;
    }

    // Calcular el progreso (0 a 1)
    const t = elapsed / this.shakeDuration;

    // Decay exponencial: la intensidad disminuye con el tiempo
    const decay = Math.pow(1 - t, 2);

    // Calcular nuevos offsets usando funciones senoidales
    this.shakeOffsetX =
      this.shakeIntensity *
      Math.sin(this.shakeFrequencyX * t * Math.PI * 2) *
      decay;
    this.shakeOffsetY =
      this.shakeIntensity *
      Math.sin(this.shakeFrequencyY * t * Math.PI * 2) *
      decay;

    // Aplicar el nuevo shake
    this.juego.containerPrincipal.x += this.shakeOffsetX;
    this.juego.containerPrincipal.y += this.shakeOffsetY;
    this.juego.containerBG.x += this.shakeOffsetX;
    this.juego.containerBG.y += this.shakeOffsetY;
  }

  seguirAlTarget(factorLerp = 0.1) {
    if (!this.target) return;

    const centerOfTheLimits = this.juego.nivel.getCenterOfTheLimits();

    const halfWidth = this.juego.width / 2;
    const halfHeight = this.juego.height / 2;
    const limits = this.juego.nivel.getLimits();
    let offsetX = 0;
    let offsetY = 0;
    //estos ratios son entre -1 y 1
    // if (limits) {
    //   const xOffsetRatio =
    //     (this.target.posicion.x - centerOfTheLimits.x) /
    //     (centerOfTheLimits.x - limits.left.x);

    //   const yOffsetRatio =
    //     (this.target.posicion.y - centerOfTheLimits.y) /
    //     (centerOfTheLimits.y - limits.top.y);

    //   //ya se q lo maximo q quiero mover la camara cuando estamos llegando al limite
    //   //es la mitad del ancho o del alto de la pantalla
    //   // es decir, no quiero mostrar lo q no esta hecho del nivel

    //   offsetX = xOffsetRatio * halfWidth * 0.9; //0.9 porq sino es mucho y no se llega a ver el ultimo rincon del mapa
    //   offsetY = yOffsetRatio * halfHeight * 0.9;
    // }
    // Ajustar la posición considerando el zoom actual
    //y agregamos los offsetX e Y
    let targetX =
      -this.target.posicion.x * this.zoom + this.juego.width / 2 + offsetX;
    let targetY =
      -this.target.posicion.y * this.zoom + this.juego.height / 2 + offsetY;

    const x = (targetX - this.juego.containerPrincipal.x) * factorLerp;
    const y = (targetY - this.juego.containerPrincipal.y) * factorLerp;

    this.moverContainersA(
      this.juego.containerPrincipal.x + x,
      this.juego.containerPrincipal.y + y
    );
  }

  moverContainersA(x, y) {
    this.juego.containerPrincipal.x = x;
    this.juego.containerPrincipal.y = y;
    this.juego.containerBG.x = x;
    this.juego.containerBG.y = y;
  }

  cambiarZoom(zoom) {
    this.zoom = zoom;
    this.juego.containerPrincipal.scale.set(this.zoom);
    this.juego.containerBG.scale.set(this.zoom);
  }

  convertirCoordenadaDelMouse(mouseX, mouseY) {
    // Convertir coordenadas del mouse del viewport a coordenadas del mundo
    // teniendo en cuenta la posición y escala del containerPrincipal
    return {
      x: (mouseX - this.juego.containerPrincipal.x) / this.zoom,
      y: (mouseY - this.juego.containerPrincipal.y) / this.zoom,
    };
  }

  setTargetRandom() {
    const personas = this.juego.personas;
    if (personas.length > 0) {
      this.target = personas[Math.floor(personas.length * Math.random())];
    }
  }
}

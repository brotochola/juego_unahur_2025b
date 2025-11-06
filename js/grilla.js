class Grilla {
  constructor(juego, anchoCelda) {
    this.juego = juego;
    this.anchoCelda = anchoCelda;

    this.celdas = new Map();

    this.initGrilla();
  }

  initGrilla() {
    for (let x = 0; x < 5000 / this.anchoCelda; x++) {
      for (let y = 0; y < 4000 / this.anchoCelda; y++) {
        const celda = new Celda(this.juego, this.anchoCelda, x, y);
        const hash = obtenerHashDePosicion(x, y);
        this.celdas.set(hash, celda);
      }
    }
  }

  // Obtener o crear una celda usando coordenadas de grilla (grid coordinates)
  obtenerCeldaEnCoordenadas(gridX, gridY) {
    const hash = obtenerHashDePosicion(gridX, gridY);
    let celda = this.celdas.get(hash);

    if (!celda) {
      celda = new Celda(this.juego, this.anchoCelda, gridX, gridY);
      // console.log("nueva celda", gridX, gridY);
      this.celdas.set(hash, celda);
    }

    return celda;
  }

  // Obtener o crear una celda usando posición en píxeles (pixel position)
  obtenerCeldaEnPosicion(x, y) {
    const gridX = Math.floor(x / this.anchoCelda);
    const gridY = Math.floor(y / this.anchoCelda);
    return this.obtenerCeldaEnCoordenadas(gridX, gridY);
  }

  dibujarGrilla() {
    for (const [key, value] of this.celdas) {
      value.dibujar();
    }
  }
}

class Celda {
  constructor(juego, anchoCelda, x, y) {
    this.anchoCelda = anchoCelda;
    this.juego = juego;
    // Usar Set en vez de Array para operaciones O(1) en agregar/sacar
    // Set.add() = O(1), Set.delete() = O(1) vs Array.splice() = O(n)
    this.entidadesAca = new Set();
    this.entidadesPorClase = {};
    this.id = juego.grilla.obtenerHashDePosicion(x, y);
    this.x = x;
    this.y = y;
    this.celdasVecinasCache = {}; // Caché indexado por cantDeCeldasParaMirar
  }

  agregarAlSetPorClaseYTipo(quien) {
    let aCualSetVa = quien.constructor.name.toLowerCase();
    if (aCualSetVa === "enemigo") {
      aCualSetVa = "enemigo" + quien.bando;
    }
    if (!this.entidadesPorClase[aCualSetVa])
      this.entidadesPorClase[aCualSetVa] = new Set();
    this.entidadesPorClase[aCualSetVa].add(quien);
  }

  sacarDelSetPorClaseYTipo(quien) {
    let aCualSetVa = quien.constructor.name.toLowerCase();
    if (aCualSetVa === "enemigo") {
      aCualSetVa = "enemigo" + quien.bando;
    }
    if (this.entidadesPorClase[aCualSetVa]) {
      this.entidadesPorClase[aCualSetVa].delete(quien);
    }
  }

  agregame(quien) {
    if (!quien) return;
    // Set.add() es O(1) - más rápido que Array.push() para grandes cantidades
    this.entidadesAca.add(quien);
    this.agregarAlSetPorClaseYTipo(quien);
  }

  sacame(quien) {
    if (!quien) return;
    // Set.delete() es O(1) - MUY superior al Array.splice() que era O(n)
    // Antes: recorría todo el array buscando la entidad
    // Ahora: eliminación directa en tiempo constante
    this.entidadesAca.delete(quien);
    this.sacarDelSetPorClaseYTipo(quien);
  }

  getEnemigosPorBando(bando) {
    return this.entidadesPorClase["enemigo" + bando];
  }

  obtenerEntidadesAcaYEnCEldasVecinas(cantDeCeldasParaMirar) {
    // Obtener celdas vecinas desde el caché
    const celdasVecinas =
      this.obtenerCeldasVecinas(cantDeCeldasParaMirar) || [];
    const entidadesCerca = [];

    // Agregar las entidades de esta celda primero
    // Set es iterable, así que spread operator funciona perfecto
    entidadesCerca.push(...this.entidadesAca);

    // Agregar entidades de celdas vecinas
    // Optimizado: una sola pasada sin map/flat/filter intermedios
    for (const celda of celdasVecinas) {
      if (celda && celda.entidadesAca) {
        entidadesCerca.push(...celda.entidadesAca);
      }
    }

    return entidadesCerca;
  }

  obtenerCeldasVecinas(cantDeCeldasParaMirar) {
    // Verificar si ya tenemos el resultado en caché para esta distancia
    if (this.celdasVecinasCache[cantDeCeldasParaMirar]) {
      return this.celdasVecinasCache[cantDeCeldasParaMirar];
    }

    let arr = [];
    for (let x = -cantDeCeldasParaMirar; x <= cantDeCeldasParaMirar; x++) {
      for (let y = -cantDeCeldasParaMirar; y <= cantDeCeldasParaMirar; y++) {
        {
          const newX = this.x + x;
          const newY = this.y + y;

          try {
            const hash = this.juego.grilla.obtenerHashDePosicion(newX, newY);
            const celda = this.juego.grilla.celdas[hash];
            if (this != celda) arr.push(celda);
          } catch (e) {}
        }
      }
    }

    // Guardar en caché antes de retornar
    this.celdasVecinasCache[cantDeCeldasParaMirar] = arr.filter((k) => !!k);
    return arr;
  }

  dibujar() {
    const graficoDebug = this.juego.graficoDebug;
    if (!graficoDebug) return;

    // Calcular la posición en el mundo
    const posX = this.x * this.anchoCelda;
    const posY = this.y * this.anchoCelda;

    // Color dependiendo de si hay entidades o no
    // Set usa .size en vez de .length
    const color = this.entidadesAca.size > 0 ? 0xff0000 : 0x00ff00;
    const alpha = this.entidadesAca.size > 0 ? 0.3 : 0.1;

    // Dibujar el rectángulo de la celda
    graficoDebug.rect(posX, posY, this.anchoCelda, this.anchoCelda);
    graficoDebug.fill({ color: color, alpha: alpha });
    graficoDebug.stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
  }
}

/**
 * CLASE FLASH - DESTELLO TEMPORAL DE LUZ
 *
 * Crea un destello de luz temporal (para disparos, explosiones, etc.)
 * que se integra automáticamente con el sistema de iluminación.
 *
 * Características:
 * - Hereda de EntidadEstatica
 * - Se registra en la grilla espacial
 * - Se agrega automáticamente a cosasQueDanLuz
 * - Maneja su propia vida y fade out
 * - Se autodestruye cuando termina
 */
class Flash extends EntidadEstatica {
  constructor(
    x,
    y,
    juego,
    radioLuz = 150,
    intensidad = 1,
    duracion = 100,
    color = 0xffffaa
  ) {
    super(x, y, juego);

    // Configuración del flash
    this.radio = 0; // Radio físico pequeño (no colisiona)
    this.radioLuz = radioLuz; // Radio de la luz que emite
    this.intensidadInicial = intensidad;
    this.intensidadActual = intensidad;
    this.duracion = duracion; // Duración en milisegundos
    this.color = color;
    this.tiempoInicio = performance.now();
    this.tiempoVida = 0; // Tiempo transcurrido desde creación

    // Estado de iluminación (compatible con faroles/fuegos)
    this.cantidadDeLuz = intensidad;
    this.estado = 1; // 1 = prendido, 0 = apagado

    // Registrar en el sistema
    juego.cosasQueDanLuz.push(this);
    juego.gameObjects.push(this); // Para que tenga tick()

    // No crear sprite ni container visual
    // Solo existe para emitir luz

    // Actualizar posición en la grilla
    this.actualizarMiPosicionEnLaGrilla();
    if (this.celdaActual) {
      this.celdaActual.agregarAlSetPorClaseYTipo(this);
    }
    this.juego.flashes.push(this);

    // El spriteGradiente será creado automáticamente por el sistema de iluminación
    // en actualizarGradientsDeLosFaroles()
  }

  tick() {
    // Calcular tiempo transcurrido
    const tiempoActual = performance.now();
    this.tiempoVida = tiempoActual - this.tiempoInicio;

    // Si terminó la duración, autodestruirse
    if (this.tiempoVida >= this.duracion) {
      this.destruir();
      return;
    }

    // Calcular progreso (0 a 1)
    const progreso = this.tiempoVida / this.duracion;

    // Fade out con curva cuadrática para desvanecimiento natural
    const factorAlpha = Math.pow(1 - progreso, 2);

    // Actualizar cantidad de luz (afecta el gradiente)
    this.cantidadDeLuz = this.intensidadInicial * factorAlpha;

    // Actualizar el alpha del spriteGradiente si existe
    if (this.spriteGradiente) {
      this.spriteGradiente.alpha = this.cantidadDeLuz;
    }
  }

  destruir() {
    console.log("destruyendo flash");
    // Remover de cosasQueDanLuz
    const indexLuz = this.juego.cosasQueDanLuz.indexOf(this);
    if (indexLuz !== -1) {
      this.juego.cosasQueDanLuz.splice(indexLuz, 1);
    }
    //sacar del array de flashes
    this.juego.flashes.splice(this.juego.flashes.indexOf(this), 1);

    // Remover de gameObjects
    const indexObj = this.juego.gameObjects.indexOf(this);
    if (indexObj !== -1) {
      this.juego.gameObjects.splice(indexObj, 1);
    }

    // Remover el spriteGradiente si fue creado
    if (this.spriteGradiente && this.spriteGradiente.parent) {
      this.spriteGradiente.parent.removeChild(this.spriteGradiente);
      this.spriteGradiente.destroy();
      this.spriteGradiente = null;
    }

    // Remover de la grilla
    if (this.celdaActual) {
      this.celdaActual.sacame(this);
    }

    // Remover el container
    if (this.container && this.container.parent) {
      this.container.parent.removeChild(this.container);
      this.container.destroy(true);
    }
  }

  // Override: No crear sprite visual
  async crearSprite() {
    // Intencionalmente vacío - el flash no tiene sprite visible
    // Solo emite luz a través del spriteGradiente que crea el sistema de iluminación
    return 1;
  }
}

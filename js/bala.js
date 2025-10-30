/**
 * CLASE BALA - PROYECTIL DISPARADO POR EL PROTAGONISTA
 *
 * Hereda de GameObject y utiliza un sistema de pooling para reutilizar
 * instancias y evitar crear/destruir objetos constantemente.
 *
 * Sistema de colisión:
 * - Cada frame verifica objetos en su celda de la grilla
 * - Detecta colisión comparando distancia con suma de radios
 * - Al colisionar, llama a recibirUnTiro() del objeto impactado
 * - Vuelve al pool para ser reutilizada
 */

class Bala extends GameObject {
  constructor(x, y, juego) {
    super(x, y, juego);

    // Configuración de la bala
    this.radio = 2; // Radio pequeño para colisión
    this.velocidadBala = 15; // Velocidad constante (más rápida que personajes)
    this.activa = false; // Si está en uso o en el pool
    this.velocidadMaxima = 100; // Sin límite de velocidad práctica
    this.aceleracionMaxima = 5; // Alta aceleración
    this.disparadoPor = null; // Referencia a quien disparó
    this.friccionPorFrame = 1;
    this.anguloRadianes = 0;
    this.tiempoActivacion = 0; // Timestamp cuando se activó la bala
    this.vidaMaximaMs = 10000; // Vida máxima: 30 segundos (30000 ms)
    // Crear sprite visual
    this.crearSprite();
    this.container.label = "bala - " + this.id;
  }
  cambiarTintParaSimularIluminacion() {}

  async crearSprite() {
    // Crear un círculo simple para representar la bala

    this.sprite = new PIXI.Sprite(
      await PIXI.Assets.load("assets/pixelart/bala.png")
    );
    this.sprite.scale.set(0.5, 0.5);
    this.container.addChild(this.sprite);
    this.tieneSpriteCargado = true;
  }

  /**
   * ACTIVAR BALA - Sacar del pool y configurar para disparo
   *
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} anguloRadianes - Dirección del disparo en radianes
   * @param {GameObject} disparadoPor - Objeto que disparó la bala (opcional)
   * @param {number} velocidad - Velocidad del proyectil (opcional)
   */
  activar(
    x,
    y,
    anguloRadianes,
    disparadoPor = null,
    velocidad = this.velocidadBala
  ) {
    this.anguloRadianes = anguloRadianes;
    this.activa = true;
    this.posicion.x = x;
    this.posicion.y = y;

    // Guardar quien disparó
    this.disparadoPor = disparadoPor;

    // Guardar el momento de activación
    this.tiempoActivacion = performance.now();

    // Establecer velocidad en la dirección del disparo
    this.velocidad.x = Math.cos(anguloRadianes) * velocidad;
    this.velocidad.y = Math.sin(anguloRadianes) * velocidad;
    this.container.rotation = anguloRadianes;

    // Hacer visible
    this.container.visible = true;
    this.container.alpha = 1;
    if (disparadoPor && disparadoPor.container) {
      //la bala toma por default el tint del disparador, para simular iluminacion
      this.container.tint = disparadoPor.container.tint;
    }

    // Actualizar posición inicial en la grilla
    this.actualizarMiPosicionEnLaGrilla();
  }

  /**
   * DESACTIVAR BALA - Devolver al pool
   */
  desactivar() {
    this.activa = false;
    this.velocidad.x = 0;
    this.velocidad.y = 0;
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;
    this.container.visible = false;
    this.disparadoPor = null;
    this.tiempoActivacion = 0;

    // Devolver al pool
    BalasPool.release(this);
  }

  /**
   * TICK - Actualización por frame
   *
   * 1. Actualizar física (movimiento)
   * 2. Actualizar posición en la grilla espacial
   * 3. Verificar colisiones con objetos en la celda actual
   */
  tick() {
    if (!this.activa) return;

    // Verificar si ha excedido su tiempo de vida
    const tiempoTranscurrido = performance.now() - this.tiempoActivacion;
    if (tiempoTranscurrido > this.vidaMaximaMs) {
      this.desactivar();
      return;
    }

    // Aplicar física (la velocidad ya está establecida, solo mover)
    this.aplicarFisica();

    // Actualizar en grilla espacial
    this.actualizarMiPosicionEnLaGrilla();

    // Verificar colisiones
    this.verificarColisiones();

    // // Desactivar si sale de los límites del mapa
    // if (this.fueraDeLosBordes()) {
    //   this.desactivar();
    // }
  }

  /**
   * VERIFICAR COLISIONES
   *
   * Revisa todos los objetos en la celda actual y celdas vecinas
   * Detecta colisión cuando: distancia < (radio_bala + radio_objeto)
   */
  verificarColisiones() {
    if (!this.celdaActual) return;

    // Obtener objetos cercanos (en esta celda y vecinas)
    const objetosCercanos = Array.from(this.celdaActual.entidadesAca);

    const posicionBala = this.getPosicionCentral();

    for (let objeto of objetosCercanos) {
      // No chocar con uno mismo, ni con balas, ni con objetos inactivos
      if (objeto === this) continue;
      if (objeto === this.disparadoPor) {
        continue;
      }
      if (objeto instanceof Bala) continue;
      if (objeto.muerto) continue;
      if (!objeto.activa && objeto.activa !== undefined) continue;

      // No golpear a quien disparó
      if (objeto === this.disparadoPor) continue;

      // Calcular distancia entre centros
      const posicionObjeto = objeto.getPosicionCentral();

      // Suma de radios = distancia mínima para colisión
      const sumaRadios = this.radio + objeto.radio;

      // ¿HAY COLISIÓN?
      if (
        laDistanciaEntreDosObjetosEsMenorQue(
          posicionBala,
          posicionObjeto,
          sumaRadios
        )
      ) {
        this.colisionar(objeto);
        return; // Una bala solo golpea un objetivo
      }
    }
  }

  /**
   * COLISIONAR - Procesar impacto
   *
   * @param {GameObject} objeto - Objeto que fue impactado
   */
  colisionar(objeto) {
    console.log("colisiono");
    // Llamar al método recibirUnTiro del objeto impactado (si existe)
    if (objeto.recibirUnTiro instanceof Function) {
      objeto.recibirUnTiro(this);
    }

    // Efecto visual opcional: pequeña animación de impacto
    this.crearEfectoImpacto();

    // Desactivar la bala
    this.desactivar();
  }

  /**
   * CREAR EFECTO DE IMPACTO
   *
   * Pequeña animación visual cuando la bala impacta
   */
  crearEfectoImpacto() {
    // Fade out rápido antes de desactivar
    if (this.container) {
      gsap.to(this.container, {
        alpha: 0,
        duration: 0.1,
      });
    }

    // TODO: Agregar partículas de impacto aquí si lo deseas
  }

  /**
   * VERIFICAR SI ESTÁ FUERA DE LOS BORDES
   */
  fueraDeLosBordes() {
    const margen = 100; // Margen extra antes de desactivar
    return (
      this.posicion.x < -margen ||
      this.posicion.x > this.juego.width + margen ||
      this.posicion.y < -margen ||
      this.posicion.y > this.juego.height + margen
    );
  }

  /**
   * RENDER - Actualizar visualmente
   */
  render() {
    if (!this.activa) return;
    if (!this.sprite) return;
    if (!this.container) return;

    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;

    this.container.zIndex = this.calcularZindex();

    // Rotar sprite según dirección del movimiento
  }
}

/**
 * BALAS POOL - OBJECT POOLING PARA BALAS
 *
 * Sistema de reutilización de balas para optimizar performance:
 * - Evita crear/destruir objetos constantemente
 * - Reduce garbage collection
 * - Mejora fluidez cuando hay muchos disparos
 *
 * Uso:
 * - const bala = BalasPool.get(juego);
 * - bala.activar(x, y, angulo);
 * - ... la bala se desactiva automáticamente al colisionar o salir del mapa
 */
class BalasPool {
  static pool = []; // Balas disponibles
  static activas = new Set(); // Balas en uso
  static maxPoolSize = 100; // Límite de balas en el pool
  static initialized = false;

  /**
   * INICIALIZAR - Pre-crear balas para evitar lag en primer disparo
   */
  static initialize(juego, initialSize = 100) {
    if (this.initialized) return;

    // Pre-crear balas
    for (let i = 0; i < initialSize; i++) {
      // Las balas se crean fuera del mapa y desactivadas
      const bala = new Bala(-10000, -10000, juego);
      bala.activa = false;
      bala.container.visible = false;
      this.pool.push(bala);
    }

    this.initialized = true;
    console.log(`BalasPool inicializado con ${initialSize} balas`);
  }

  /**
   * GET - Obtener una bala del pool
   *
   * @param {Juego} juego - Referencia al juego
   * @returns {Bala} Bala lista para activar
   */
  static get(juego) {
    // Lazy initialization
    if (!this.initialized) {
      this.initialize(juego);
    }

    let bala;

    if (this.pool.length > 0) {
      // Reutilizar bala del pool
      bala = this.pool.pop();
    } else {
      // Pool vacío, crear nueva bala (fallback)
      bala = new Bala(-1000, -1000, juego);
      console.log("Pool de balas vacío, creando nueva bala");
    }

    this.activas.add(bala);

    return bala;
  }

  /**
   * RELEASE - Devolver bala al pool
   *
   * @param {Bala} bala - Bala a devolver
   */
  static release(bala) {
    if (!bala) return;

    this.activas.delete(bala);

    // Solo guardar en el pool si no excede el límite
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(bala);
    } else {
      // Si el pool está lleno, destruir la bala
      // (esto es raro, solo pasa si hay demasiadas balas activas a la vez)
      bala.container.destroy();
    }
  }

  /**
   * GET STATS - Obtener estadísticas del pool
   */
  static getStats() {
    return {
      enPool: this.pool.length,
      activas: this.activas.size,
      total: this.pool.length + this.activas.size,
      poolUsage:
        this.activas.size > 0
          ? `${Math.round(
              (this.activas.size / (this.pool.length + this.activas.size)) * 100
            )}%`
          : "0%",
    };
  }

  /**
   * TICK ALL - Actualizar todas las balas activas
   */
  static tickAll() {
    for (let bala of this.activas) {
      bala.tick();
    }
  }

  /**
   * RENDER ALL - Renderizar todas las balas activas
   */
  static renderAll() {
    for (let bala of this.activas) {
      bala.render();
    }
  }
}

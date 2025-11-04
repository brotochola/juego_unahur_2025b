/**
 * CLASE MOLOTOV - PROYECTIL CON TRAYECTORIA PARABÓLICA
 *
 * Hereda de GameObject pero con un sistema de movimiento especial:
 * - Se mueve en 2D (x, y) normalmente
 * - La altura (z) se calcula con una función cuadrática basada en la distancia recorrida
 * - Cuando llega al piso (z <= 0) explota como los autos
 * - NO usa pooling (más simple que las balas)
 */

class Molotov extends GameObject {
  constructor(x, y, juego) {
    super(x, y, juego);

    // Configuración de la molotov
    this.radio = 5; // Radio pequeño para colisión
    this.velocidadMolotov = 6; // Velocidad más lenta que las balas
    this.activa = false; // Si está en uso o no
    this.velocidadMaxima = 100;
    this.aceleracionMaxima = 5;
    this.disparadoPor = null;
    this.friccionPorFrame = 1; // Sin fricción durante el vuelo
    this.anguloRadianes = 0;

    // Sistema de altura 3D
    this.z = 0; // Altura actual
    this.posicionInicial = { x: 0, y: 0 }; // Punto de lanzamiento
    this.distanciaRecorrida = 0; // Distancia desde el lanzamiento
    this.distanciaMaxima = 400; // Distancia máxima antes de caer (ajustar según necesites)
    this.alturaMaxima = 100; // Altura máxima de la parábola

    // Crear sprite visual
    this.crearSprite();
    this.container.label = "molotov - " + this.id;
  }

  async crearSprite() {
    // Por ahora usar un círculo, después se puede cambiar por una imagen
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(0xff6600); // Color naranja/rojo para molotov
    this.sprite.drawCircle(0, 0, this.radio);
    this.sprite.endFill();

    this.container.addChild(this.sprite);
    this.tieneSpriteCargado = true;
  }

  /**
   * ACTIVAR MOLOTOV - Configurar y lanzar
   *
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} anguloRadianes - Dirección del lanzamiento en radianes
   * @param {GameObject} disparadoPor - Objeto que lanzó la molotov (opcional)
   * @param {number} velocidad - Velocidad del proyectil (opcional)
   */
  activar(
    x,
    y,
    anguloRadianes,
    disparadoPor = null,
    velocidad = this.velocidadMolotov
  ) {
    this.anguloRadianes = anguloRadianes;
    this.activa = true;
    this.posicion.x = x;
    this.posicion.y = y;

    // Guardar posición inicial para calcular distancia recorrida
    this.posicionInicial.x = x;
    this.posicionInicial.y = y;
    this.distanciaRecorrida = 0;

    // Guardar quien lanzó
    this.disparadoPor = disparadoPor;

    // Establecer velocidad en la dirección del lanzamiento
    this.velocidad.x = Math.cos(anguloRadianes) * velocidad;
    this.velocidad.y = Math.sin(anguloRadianes) * velocidad;

    // Iniciar en el aire
    this.z = 0;

    // Hacer visible
    this.container.visible = true;
    this.container.alpha = 1;

    if (disparadoPor && disparadoPor.container) {
      this.container.tint = disparadoPor.container.tint;
    }

    // Agregar al array de molotovs del juego
    if (!this.juego.molotovs.includes(this)) {
      this.juego.molotovs.push(this);
    }

    // Actualizar posición inicial en la grilla
    this.actualizarMiPosicionEnLaGrilla();
  }

  /**
   * DESACTIVAR MOLOTOV - Eliminar del juego
   */
  desactivar() {
    this.activa = false;
    this.velocidad.x = 0;
    this.velocidad.y = 0;
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;
    this.container.visible = false;
    this.disparadoPor = null;
    this.z = 0;
    this.distanciaRecorrida = 0;

    // Remover del array de molotovs
    const index = this.juego.molotovs.indexOf(this);
    if (index > -1) {
      this.juego.molotovs.splice(index, 1);
    }

    // Destruir el container para liberar memoria
    if (this.container) {
      this.container.destroy({ children: true });
      this.container = null;
    }
  }

  /**
   * CALCULAR ALTURA CON FUNCIÓN CUADRÁTICA
   *
   * La función cuadrática es: z(d) = -a*d² + b*d
   * Donde:
   * - d = distancia recorrida / distancia máxima (normalizado 0-1)
   * - La parábola alcanza su máximo en d=0.5
   * - z=0 cuando d=0 y cuando d=1
   *
   * Usando la forma: z = 4*h*d*(1-d)
   * Donde h = altura máxima
   */
  calcularAltura() {
    // Distancia normalizada (0 a 1)
    const d = this.distanciaRecorrida / this.distanciaMaxima;

    // Función cuadrática: z = 4*h*d*(1-d)
    // Esto crea una parábola perfecta que:
    // - Empieza en 0 cuando d=0
    // - Alcanza alturaMaxima cuando d=0.5
    // - Vuelve a 0 cuando d=1
    this.z = 4 * this.alturaMaxima * d * (1 - d);

    // Si pasamos la distancia máxima, z es negativo (ya cayó)
    if (d > 1) {
      this.z = 0;
    }
  }

  /**
   * TICK - Actualización por frame
   *
   * 1. Actualizar física (movimiento en x,y)
   * 2. Calcular distancia recorrida
   * 3. Calcular altura z con función cuadrática
   * 4. Verificar si tocó el piso
   * 5. Actualizar posición en la grilla
   */
  tick() {
    if (!this.activa) return;

    // Aplicar física 2D normal (x, y)
    this.aplicarFisica();

    // Calcular distancia recorrida desde el inicio
    this.distanciaRecorrida = calcularDistancia(
      this.posicion,
      this.posicionInicial
    );

    // Calcular altura z según la distancia recorrida
    this.calcularAltura();

    // Si llegó al piso, explotar
    if (this.z <= 0 && this.distanciaRecorrida > 10) {
      // El check de distancia evita explosión instantánea
      this.explotar();
      return;
    }

    // Actualizar en grilla espacial
    this.actualizarMiPosicionEnLaGrilla();
  }

  /**
   * EXPLOTAR - Al tocar el piso
   * Similar a como explotan los autos
   */
  explotar() {
    console.log("Molotov explotó en", this.posicion);

    // Crear chispas
    this.tirarChispasRandom();

    const cant = 15;
    for (let i = 0; i < cant; i++) {
      setTimeout(() => {
        this.tirarChispasRandom();
      }, i * 10);
    }

    // Crear fuego en la posición de impacto
    setTimeout(() => {
      this.prenderseFuego();
    }, 10);

    // Efecto de cámara
    this.juego.camara.shake(0.15, 5);

    // Desactivar la molotov
    this.desactivar();
  }

  tirarChispasRandom() {
    this.juego.particleSystem.ponerChispasEnPosicion(
      this.getPosicionCentral(),
      {
        x: Math.random() * 15 - 7.5,
        y: Math.random() * 15 - 7.5,
        z: -8 - Math.random() * 5,
      },
      Math.random() * 150 + 100
    );
  }

  prenderseFuego() {
    const pos = this.getPosicionCentral();

    // Crear 2-3 fuegos en la zona de impacto
    this.juego.crearFuego(
      pos.x + (Math.random() - 0.5) * 30,
      pos.y + (Math.random() - 0.5) * 30,
      40 + Math.random() * 20
    );

    setTimeout(() => {
      this.juego.crearFuego(
        pos.x + (Math.random() - 0.5) * 40,
        pos.y + (Math.random() - 0.5) * 40,
        35 + Math.random() * 15
      );
      this.tirarChispasRandom();
    }, Math.random() * 50 + 20);

    setTimeout(() => {
      this.juego.crearFuego(
        pos.x + (Math.random() - 0.5) * 35,
        pos.y + (Math.random() - 0.5) * 35,
        30 + Math.random() * 20
      );
      this.tirarChispasRandom();
    }, Math.random() * 150 + 50);
  }

  /**
   * RENDER - Actualizar visualmente
   * Ajusta la posición Y según la altura z para simular profundidad
   */
  render() {
    if (!this.activa) return;
    if (!this.sprite) return;
    if (!this.container) return;

    // Posición en pantalla ajustada por la altura z
    // En isométrico, la altura se representa restando de Y
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y - this.z; // Más alto = más arriba en pantalla

    this.container.zIndex = this.calcularZindex();

    // Escalar según altura para simular perspectiva
    // Más alto = se ve un poco más grande
    const escala = 1 + (this.z / this.alturaMaxima) * 0.3;
    this.sprite.scale.set(escala, escala);
  }

  cambiarTintParaSimularIluminacion() {
    // Las molotovs en vuelo mantienen el tint
  }
}

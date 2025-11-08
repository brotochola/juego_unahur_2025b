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
  constructor(x, y, z, juego, vectorVelocidadInicial, disparadoPor) {
    super(x, y, juego);

    this.vectorVelocidadInicial = vectorVelocidadInicial;
    this.cantidadDeLuz = 1;
    this.radioLuz = 300;
    this.disparadoPor = disparadoPor;

    juego.cosasQueDanLuz.push(this);
    this.color = 0xffaa00;

    // Configuración de la molotov
    this.radio = 5; // Radio pequeño para colisión
    this.velocidadMolotov = 6; // Velocidad más lenta que las balas
    this.activa = false; // Si está en uso o no
    this.velocidadMaxima = 100;
    this.aceleracionMaxima = 5;

    this.friccionPorFrame = 1; // Sin fricción durante el vuelo

    // Sistema de altura 3D
    this.z = z; // Altura actual

    this.distanciaRecorrida = 0; // Distancia desde el lanzamiento
    this.distanciaMaxima = 400; // Distancia máxima antes de caer (ajustar según necesites)
    this.alturaMaxima = 100; // Altura máxima de la parábola

    this.posicionInicial = { x, y, z };

    // Crear sprite visual
    this.crearSprite();
    this.crearSombra();
    this.container.label = "molotov - " + this.id;
    this.activar();
  }

  async crearSprite() {
    // Por ahora usar un círculo, después se puede cambiar por una imagen
    this.sprite = new PIXI.Sprite(
      PIXI.Assets.get("assets/pixelart/molotov.png")
    );
    this.sprite.scale.set(0.5, 0.5);
    this.sprite.anchor.set(0.5, 0.5);
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
  activar() {
    this.activa = true;

    // Guardar posición inicial para calcular distancia recorrida
    this.distanciaRecorrida = 0;

    this.velocidad.x = this.vectorVelocidadInicial.x;
    this.velocidad.y = this.vectorVelocidadInicial.y;
    this.velocidad.z = this.vectorVelocidadInicial.z;
    this.z = this.posicionInicial.z;

    // // Establecer velocidad en la dirección del lanzamiento
    // this.velocidad.x = Math.cos(anguloRadianes) * velocidad;
    // this.velocidad.y = Math.sin(anguloRadianes) * velocidad;

    // // Iniciar en el aire
    // this.z = 0;

    // Hacer visible
    this.container.visible = true;
    this.container.alpha = 1;

    // if (disparadoPor && disparadoPor.container) {
    //   this.container.tint = disparadoPor.container.tint;
    // }

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

  tick() {
    if (!this.activa) return;

    this.velocidad.z -= Juego.CONFIG.gravedad.z * this.juego.ratioDeltaTime;
    this.z += this.velocidad.z * this.juego.ratioDeltaTime;

    this.aplicarFisica();

    // Actualizar en grilla espacial
    this.actualizarMiPosicionEnLaGrilla();

    this.irDejandoChispasAMedidaQAvanza();

    // Si llegó al piso, explotar
    if (this.z <= 0) {
      // El check de distancia evita explosión instantánea
      this.explotar();
      return;
    }

    if (this.z > -this.juego.grilla.anchoCelda) {
      this.verSiChocaContraAlgoEn3d();
    }
  }

  verSiChocaContraAlgoEn3d() {
    this.celdaActual.entidadesAca.forEach((entidad) => {
      if (entidad instanceof Flash) return;
      if (entidad instanceof Molotov) return;
      if (entidad instanceof Bala) return;
      if (entidad instanceof Fuego) return;

      if (entidad === this) return;
      if (entidad == this.disparadoPor) return;
      if (entidad.muerto) return;

      // Obtener posiciones en 3D (incluyendo Z)

      const dist2 = calcularDistanciaCuadrada(
        this.getPosicionCentral(),
        entidad.getPosicionCentral()
      );

      if (dist2 < (this.radio + entidad.radio) ** 2) {
        //si la distancia en el piso esta ok

        if (this.z > -entidad.sprite.height) {
          //y esta a una altura menor a la altura del sprite
          //estoy calculando colision con cilindros 3d
          entidad.recibioUnBombazo(this);
          this.explotar();
          return;
        }
      }
    });
  }

  irDejandoChispasAMedidaQAvanza() {
    this.juego.particleSystem.ponerChispasEnPosicion(
      { x: this.posicion.x, y: this.posicion.y, z: -this.z },
      {
        x: 0,
        y: 0,
        z: 0,
      },
      Math.floor(Math.random() * 2 + 1)
    );
  }

  /**
   * EXPLOTAR - Al tocar el piso
   * Similar a como explotan los autos
   */
  explotar() {
    // Crear chispas
    this.tirarChispasRandom(150);

    const cant = 15;
    for (let i = 0; i < cant; i++) {
      setTimeout(() => {
        this.tirarChispasRandom(150);
      }, i * 10);
    }

    // Crear fuego en la posición de impacto
    setTimeout(() => {
      this.prenderseFuego(100);
    }, 10);

    this.empujarYHerirPersonasCerca(100);

    // Efecto de cámara
    this.juego.camara.shake(0.15, 5);

    // Desactivar la molotov
    this.desactivar();
  }

  tirarChispasRandom(cant = 3) {
    this.juego.particleSystem.ponerChispasEnPosicion(
      this.getPosicionCentral(),
      {
        x: Math.random() * 15 - 7.5,
        y: Math.random() * 15 - 7.5,
        z: -8 - Math.random() * 5,
      },
      Math.random() * cant + cant * 0.5
    );
  }

  // prenderseFuego() {
  //   const pos = this.getPosicionCentral();

  //   // Crear 2-3 fuegos en la zona de impacto
  //   this.juego.crearFuego(
  //     pos.x + (Math.random() - 0.5) * 30,
  //     pos.y + (Math.random() - 0.5) * 30,
  //     40 + Math.random() * 20
  //   );

  //   setTimeout(() => {
  //     this.juego.crearFuego(
  //       pos.x + (Math.random() - 0.5) * 40,
  //       pos.y + (Math.random() - 0.5) * 40,
  //       35 + Math.random() * 15
  //     );
  //     this.tirarChispasRandom();
  //   }, Math.random() * 50 + 20);

  //   setTimeout(() => {
  //     this.juego.crearFuego(
  //       pos.x + (Math.random() - 0.5) * 35,
  //       pos.y + (Math.random() - 0.5) * 35,
  //       30 + Math.random() * 20
  //     );
  //     this.tirarChispasRandom();
  //   }, Math.random() * 150 + 50);
  // }

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
    if (this.sombra) {
      this.sombra.y = this.z;
      this.sombra.scale.set(this.z * 0.0033 + 0.15);
    }
    this.sprite.rotation += this.velocidad.x * 0.05;

    this.container.zIndex = this.calcularZindex();

    // Escalar según altura para simular perspectiva
    // Más alto = se ve un poco más grande

    // this.sprite.scale.set(escala, escala);
  }

  cambiarTintParaSimularIluminacion() {
    // Las molotovs en vuelo mantienen el tint
  }
}

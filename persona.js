class Persona extends GameObject {
  constructor(x, y, juego) {
    super(x, y, juego);

    this.vida = 1;
    this.bando = 0; //bando default

    this.coraje = Math.random();
    this.vision = Math.random() * 400 + 1000;

    this.fuerzaDeAtaque = 0.01 + Math.random() * 0.01;
    this.radio = 13 + Math.random() * 2;
    this.rangoDeAtaque = this.radio * 3;
    this.factorSeparacion = 1;
    this.factorPerseguir = 0.15;
  }

  buscarPersonasDeMiBando() {
    return this.juego.personas.filter(
      (persona) => persona.bando === this.bando
    );
  }

  buscarPersonasQueNoSonDeMiBando() {
    return this.juego.personas.filter(
      (persona) => persona.bando !== this.bando
    );
  }

  tick() {
    this.escapar();
    this.perseguir();
    this.separacion();
    this.aplicarFisica();

    this.verificarSiEstoyMuerto();

    this.enemigos = this.buscarPersonasQueNoSonDeMiBando();
    this.amigos = this.buscarPersonasDeMiBando();
    this.enemigoMasCerca = this.buscarEnemigoMasCerca();

    this.pegarSiEstaEnMiRango();

    this.calcularAnguloYVelocidadLineal();
  }
  calcularAnguloYVelocidadLineal() {
    this.angulo =
      radianesAGrados(Math.atan2(this.velocidad.y, this.velocidad.x)) + 180;
    this.velocidadLineal = calcularDistancia(this.velocidad, { x: 0, y: 0 });
  }

  async crearSpritesheetAnimado(bando) {
    this.sprite = (
      await AnimatedCharacter.CreateCharacterFromMegaSpritesheet(
        `/assets/pixelart/personajes/${bando}.png`,
        64,
        64
      )
    ).character;

    this.sprite.anchor.set(0.5, 1);

    this.container.addChild(this.sprite);
  }

  separacion() {
    let cont = 0;
    let vectorPromedioDePosiciones = { x: 0, y: 0 };
    for (const persona of this.juego.personas) {
      if (persona !== this) {
        const distancia = calcularDistancia(this.posicion, persona.posicion);
        if (distancia < this.radio) {
          cont++;
          vectorPromedioDePosiciones.x += persona.posicion.x;
          vectorPromedioDePosiciones.y += persona.posicion.y;
        }
      }
    }
    if (cont == 0) return;

    vectorPromedioDePosiciones.x /= cont;
    vectorPromedioDePosiciones.y /= cont;

    let vectorNuevo = {
      x: this.posicion.x - vectorPromedioDePosiciones.x,
      y: this.posicion.y - vectorPromedioDePosiciones.y,
    };
    vectorNuevo = limitarVector(vectorNuevo, 1);
    this.aceleracion.x += this.factorSeparacion * vectorNuevo.x;
    this.aceleracion.y += this.factorSeparacion * vectorNuevo.y;
  }
  verificarSiEstoyMuerto() {
    if (this.vida <= 0) {
      this.morir();
    }
  }

  morir() {
    if (this.muerto) return;

    this.muerto = true;
    this.juego.personas = this.juego.personas.filter(
      (persona) => persona !== this
    );
    this.juego.enemigos = this.juego.enemigos.filter(
      (persona) => persona !== this
    );
    this.juego.amigos = this.juego.amigos.filter((persona) => persona !== this);

    // if (this.sprite) this.sprite.destroy();
    // if (this.container) this.container.destroy();

    this.borrarmeComoTargetDeTodos();
  }

  pegarSiEstaEnMiRango() {
    if (
      this.enemigoMasCerca &&
      calcularDistancia(this.posicion, this.enemigoMasCerca.posicion) <
        this.rangoDeAtaque
    ) {
      this.pegar(this.enemigoMasCerca);
    }
  }

  pegar(enemigo) {
    enemigo.recibirDanio(this.fuerzaDeAtaque);
  }

  recibirDanio(danio) {
    this.vida -= danio;
  }

  buscarEnemigoMasCerca() {
    let enemigoMasCerca = null;
    let distanciaMasCerca = Infinity;
    for (let i = 0; i < this.enemigos.length; i++) {
      const enemigo = this.enemigos[i];
      const distancia = calcularDistancia(this.posicion, enemigo.posicion);
      if (distancia < distanciaMasCerca && distancia < this.vision) {
        distanciaMasCerca = distancia;
        enemigoMasCerca = enemigo;
      }
    }
    return enemigoMasCerca;
  }

  cambiarDeAnimacionSegunLaVelocidadYAngulo() {
    if (this.velocidadLineal == undefined || this.angulo == undefined) {
      return;
    }

    if (this.muerto) {
      this.sprite.changeAnimation("hurt");
      this.sprite.loop = false;
      return;
    }

    if (this.velocidadLineal > this.velocidadMaxima * 0.7) {
      this.sprite.changeAnimation("run");
      this.sprite.animationSpeed =
        (0.25 * this.velocidadLineal) / this.velocidadMaxima;
    } else if (this.velocidadLineal > 0.2) {
      this.sprite.changeAnimation("walk");
      this.sprite.animationSpeed =
        0.05 + (0.3 * this.velocidadLineal) / this.velocidadMaxima;
    } else {
      this.sprite.changeAnimation("idle");
    }

    // Convertir radianes a grados para trabajar más fácil

    // Determinar dirección con 4 direcciones cardinales
    if (this.angulo >= 315 || this.angulo < 45) {
      // Derecha (0°) - rango de 90° centrado en 0°
      this.sprite.changeDirection("left");
    } else if (this.angulo >= 45 && this.angulo < 135) {
      // Abajo (90°) - rango de 90° centrado en 90°
      this.sprite.changeDirection("up");
    } else if (this.angulo >= 135 && this.angulo < 225) {
      // Izquierda (180°) - rango de 90° centrado en 180°
      this.sprite.changeDirection("right");
    } else if (this.angulo >= 225 && this.angulo < 315) {
      // Arriba (270°) - rango de 90° centrado en 270°
      this.sprite.changeDirection("down");
    }
  }

  render() {
    if (!this.container || !this.sprite) return;
    super.render();

    this.cambiarDeAnimacionSegunLaVelocidadYAngulo();

    this.container.zIndex = this.posicion.y;
  }
}

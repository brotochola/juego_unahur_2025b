class Persona extends GameObject {
  constructor(x, y, juego) {
    super(x, y, juego);
    this.noPuedoPegarPeroEstoyEnCombate = false;
    this.muerto = false;
    this.bando = 0; //bando default

    this.rateOfFire = 500; //medido en milisegundos
    this.ultimoGolpe = 0;

    this.coraje = Math.random();
    this.vision = Math.random() * 400 + 400;

    this.fuerzaDeAtaque = 0.05 + Math.random() * 0.05;
    this.radio = 7 + Math.random() * 3;
    this.rangoDeAtaque = this.radio * 3;

    this.factorPerseguir = 0.15;
    this.factorEscapar = 0.1;

    this.factorSeparacion = 0.5;
    this.factorCohesion = 0.2;
    this.factorAlineacion = 0.4;

    this.factorRepelerSuavementeObstaculos = 1;

    this.aceleracionMaxima = 0.2;
    this.velocidadMaxima = 3;
    this.amigos = [];
    this.crearSombra();
  }

  buscarPersonasDeMiBando() {
    return this.juego.personas.filter(
      (persona) => persona.bando === this.bando && !persona.muerto
    );
  }

  buscarEnemigos() {
    return this.juego.personas.filter(
      (persona) =>
        !persona.muerto &&
        persona.bando !== this.bando &&
        persona.bando != "policia" &&
        persona.bando != "civil"
    );
  }

  getPersonasCerca() {
    return this.juego.personas.filter(
      (persona) =>
        calcularDistancia(this.posicion, persona.posicion) < this.vision &&
        !persona.muerto
    );
  }

  getAmigosCerca() {
    return this.personasCerca.filter((persona) =>
      this.amigos.includes(persona)
    );
  }

  getEnemigosCerca() {
    return this.personasCerca.filter((persona) =>
      this.enemigos.includes(persona)
    );
  }

  buscarObstaculosBienCerquitaMio() {
    this.obstaculosCercaMio = [];
    this.obstaculosConLosQueMeEstoyChocando = [];
    for (let obstaculo of this.juego.obstaculos) {
      const dist = calcularDistancia(
        this.posicion,
        obstaculo.getPosicionCentral()
      );

      const distDeColision = this.radio + obstaculo.radio;
      const distConChangui = distDeColision + this.radio * 10;
      if (dist < distConChangui && dist > distDeColision) {
        this.obstaculosCercaMio.push(obstaculo);
      } else if (dist < distDeColision) {
        this.obstaculosConLosQueMeEstoyChocando.push(obstaculo);
      }
    }
  }

  repelerSuavementeObstaculos() {
    if (this.obstaculosCercaMio.length == 0) return;

    const posicionFutura = {
      x: this.posicion.x + this.velocidad.x * 10,
      y: this.posicion.y + this.velocidad.y * 10,
    };

    let fuerzaRepulsionTotal = { x: 0, y: 0 };

    for (let obstaculo of this.obstaculosCercaMio) {
      const posicionObstaculo = obstaculo.getPosicionCentral();

      // Vector que apunta del obstáculo hacia mi posición futura
      const vectorRepulsion = limitarVector({
        x: posicionFutura.x - posicionObstaculo.x,
        y: posicionFutura.y - posicionObstaculo.y,
      });
      const distancia = Math.sqrt(
        vectorRepulsion.x * vectorRepulsion.x +
          vectorRepulsion.y * vectorRepulsion.y
      );

      // Calcular fuerza inversamente proporcional a la distancia
      // Cuanto más cerca, más fuerza (usando 1/distancia)
      const fuerzaBase = 3; // Factor base de repulsión
      const distanciaMinima = 10; // Distancia mínima para evitar fuerzas extremas
      const fuerzaRepulsion = fuerzaBase / Math.max(distancia, distanciaMinima);

      // Aplicar la fuerza de repulsión
      fuerzaRepulsionTotal.x += vectorRepulsion.x * fuerzaRepulsion;
      fuerzaRepulsionTotal.y += vectorRepulsion.y * fuerzaRepulsion;
    }

    // Aplicar la fuerza total a la aceleración
    this.aceleracion.x +=
      fuerzaRepulsionTotal.x * this.factorRepelerSuavementeObstaculos;
    this.aceleracion.y +=
      fuerzaRepulsionTotal.y * this.factorRepelerSuavementeObstaculos;
  }
  percibirEntorno() {
    // mirar alrededor
    //todos los enemigos
    this.enemigos = this.buscarEnemigos();
    //todos los amigos
    this.amigos = this.buscarPersonasDeMiBando();

    //todas las personas en mi rango de vision
    this.personasCerca = this.getPersonasCerca();
    //de esas personas cuales son amigas
    this.amigosCerca = this.getAmigosCerca();
    //de esas personas cuales son enemigos
    this.enemigosCerca = this.getEnemigosCerca();
    //de los enemigos cerca, el mas cercano
    this.enemigoMasCerca = this.buscarEnemigoMasCerca();

    this.buscarObstaculosBienCerquitaMio();
  }

  noChocarConObstaculos() {
    if (this.obstaculosConLosQueMeEstoyChocando.length == 0) return;
    const posicionFutura = {
      x: this.posicion.x + this.velocidad.x,
      y: this.posicion.y + this.velocidad.y,
    };

    for (let obstaculo of this.obstaculosConLosQueMeEstoyChocando) {
      const posicionObstaculo = obstaculo.getPosicionCentral();
      const vectorRepulsion = {
        x: posicionFutura.x - posicionObstaculo.x,
        y: posicionFutura.y - posicionObstaculo.y,
      };

      this.aceleracion.x += vectorRepulsion.x;
      this.aceleracion.y += vectorRepulsion.y;
    }
  }

  tick() {
    /**
     * CICLO PRINCIPAL DE ACTUALIZACIÓN DE LA PERSONA
     *
     * Orden de ejecución optimizado para estabilidad:
     * 1. Verificar estado de vida
     * 2. Aplicar comportamientos de IA (separación)
     * 3. Procesar física del movimiento
     * 4. Actualizar listas de aliados/enemigos
     * 5. Ejecutar acciones de combate
     * 6. Calcular datos para animación
     */
    if (this.muerto) return;

    // Comportamientos de IA
    this.separacion(); // Evitar aglomeraciones
    this.aplicarFisica(); // Procesar movimiento

    this.verificarSiEstoyMuerto();

    // Actualizar contexto social y de combate
    this.enemigos = this.buscarPersonasQueNoSonDeMiBando();
    this.amigos = this.buscarPersonasDeMiBando();
    this.enemigoMasCerca = this.buscarEnemigoMasCerca();

    this.pegarSiEstaEnMiRango();

    // Datos para el sistema de animación
    this.calcularAnguloYVelocidadLineal();
  }
  calcularAnguloYVelocidadLineal() {
    /**
     * CÁLCULO DE PARÁMETROS DE ANIMACIÓN
     *
     * Ángulo de movimiento:
     * - atan2(y,x) devuelve el ángulo en radianes del vector velocidad
     * - Se suma 180° para ajustar la orientación del sprite
     * - Conversión a grados para facilitar el trabajo con animaciones
     *
     * Velocidad lineal (magnitud del vector):
     * - |v| = √(vx² + vy²)
     * - Se calcula como distancia desde el origen (0,0)
     * - Usado para determinar qué animación reproducir (idle/walk/run)
     */
    this.angulo =
      radianesAGrados(Math.atan2(this.velocidad.y, this.velocidad.x)) + 180;
    this.velocidadLineal = calcularDistancia(this.velocidad, { x: 0, y: 0 });
  }

  async crearSpritesheetAnimado(bando) {
    this.sprite = (
      await AnimatedCharacter.CreateCharacterFromMegaSpritesheet(
        `assets/pixelart/personajes/${bando}.png`,
        64,
        64
      )
    ).character;

    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(0.85, 0.85);

    this.container.addChild(this.sprite);
  }

  alineacion() {
    let cont = 0;
    let vectorPromedioDeVelocidades = { x: 0, y: 0 };
    for (const persona of this.amigosCerca) {
      if (persona !== this) {
        const distancia = calcularDistancia(this.posicion, persona.posicion);
        if (distancia < this.vision) {
          cont++;
          vectorPromedioDeVelocidades.x += persona.velocidad.x;
          vectorPromedioDeVelocidades.y += persona.velocidad.y;
        }
      }
    }
    if (cont == 0) return;

    vectorPromedioDeVelocidades.x /= cont;
    vectorPromedioDeVelocidades.y /= cont;

    let vectorNuevo = {
      x: vectorPromedioDeVelocidades.x - this.velocidad.x,
      y: vectorPromedioDeVelocidades.y - this.velocidad.y,
    };
    vectorNuevo = limitarVector(vectorNuevo, 1);
    this.aceleracion.x += this.factorAlineacion * vectorNuevo.x;
    this.aceleracion.y += this.factorAlineacion * vectorNuevo.y;
  }

  cohesion() {
    let cont = 0;
    //verctor vacio donde vamos a ir sumando posiciones
    let vectorPromedioDePosiciones = { x: 0, y: 0 };
    //iteramos por todos los amigos

    for (const persona of this.amigosCerca) {
      if (persona === this || persona === this.juego.protagonista) continue;
      //si la persona ota no soy yo y no es el protagonista
      const distancia = calcularDistancia(this.posicion, persona.posicion);
      const sumaDeRadios = this.radio + persona.radio;
      const distanciaMinima = sumaDeRadios * 3;
      if (distancia < this.vision && distancia > distanciaMinima) {
        //si la persona esta muy cerca no nos acercamos a ella
        cont++;
        vectorPromedioDePosiciones.x += persona.posicion.x;
        vectorPromedioDePosiciones.y += persona.posicion.y;
      }
    }
    if (cont == 0) return;

    vectorPromedioDePosiciones.x /= cont;
    vectorPromedioDePosiciones.y /= cont;

    let vectorNuevo = limitarVector({
      x: vectorPromedioDePosiciones.x - this.posicion.x,
      y: vectorPromedioDePosiciones.y - this.posicion.y,
    });

    const distanciaAlPromedioDePosiciones = calcularDistancia(
      this.posicion,
      vectorPromedioDePosiciones
    );

    const distanciaMinima = this.radio * 14;
    if (distanciaAlPromedioDePosiciones < distanciaMinima) return;

    const factorDistancia = distanciaAlPromedioDePosiciones / distanciaMinima;
    vectorNuevo.x *= factorDistancia;
    vectorNuevo.y *= factorDistancia;

    this.aceleracion.x += this.factorCohesion * vectorNuevo.x;
    this.aceleracion.y += this.factorCohesion * vectorNuevo.y;
  }

  separacion() {
    for (const persona of this.juego.personas) {
      if (persona == this) continue;
      const distancia = calcularDistancia(this.posicion, persona.posicion);
      if (distancia > this.radio + persona.radio) continue;
      let vectorNuevo = {
        x: this.posicion.x - persona.posicion.x,
        y: this.posicion.y - persona.posicion.y,
      };

      this.aceleracion.x += vectorNuevo.x;
      this.aceleracion.y += vectorNuevo.y;
    }
  }
  verificarSiEstoyMuerto() {
    if (this.vida <= 0) {
      this.morir();
      return;
    }

    this.vida += 0.0001;
    if (this.vida > this.vidaMaxima) this.vida = this.vidaMaxima;
  }

  morir() {
    if (this.muerto) return;

    // Marcar como muerto PRIMERO para evitar que se actualice la barra durante el proceso
    this.muerto = true;
    this.quitarBarritaVida();

    this.borrarmeComoTargetDeTodos();

    this.juego.personas = this.juego.personas.filter(
      (persona) => persona !== this
    );
    this.juego.enemigos = this.juego.enemigos.filter(
      (persona) => persona !== this
    );
    this.juego.amigos = this.juego.amigos.filter((persona) => persona !== this);

    this.container.zIndex = this.calcularZindex();
  }

  pegarSiEstaEnMiRango() {
    if (
      this.enemigoMasCerca &&
      calcularDistancia(this.posicion, this.enemigoMasCerca.posicion) <
        this.rangoDeAtaque
    ) {
      if (this.puedoPegar()) {
        this.pegar(this.enemigoMasCerca);
        this.noPuedoPegarPeroEstoyEnCombate = false;
      } else {
        this.noPuedoPegarPeroEstoyEnCombate = true;
      }
    } else {
      this.noPuedoPegarPeroEstoyEnCombate = false;
    }
  }
  puedoPegar() {
    return performance.now() > this.rateOfFire + this.ultimoGolpe;
  }

  pegar(enemigo) {
    enemigo.recibirDanio(this.fuerzaDeAtaque);
    this.ultimoGolpe = performance.now();
    this.pegando = true;
    setTimeout(() => {
      this.pegando = false;
    }, 300);
  }

  recibirDanio(danio) {
    this.vida -= danio;
  }

  caminarSinRumbo() {
    if (!this.container || !this.sprite) return;

    if (!this.targetRandom) {
      this.targetRandom = {
        posicion: {
          x: this.juego.anchoDelMapa * Math.random(),
          y: this.juego.altoDelMapa * Math.random(),
        },
      };
    }

    if (
      calcularDistancia(this.posicion, this.targetRandom.posicion) <
      this.distanciaParaLlegarALTarget
    ) {
      this.targetRandom = null;
    }

    if (!this.targetRandom) return;
    if (
      isNaN(this.targetRandom.posicion.x) ||
      isNaN(this.targetRandom.posicion.y)
    )
      debugger;

    // Vector de dirección hacia el objetivo
    const difX = this.targetRandom.posicion.x - this.posicion.x;
    const difY = this.targetRandom.posicion.y - this.posicion.y;

    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    // Aplicar fuerza de persecución escalada por el factor específico del objeto
    this.aceleracion.x += vectorNuevo.x * this.factorPerseguir;
    this.aceleracion.y += vectorNuevo.y * this.factorPerseguir;
  }

  buscarEnemigoMasCerca() {
    /**
     * ALGORITMO DE BÚSQUEDA DEL ENEMIGO MÁS CERCANO
     *
     * Implementa búsqueda lineal optimizada:
     * 1. Inicializar con distancia infinita
     * 2. Iterar por todos los enemigos
     * 3. Calcular distancia euclidiana: d = √((x₂-x₁)² + (y₂-y₁)²)
     * 4. Filtrar por rango de visión
     * 5. Mantener el mínimo encontrado
     *
     * Complejidad: O(n) donde n = número de enemigos
     *
     * Optimización futura posible: Spatial hashing o Quadtree
     * para reducir a O(log n) en escenarios con muchos agentes
     */
    let enemigoMasCerca = null;
    let distanciaMasCerca = Infinity;

    for (let i = 0; i < this.enemigosCerca.length; i++) {
      const enemigo = this.enemigosCerca[i];
      const distancia = calcularDistancia(this.posicion, enemigo.posicion);

      // Actualizar si es más cercano Y está dentro del rango de visión
      if (distancia < distanciaMasCerca && distancia < this.vision) {
        distanciaMasCerca = distancia;
        enemigoMasCerca = enemigo;
      }
    }
    return enemigoMasCerca;
  }

  cambiarDeAnimacionSegunLaVelocidadYAngulo() {
    /**
     * SISTEMA DE ANIMACIÓN BASADO EN FÍSICA
     *
     * Mapea el estado físico del agente a animaciones visuales:
     *
     * 1. SELECCIÓN DE ANIMACIÓN POR VELOCIDAD:
     *    - Muerte: animación "hurt" sin loop
     *    - Correr: velocidad > 70% del máximo
     *    - Caminar: velocidad > 0.1 píxeles/frame
     *    - Idle: velocidad ≤ 0.1 píxeles/frame
     *
     * 2. VELOCIDAD DE ANIMACIÓN ADAPTATIVA:
     *    - Correr: speed = 0.25 × (v_actual / v_max)
     *    - Caminar: speed = 0.05 + 0.3 × (v_actual / v_max)
     *    - Esto sincroniza la animación con la velocidad real
     *
     * 3. DIRECCIÓN CARDINAL (4 direcciones):
     *    - Divide el círculo en 4 sectores de 90°
     *    - Mapea ángulos de movimiento a direcciones de sprite
     *    - Nota: Las direcciones están invertidas por el sistema de coordenadas
     */
    if (this.velocidadLineal == undefined || this.angulo == undefined) {
      return;
    }

    if (this.muerto) {
      this.sprite.changeAnimation("hurt");
      // this.sprite.anchor.set(0.5, 0);
      // this.sprite.y = -this.sprite.height;
      this.sprite.loop = false;
      return;
    }

    if (this.recienConvertido) {
      this.sprite.changeAnimation("spellcast");
      this.sprite.loop = false;
      return;
    }

    if (this.pegando) {
      this.sprite.changeAnimation("slash");
      this.velocidad.x *= 0.1;
      this.velocidad.y *= 0.1;
      return;
    } else if (this.noPuedoPegarPeroEstoyEnCombate) {
      this.sprite.changeAnimation("combat");
      this.velocidad.x *= 0.3;
      this.velocidad.y *= 0.3;
      return;
    }

    if (this.velocidadLineal > this.velocidadMaxima * 0.7) {
      this.sprite.changeAnimation("run");
      this.sprite.animationSpeed =
        (0.25 * this.velocidadLineal) / this.velocidadMaxima;
    } else if (this.velocidadLineal > 0.1) {
      this.sprite.changeAnimation("walk");
      this.sprite.animationSpeed =
        0.05 + (0.3 * this.velocidadLineal) / this.velocidadMaxima;
    } else {
      this.sprite.changeAnimation("idle");
    }

    /**
     * MAPEO DE DIRECCIÓN CARDINAL
     *
     * Divide el espacio en 4 sectores de 90°:
     * - Sector 1: [315°, 45°) → Derecha (sprite: "left")
     * - Sector 2: [45°, 135°) → Abajo (sprite: "up")
     * - Sector 3: [135°, 225°) → Izquierda (sprite: "right")
     * - Sector 4: [225°, 315°) → Arriba (sprite: "down")
     *
     * Nota: Las direcciones del sprite están invertidas debido al
     * sistema de coordenadas y la orientación del spritesheet
     */
    if (this.angulo >= 315 || this.angulo < 45) {
      this.sprite.changeDirection("left");
    } else if (this.angulo >= 45 && this.angulo < 135) {
      this.sprite.changeDirection("up");
    } else if (this.angulo >= 135 && this.angulo < 225) {
      this.sprite.changeDirection("right");
    } else if (this.angulo >= 225 && this.angulo < 315) {
      this.sprite.changeDirection("down");
    }
  }

  render() {
    /**
     * RENDERIZADO CON ORDENAMIENTO EN PROFUNDIDAD
     *
     * 1. Verificaciones de seguridad
     * 2. Sincronización física-visual (super.render())
     * 3. Actualización del sistema de animación

     */
    if (!this.container || !this.sprite) return;
    super.render();

    this.cambiarDeAnimacionSegunLaVelocidadYAngulo();
  }

  borrar() {
    this.borrarmeComoTargetDeTodos();
    this.container.parent = null;
    this.container = null;
    this.sprite = null;

    this.juego.personas = this.juego.personas.filter(
      (persona) => persona !== this
    );
    this.juego.enemigos = this.juego.enemigos.filter(
      (persona) => persona !== this
    );
    this.juego.amigos = this.juego.amigos.filter((persona) => persona !== this);
    this.juego.policias = this.juego.policias.filter(
      (persona) => persona !== this
    );
  }
}

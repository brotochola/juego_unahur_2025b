// NOTA MENTAL:

// ancho de la iamgen * 0.288675 me da el alto desde el
// margen inferior hasta el 'horizonte' de la isometria
// Es decir el radio del circulo q es el 'collider' del gameObject

class GameObject {
  //defino las propiedades q tiene mi clase, aunq podria no definirlas
  sprite;
  id;
  x = 0;
  y = 0;
  radio = 12;
  rangoDeAtaque = 25 + Math.random() * 10;

  target;
  perseguidor;
  aceleracionMaxima = 0.2;
  velocidadMaxima = 3;

  constructor(x, y, juego) {
    this.vision = Math.random() * 300 + 400;
    //guarda una referencia a la instancia del juego
    this.posicion = { x: x, y: y };
    this.velocidad = { x: Math.random() * 10, y: Math.random() * 10 };
    this.aceleracion = { x: 0, y: 0 };

    this.juego = juego;
    //generamos un ID para este conejito
    this.id = Math.floor(Math.random() * 99999999);

    // tomo como parametro la textura y creo un sprite

    // this.sprite = new PIXI.Sprite(PIXI.Assets.get(nombreDeLaTextura));
    this.container = new PIXI.Container();
    // this.container.addChild(this.sprite);
    //le asigno x e y al sprite
    this.container.x = x;
    this.container.y = y;

    //establezco el punto de pivot en el medio:
    // this.sprite.anchor.set(0.5, 1);

    //agrego el sprite al stage
    //this.juego es una referencia a la instancia de la clase Juego
    //a su vez el juego tiene una propiedad llamada pixiApp, q es la app de PIXI misma,
    //q a su vez tiene el stage. Y es el Stage de pixi q tiene un metodo para agregar 'hijos'
    //(el stage es como un container/nodo)
    this.juego.containerPrincipal.addChild(this.container);
  }

  tick() {
    this.aplicarFisica();
  }

  aplicarFisica() {
    this.limitarAceleracion();
    this.velocidad.x +=
      this.aceleracion.x * this.juego.pixiApp.ticker.deltaTime;
    this.velocidad.y +=
      this.aceleracion.y * this.juego.pixiApp.ticker.deltaTime;

    this.aceleracion.x = 0;
    this.aceleracion.y = 0;

    //variaciones de la velocidad
    // this.rebotar();
    this.aplicarFriccion();
    this.limitarVelocidad();

    //pixeles por frame
    this.posicion.x += this.velocidad.x * this.juego.pixiApp.ticker.deltaTime;
    this.posicion.y += this.velocidad.y * this.juego.pixiApp.ticker.deltaTime;

    //guardamos el angulo
    this.angulo = radianesAGrados(
      Math.atan2(this.velocidad.y, this.velocidad.x)
    );
  }

  limitarAceleracion() {
    this.aceleracion = limitarVector(this.aceleracion, this.aceleracionMaxima);
  }

  limitarVelocidad() {
    this.velocidad = limitarVector(this.velocidad, this.velocidadMaxima);
  }

  aplicarFriccion() {
    this.velocidad.x *= 0.93;
    this.velocidad.y *= 0.93;
  }

  rebotar() {
    //ejemplo mas realista
    if (this.posicion.x > this.juego.width || this.posicion.x < 0) {
      //si la coordenada X de este conejito es mayor al ancho del stage,
      //o si la coordenada X.. es menor q 0 (o sea q se fue por el lado izquierdo)
      //multiplicamos por -0.99, o sea que se invierte el signo (si era positivo se hace negativo y vicecversa)
      //y al ser 0.99 pierde 1% de velocidad
      this.velocidad.x *= -0.99;
    }

    if (this.posicion.y > this.juego.height || this.posicion.y < 0) {
      this.velocidad.y *= -0.99;
    }
  }
  borrarmeComoTargetDeTodos() {
    this.juego.personas.forEach((persona) => {
      persona.asignarTarget(null);
    });
  }

  asignarTarget(quien) {
    if (quien instanceof Persona && quien.muerto) return;
    this.target = quien;
  }

  perseguir() {
    if (!this.target) return;
    const dist = calcularDistancia(this.posicion, this.target.posicion);
    if (dist > this.vision) return;

    const difX = this.target.posicion.x - this.posicion.x;
    const difY = this.target.posicion.y - this.posicion.y;

    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    if (dist < this.rangoDeAtaque) {
      // Reducción más pronunciada cuando están muy cerca
      const factor = (dist / this.rangoDeAtaque) ** 3;
      vectorNuevo.x *= factor;
      vectorNuevo.y *= factor;
    }

    this.aceleracion.x += vectorNuevo.x * this.factorPerseguir;
    this.aceleracion.y += vectorNuevo.y * this.factorPerseguir;
  }

  escapar() {
    if (!this.perseguidor) return;
    const dist = calcularDistancia(this.posicion, this.perseguidor.posicion);
    if (dist > this.vision) return;

    const difX = this.perseguidor.posicion.x - this.posicion.x;
    const difY = this.perseguidor.posicion.y - this.posicion.y;
    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);
    this.aceleracion.x += -vectorNuevo.x;
    this.aceleracion.y += -vectorNuevo.y;
  }

  asignarVelocidad(x, y) {
    this.velocidad.x = x;
    this.velocidad.y = y;
  }

  render() {
    if (!this.container || this.muerto) return;
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
  }
}

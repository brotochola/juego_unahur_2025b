class Juego {
  pixiApp;
  personas = [];
  amigos = [];
  enemigos = [];
  faroles = [];
  monumentos = [];
  arboles = [];
  autos = [];
  objetosInanimados = [];
  protagonista;
  width;
  height;

  constructor() {
    this.iluminacion = true;
    this.updateDimensions();
    this.anchoDelMapa = 5000;
    this.altoDelMapa = 3000;
    this.mouse = { posicion: { x: 0, y: 0 } };
    this.initPIXI();
    this.setupResizeHandler();
  }

  updateDimensions() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.updateDimensions();
      if (this.pixiApp) {
        this.pixiApp.renderer.resize(this.width, this.height);
      }
    });
  }

  //async indica q este metodo es asyncronico, es decir q puede usar "await"
  async initPIXI() {
    //creamos la aplicacion de pixi y la guardamos en la propiedad pixiApp
    this.pixiApp = new PIXI.Application();
    globalThis.__PIXI_APP__ = this.pixiApp;
    const opcionesDePixi = {
      background: "#1099bb",
      width: this.width,
      height: this.height,
      resizeTo: window,
    };

    //inicializamos pixi con las opciones definidas anteriormente
    //await indica q el codigo se frena hasta que el metodo init de la app de pixi haya terminado
    //puede tardar 2ms, 400ms.. no lo sabemos :O
    await this.pixiApp.init(opcionesDePixi);

    // //agregamos el elementos canvas creado por pixi en el documento html
    document.body.appendChild(this.pixiApp.canvas);

    //agregamos el metodo this.gameLoop al ticker.
    //es decir: en cada frame vamos a ejecutar el metodo this.gameLoop
    this.pixiApp.ticker.add(this.gameLoop.bind(this));

    this.agregarInteractividadDelMouse();
    this.pixiApp.stage.sortableChildren = true;
    this.crearNivel();
  }

  async crearFondo() {
    this.fondo = new PIXI.TilingSprite(await PIXI.Assets.load("assets/bg.jpg"));
    this.fondo.zIndex = -999999999999999999999;
    this.fondo.tileScale.set(0.5);
    this.fondo.width = this.anchoDelMapa;
    this.fondo.height = this.altoDelMapa;
    this.containerPrincipal.addChild(this.fondo);
  }
  async crearNivel() {
    this.containerPrincipal = new PIXI.Container();
    this.pixiApp.stage.addChild(this.containerPrincipal);
    await this.cargarTexturas();
    this.crearFondo();

    this.nivel = new Nivel("assets/pixelart/plaza_de_mayo_5.json", this);

    this.crearProtagonista();
    this.crearEnemigos(30, 2);
    this.crearEnemigos(40, 3);
    this.crearEnemigos(40, 4);
    this.crearEnemigos(40, 5);
    this.crearEnemigos(40, 6);
    this.crearEnemigos(40, 7);

    this.crearAmigos();
    // this.crearArboles();
    // this.crearAutos();

    this.crearSistemaDeIluminacion();
  }
  async cargarTexturas() {
    await PIXI.Assets.load(["assets/bg.jpg"]);
  }
  crearEnemigos(cant, bando) {
    for (let i = 0; i < cant; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const persona = new Enemigo(x, y, this, bando);
      this.personas.push(persona);
      this.enemigos.push(persona);
    }
  }

  crearAutos() {
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const auto = new Auto(x, y, this);
      this.autos.push(auto);
      this.objetosInanimados.push(auto);
    }
  }

  crearArboles() {
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const arbol = new Arbol(x, y, this);
      this.arboles.push(arbol);
      this.objetosInanimados.push(arbol);
    }
  }
  crearAmigos() {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * this.anchoDelMapa;
      const y = Math.random() * this.altoDelMapa;
      const persona = new Amigo(x, y, this);
      this.personas.push(persona);
      this.amigos.push(persona);
    }
  }
  crearProtagonista() {
    const x = this.width / 2;
    const y = this.height / 2;
    const protagonista = new Protagonista(x, y, this);
    this.personas.push(protagonista);
    this.protagonista = protagonista;
  }

  agregarInteractividadDelMouse() {
    // Escuchar el evento mousemove
    this.pixiApp.canvas.onmousemove = (event) => {
      this.mouse.posicion = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
    };

    this.pixiApp.canvas.onmousedown = (event) => {
      this.mouse.down = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
      this.mouse.apretado = true;
    };
    this.pixiApp.canvas.onmouseup = (event) => {
      this.mouse.up = {
        x: event.x - this.containerPrincipal.x,
        y: event.y - this.containerPrincipal.y,
      };
      this.mouse.apretado = false;
    };
  }

  crearSistemaDeIluminacion() {
    // Crear el canvas de iluminación del tamaño del mapa
    setTimeout(() => {
      this.crearCanvasIluminacion();
    }, 1000);
  }

  crearCanvasIluminacion() {
    // 1. Crear un canvas con margen (3x el tamaño del mapa)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = this.anchoDelMapa * 3;
    canvas.height = this.altoDelMapa * 3;

    // 2. Pintarlo todo de negro
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Hacer círculos de gradiente blanco a transparente donde están los faroles
    for (let farol of this.faroles) {
      if (!farol.sprite) return console.warn("No hay sprite para el farol");

      // Ajustar las coordenadas para el canvas con margen
      const centroX = farol.posicion.x + this.anchoDelMapa;
      const centroY = farol.posicion.y - farol.sprite.height + this.altoDelMapa;
      const radio = 600;

      // Crear gradiente radial: blanco en el centro, transparente en el borde
      const gradient = ctx.createRadialGradient(
        centroX,
        centroY,
        0,
        centroX,
        centroY,
        radio
      );
      gradient.addColorStop(0, "white"); // Centro blanco (sin oscuridad)
      gradient.addColorStop(0.2, "rgba(255,255,255,0.5)"); // Transición
      gradient.addColorStop(0.4, "rgba(255,255,255,0.25)"); // Más transición
      gradient.addColorStop(0.6, "rgba(255,255,255,0.125)"); // Más transición
      gradient.addColorStop(0.8, "rgba(255,255,255,0.0625)"); // Más transición
      gradient.addColorStop(1, "rgba(255,255,255,0)"); // Borde transparente

      // Dibujar el círculo con gradiente
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centroX, centroY, radio, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Crear un sprite a partir de la textura del canvas
    const texturaIluminacion = PIXI.Texture.from(canvas);
    this.spriteIluminacion = new PIXI.Sprite(texturaIluminacion);

    // 5. Posicionar el sprite para que el margen quede en la posición correcta
    this.spriteIluminacion.x = -this.anchoDelMapa;
    this.spriteIluminacion.y = -this.altoDelMapa;

    // 6. Configurar el sprite con zIndex alto y modo multiply
    this.spriteIluminacion.zIndex = 2;
    this.spriteIluminacion.blendMode = "multiply";
    this.spriteIluminacion.alpha = 0.8;

    // 7. Agregar al container principal
    this.containerPrincipal.addChild(this.spriteIluminacion);
  }

  gameLoop(time) {
    //iteramos por todos los personas
    for (let unpersona of this.personas) {
      //ejecutamos el metodo tick de cada persona
      unpersona.tick();
      unpersona.render();
    }

    this.hacerQLaCamaraSigaAlProtagonista();
  }

  toggleIluminacion() {
    this.iluminacion = !this.iluminacion;

    if (this.spriteIluminacion)
      this.spriteIluminacion.visible = this.iluminacion;

    for (let obj of [
      ...this.autos,
      ...this.personas,
      ...this.arboles,
      ...this.monumentos,
    ]) {
      obj.cambiarTintParaSimularIluminacion();
    }
  }

  hacerQLaCamaraSigaAlProtagonista() {
    if (!this.protagonista) return;
    this.containerPrincipal.x = -this.protagonista.posicion.x + this.width / 2;
    this.containerPrincipal.y = -this.protagonista.posicion.y + this.height / 2;
  }

  finDelJuego() {
    alert("Te moriste! fin del juego");
  }

  getPersonaRandom() {
    return this.personas[Math.floor(this.personas.length * Math.random())];
  }

  // asignarTargets() {
  //   for (let cone of this.personas) {
  //     cone.asignarTarget(this.getpersonaRandom());
  //   }
  // }

  // asignarElMouseComoTargetATodosLospersonas() {
  //   for (let cone of this.personas) {
  //     cone.asignarTarget(this.mouse);
  //   }
  // }

  // asignarPerseguidorRandomATodos() {
  //   for (let cone of this.personas) {
  //     cone.perseguidor = this.getpersonaRandom();
  //   }
  // }
  // asignarElMouseComoPerseguidorATodosLospersonas() {
  //   for (let cone of this.personas) {
  //     cone.perseguidor = this.mouse;
  //   }
  // }
}

class Auto extends EntidadEstatica {
  constructor(x, y, juego, tipo, scaleX) {
    super(x, y, juego);

    this.radio = 10;
    this.scaleX = scaleX || 1;
    this.tipo = tipo || Math.floor(Math.random() * 4) + 1;
    this.container.label = "auto" + this.id;
    this.isometric = true;
    this.crearSprite();
    this.juego.obstaculos.push(this);
    this.explotado = false;
    // this.actualizarMiPosicionEnLaGrilla();
  }
  recibirUnTiro(bala) {
    this.sacarChispasDeDondeREcibioUnDisparo(bala);
    if (this.explotado) return;
    this.vida -= 0.03;
    console.log("auto recibió un tiro", this.vida);
    if (this.vida <= 0) {
      this.explotar();
    }
  }
  cambiarTintParaSimularIluminacion() {
    if (this.explotado) this.container.tint = 0x666666;
    else super.cambiarTintParaSimularIluminacion();
  }

  explotar() {
    this.explotado = true;

    this.tirarChispasRandom();
    let cant = 20;

    for (let i = 0; i < cant; i++) {
      setTimeout(() => {
        this.tirarChispasRandom();
      }, i * 10);
    }

    setTimeout(() => {
      this.prenderseFuego();
    }, 10);

    this.juego.camara.shake(0.2, 7);
  }

  tirarChispasRandom() {
    this.juego.particleSystem.ponerChispasEnPosicion(
      this.getPosicionCentral(),
      {
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        z: -8 - Math.random() * 5,
      },
      Math.random() * 100 + 100
    );
  }

  prenderseFuego() {
    if (this.prendidoEnFuego) return;
    this.prendidoEnFuego = true;
    let pos = this.getPosicionCentral();

    this.juego.crearFuego(
      pos.x + this.radio * 0.66 + (Math.random() - 0.5) * this.radio * 0.4,
      pos.y - this.radio * 0.25 + (Math.random() - 0.5) * this.radio * 0.3,
      this.sprite.width * (0.25 + Math.random() * 0.1)
    );
    this.tirarChispasRandom();

    setTimeout(() => {
      this.juego.crearFuego(
        pos.x - this.radio + (Math.random() - 0.5) * this.radio * 0.5,
        pos.y + this.radio * 0.66 + (Math.random() - 0.5) * this.radio * 0.3,
        this.sprite.width * (0.2 + Math.random() * 0.1)
      );
      this.tirarChispasRandom();
    }, Math.random() * 50 + 20);

    setTimeout(() => {
      this.juego.crearFuego(
        pos.x + this.radio * 0.33 + (Math.random() - 0.5) * this.radio * 0.4,
        pos.y + this.radio * 1.25 + (Math.random() - 0.5) * this.radio * 0.3,
        this.sprite.width * (0.25 + Math.random() * 0.15)
      );
      this.tirarChispasRandom();
    }, Math.random() * 150 + 50);
  }

  async crearSprite() {
    // Load the full spritesheet
    const texture = await PIXI.Assets.load(
      "assets/pixelart/auto" + this.tipo + ".png"
    );

    // Create sprite with the specific car texture
    this.sprite = new PIXI.Sprite(texture);
    this.calcularRadio();
    this.sprite.anchor.set(0.5, 1);
    this.container.addChild(this.sprite);
    this.sprite.scale.x = this.scaleX;
    this.render();
  }

  tick() {}
}

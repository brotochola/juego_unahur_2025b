class Auto extends EntidadEstatica {
  constructor(x, y, juego, tipo, scaleX) {
    super(x, y, juego);
    this.vida = this.vidaMaxima = 10;
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
    console.log("auto recibió un tiro", this.id, this.vida);
    super.recibirUnTiro(bala);
  }
  cambiarTintParaSimularIluminacion() {
    if (this.explotado) this.container.tint = 0x666666;
    else super.cambiarTintParaSimularIluminacion();
  }
  recibirDanio(danio) {
    console.log("auto recibió danio", this.id, this.vida);
    super.recibirDanio(danio);
    if (this.explotado) return;
    if (this.vida <= 0) {
      this.explotar();
    }
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
      this.prenderseFuego(this.sprite.width);
    }, 10);

    this.juego.camara.shake(0.2, 7);
    this.empujarYHerirPersonasCerca(this.radio * 2);
  }

  tirarChispasRandom() {
    SoundManager.playSound("explosion_corta", 0.5, Math.random() * 0.5 + 1);
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

  async crearSprite() {
    // Load the full spritesheet
    const texture = await PIXI.Assets.load(
      "assets/pixelart/" +
        this.constructor.name.toLowerCase() +
        +this.tipo +
        ".png"
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

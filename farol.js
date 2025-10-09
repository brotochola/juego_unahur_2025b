class Farol extends EntidadEstatica {
  constructor(x, y, juego, tipo, scaleX) {
    super(x, y, juego);
    this.radioLuz = 900;
    this.radio = 11;
    this.alphaNormal = 0.6;
    this.tipo = tipo || Math.floor(Math.random() * 2) + 1;
    this.scaleX = scaleX || 1;
    this.container.label = "arbol" + this.id;
    this.crearSprite();
    this.juego.obstaculos.push(this);
    this.cantidadDeLuz = 1;
    this.estado = 1;
  }

  prender() {
    this.estado = 1;
  }
  apagar() {
    this.estado = 0;
  }

  actualizarSegunEstado() {
    if (!this.spriteDeLuz) return;
    this.spriteDeLuz.alpha = this.alphaNormal * this.estado;
    if (!this.spriteGradiente) return;

    this.spriteGradiente.alpha = this.estado;
  }

  calcularRadioLuz() {
    this.radioLuz = this.container.height ** 1.3;
  }
  crearSpriteDeLuz() {
    this.spriteDeLuz = crearSpriteConGradiente(this.radioLuz * 0.3);
    this.spriteDeLuz.zIndex = 2;
    this.spriteDeLuz.label = "spriteDeLuz";
    this.spriteDeLuz.alpha = this.alphaNormal;
    this.container.addChild(this.spriteDeLuz);
    this.spriteDeLuz.scale.y = 1;
    this.spriteDeLuz.tint = 0xffff99;
    this.spriteDeLuz.y = -this.sprite.height * 0.9;
  }

  async crearSprite() {
    this.sprite = new PIXI.Sprite(
      await PIXI.Assets.load("assets/pixelart/farol" + this.tipo + ".png")
    );
    this.sprite.anchor.set(0.5, 1);
    this.container.addChild(this.sprite);
    this.sprite.scale.x = this.scaleX;
    this.render();

    this.calcularRadioLuz();
    this.crearSpriteDeLuz();
  }

  tick() {
    //TODO: re hacer esto
    if (!this.spriteDeLuz) return;

    this.actualizarSegunEstado();
  }
}

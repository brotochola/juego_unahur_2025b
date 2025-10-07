class Farol extends EntidadEstatica {
  constructor(x, y, juego, tipo, scaleX) {
    super(x, y, juego);
    this.radioLuz = 900;
    this.radio = 11;
    this.tipo = tipo || Math.floor(Math.random() * 2) + 1;
    this.scaleX = scaleX || 1;
    this.container.label = "arbol" + this.id;
    this.crearSprite();
    this.juego.obstaculos.push(this);
  }
  calcularRadioLuz() {
    this.radioLuz = this.container.height ** 1.3;
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
  }

  tick() {}
}

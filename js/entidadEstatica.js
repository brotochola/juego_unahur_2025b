class EntidadEstatica extends GameObject {
  constructor(x, y, juego) {
    super(x, y, juego);
    this.radio = 20;
    this.sprite = null;

    this.render();
    this.actualizarMiPosicionEnLaGrilla();
  }
  calcularRadio() {
    this.radio = (this.sprite.width + Math.sqrt(this.sprite.height)) * 0.25;
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

  sacarChispasDeDondeREcibioUnDisparo(bala) {
    const velocidadInvertida = limitarVector(
      {
        x: -bala.velocidad.x,
        y: -bala.velocidad.y,
      },
      1
    );
    velocidadInvertida.z = -5 - Math.random() * 2;

    this.juego.sistemaDeIluminacion.crearFlashDeDisparoEn(
      bala.getPosicionCentral(),
      30,
      0.5,
      20
    );
    this.juego.particleSystem.ponerChispasEnPosicion(
      bala.getPosicionCentral(),
      velocidadInvertida
    );
  }
  recibirUnTiro(bala) {
    super.recibirUnTiro(bala);
    this.sacarChispasDeDondeREcibioUnDisparo(bala);
  }

  tick() {}
}

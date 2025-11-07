class Bondi extends Auto {
  constructor(x, y, juego, tipo, scaleX) {
    super(x, y, juego, tipo, scaleX);

    this.tipo = tipo || Math.floor(Math.random() * 4) + 1;
    this.container.label = "bondi" + this.id;
    this.vida = this.vidaMaxima = 12;
  }

  tick() {}
}

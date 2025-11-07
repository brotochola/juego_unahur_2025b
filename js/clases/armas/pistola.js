class Pistola extends Arma {
  constructor(owner) {
    super(owner);
    this.melee = false;
    this.range = -1;
    this.cooldown = 666;
    this.fuerzaDeAtaque = 1;
    this.owner = owner;
    this.radioLuzDisparo = 400;
    this.tiempoRecarga = 3000;
    this.maxBalas = 6;
    this.balasRestantes = 6;
    this.sonidoDeDisparo = "pistola_disparo";
  }
}

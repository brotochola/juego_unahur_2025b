class Ametralladora extends Arma {
  constructor(owner) {
    super(owner);
    this.melee = false;
    this.range = -1;
    this.cooldown = 100;
    this.fuerzaDeAtaque = 0.51;
    this.owner = owner;
    this.radioLuzDisparo = 100;
    this.tiempoRecarga = 1000;
    this.maxBalas = this.balasRestantes = 30;

    this.sonidoDeDisparo = "ametralladora_disparo";
  }
}

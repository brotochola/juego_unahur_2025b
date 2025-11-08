class LanzadorDeMolotov extends Arma {
  constructor(owner) {
    super(owner);
    this.melee = false;
    this.range = -1;
    this.cooldown = 500;
    this.fuerzaDeAtaque = 1;
    this.owner = owner;
    this.radioLuzDisparo = 0;
    this.tiempoRecarga = 500;
    this.maxBalas = this.balasRestantes = 1;

    this.sonidoDeDisparo = "lanzar_molotov";
  }

  disparar(targetPos) {
    if (this.lastTimeFired + this.cooldown > performance.now()) {
      return;
    }
    this.lastTimeFired = performance.now();
    // Crear una nueva molotov (no usa pooling)

    // Calcular dirección del lanzamiento (desde el protagonista hacia la posición)
    let posicionInicial = this.owner.getPosicionCentral();
    posicionInicial.z = this.owner.sprite.height * 0.4;

    const distancia = calcularDistancia(posicionInicial, targetPos);
    const ratio = distancia / this.owner.vision;

    if (ratio > 1)
      return console.warn("No se puede lanzar la molotov tan lejos");

    const velocidadInicial = calculateProjectileVelocity(
      posicionInicial,
      targetPos,
      Juego.CONFIG.gravedad.z,
      ratio * 0.33 + 0.7 //cuanto mas lejos, mas alto el lanzamiento
    );

    new Molotov(
      posicionInicial.x,
      posicionInicial.y,
      posicionInicial.z,
      this.owner.juego,
      velocidadInicial,
      this.owner
    );

    this.owner.animationFSM.setState("shoot");
    this.owner.juego.camara.shake(0.05, 3);
  }
}

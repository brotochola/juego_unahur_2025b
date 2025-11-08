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

  disparar(posicion) {
    if (this.lastTimeFired + this.cooldown > performance.now()) {
      return;
    }
    this.lastTimeFired = performance.now();
    // Crear una nueva molotov (no usa pooling)
    const molotov = new Molotov(0, 0, this.owner.juego);

    // Calcular dirección del lanzamiento (desde el protagonista hacia la posición)
    const posicionInicial = this.owner.getPosicionCentral();
    posicionInicial.y -= this.owner.sprite.height * 0.4;

    const dx = posicion.x - posicionInicial.x;
    const dy = posicion.y - posicionInicial.y;
    const anguloRadianes = Math.atan2(dy, dx);

    // Posición inicial (desde el centro del protagonista)

    // Calcular la distancia de separación para que la molotov empiece fuera del protagonista
    const distanciaSeparacion = (this.owner.radio + molotov.radio) * 2;

    // Desplazar la posición inicial en la dirección del lanzamiento
    const posX =
      posicionInicial.x + Math.cos(anguloRadianes) * distanciaSeparacion;
    const posY =
      posicionInicial.y + Math.sin(anguloRadianes) * distanciaSeparacion;

    molotov.activar(posX, posY, anguloRadianes, this);

    this.owner.animationFSM.setState("shoot");
    this.owner.juego.camara.shake(0.05, 3);
  }
}

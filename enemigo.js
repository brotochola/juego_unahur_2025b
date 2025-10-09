class Enemigo extends Persona {
  constructor(x, y, juego, bando) {
    super(x, y, juego);
    this.bando = bando || Math.floor(Math.random() * 3) + 2;
    this.crearSpritesheetAnimado(this.bando);
  }

  tick() {
    if (this.muerto) return;
    this.verificarSiEstoyMuerto();

    this.percibirEntorno();
    //
    this.cohesion();
    this.alineacion();
    this.separacion();

    this.perseguir();

    this.noChocarConObstaculos();
    this.repelerSuavementeObstaculos();
    this.pegarSiEstaEnMiRango();

    this.aplicarFisica();

    this.calcularAnguloYVelocidadLineal();

    if (this.enemigoMasCerca) {
      this.asignarTarget(this.enemigoMasCerca);
    }
  }
}

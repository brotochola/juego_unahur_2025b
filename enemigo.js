class Enemigo extends Persona {
  constructor(x, y, juego, bando) {
    super(x, y, juego);
    this.bando = bando || Math.floor(Math.random() * 3) + 2;
    this.crearSpritesheetAnimado(this.bando);
  }

  tick() {
    if (this.muerto) return;
    this.verificarSiEstoyMuerto();

    this.enemigos = this.buscarPersonasQueNoSonDeMiBando();
    this.amigos = this.buscarPersonasDeMiBando();
    this.enemigoMasCerca = this.buscarEnemigoMasCerca();
    this.buscarObstaculosBienCerquitaMio();

    //
    this.cohesion();
    this.alineacion();
    this.separacion();
    // this.escapar();
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

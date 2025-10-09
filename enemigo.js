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

    // si los enemigos estan por morir y somos muchos mas nosotros
    //se pasan de bando
    this.evaluarSiMeConviertoEnAmigo();

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

  evaluarSiMeConviertoEnAmigo() {
    if (this.vida > 0.15) return;
    if (this.enemigosCerca.length < this.amigosCerca.length) return;
    if (Math.random() > 0.3) return;

    this.convertirEnAmigo();
  }

  convertirEnAmigo() {
    const pos = this.posicion;
    const vida = this.vida;
    const coraje = this.coraje;
    const vision = this.vision;
    const id = this.id;

    this.borrar();
    const amigo = this.juego.crearUnAmigo(pos.x, pos.y);
    amigo.id = id;
    amigo.vida = vida;
    amigo.coraje = coraje;
    amigo.vision = vision;
  }
}

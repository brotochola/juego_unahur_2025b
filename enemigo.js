class Enemigo extends Persona {
  constructor(x, y, juego, bando) {
    super(x, y, juego);
    this.bando = bando || Math.floor(Math.random() * 3) + 2;
    this.crearSpritesheetAnimado(this.bando);
    this.esperarAQueTengaSpriteCargado(() => {
      this.crearBarritaVida();
    });
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
    if (!this.enemigoMasCerca) return;

    this.pasarseDeBando(this.enemigoMasCerca.bando);
  }

  pasarseDeBando(cualBando) {
    const pos = this.posicion;

    this.borrar();
    let amigo;
    if (cualBando == 1) {
      amigo = this.juego.crearUnAmigo(pos.x, pos.y);
    } else {
      amigo = this.juego.crearUnEnemigo(cualBando, pos.x, pos.y);
    }

    amigo.id = this.id;
    amigo.vida = this.vida;
    amigo.coraje = this.coraje;
    amigo.vision = this.vision;
    amigo.recienConvertido = true;
    setTimeout(() => {
      delete amigo.recienConvertido;
    }, 1000);
  }
}

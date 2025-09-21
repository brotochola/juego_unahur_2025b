class Protagonista extends Persona {
  constructor(x, y, juego) {
    super(x, y, juego);
    this.vida = 9287364928348;
    this.vision = Infinity;
    this.bando = 1;
    this.crearSpritesheetAnimado(this.bando);
  }

  morir() {
    super.morir();
    // this.juego.finDelJuego();
  }
  recibirDanio(danio) {
    super.recibirDanio(danio);
  }

  tick() {
    this.irAlTarget();

    this.aplicarFisica();

    this.verificarSiEstoyMuerto();

    this.enemigos = this.buscarPersonasQueNoSonDeMiBando();
    this.amigos = this.buscarPersonasDeMiBando();
    this.enemigoMasCerca = this.buscarEnemigoMasCerca();

    this.calcularAnguloYVelocidadLineal();
  }

  irAlTarget() {
    if (!this.juego.mouse.up) return;
    const difX = this.juego.mouse.up.x - this.posicion.x;
    const difY = this.juego.mouse.up.y - this.posicion.y;
    const dist = calcularDistancia(this.posicion, this.juego.mouse.up);

    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    const distanciaParaEmpezarABajarLaVelocidad = this.rangoDeAtaque * 3;
    if (dist < distanciaParaEmpezarABajarLaVelocidad) {
      const factor = (dist / distanciaParaEmpezarABajarLaVelocidad) ** 3;
      vectorNuevo.x *= factor;
      vectorNuevo.y *= factor;
    }

    this.aceleracion.x += vectorNuevo.x;
    this.aceleracion.y += vectorNuevo.y;
  }
}

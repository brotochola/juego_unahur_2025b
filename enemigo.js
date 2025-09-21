class Enemigo extends Persona {
  constructor(x, y, juego, bando) {
    super(x, y, juego);
    this.bando = bando || Math.floor(Math.random() * 3) + 2;
    this.crearSpritesheetAnimado(this.bando);
  }

  tick() {
    super.tick();
    this.asignarTarget(this.enemigoMasCerca);
  }
}

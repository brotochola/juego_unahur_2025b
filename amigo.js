class Amigo extends Persona {
  constructor(x, y, juego) {
    super(x, y, juego);

    this.aceleracionMaxima = 0.1 + Math.random() * 0.05;
    this.velocidadMaxima = 2 + Math.random() * 1;
    this.bando = 1;

    // Parámetros para el Arrival Behaviour
    this.radioLlegadaAlLider = 50; // Radio donde empieza a desacelerar
    this.radioParaBajarLaVelocidad = 500;
    this.factorSeguirAlLider = 0.25;
    this.crearSpritesheetAnimado(this.bando);
  }

  seguirAlLider() {
    if (!this.juego.protagonista) return;
    const dist = calcularDistancia(
      this.posicion,
      this.juego.protagonista.posicion
    );
    if (dist > this.vision) return;

    const difX = this.juego.protagonista.posicion.x - this.posicion.x;
    const difY = this.juego.protagonista.posicion.y - this.posicion.y;

    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    if (dist < this.radioLlegadaAlLider) {
      vectorNuevo.x *= -2;
      vectorNuevo.y *= -2;
    } else if (
      dist > this.radioLlegadaAlLider &&
      dist < this.radioParaBajarLaVelocidad
    ) {
      // Reducción más pronunciada cuando están muy cerca
      const factor = (dist / this.radioParaBajarLaVelocidad) ** 2;

      vectorNuevo.x *= factor;
      vectorNuevo.y *= factor;
    }

    this.aceleracion.x += vectorNuevo.x * this.factorSeguirAlLider;
    this.aceleracion.y += vectorNuevo.y * this.factorSeguirAlLider;
  }

  tick() {
    this.seguirAlLider();
    super.tick();
    if (this.enemigoMasCerca) {
      this.asignarTarget(this.enemigoMasCerca);
    }
  }
}

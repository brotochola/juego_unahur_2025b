class Amigo extends Persona {
  constructor(x, y, juego) {
    super(x, y, juego);

    this.bando = 1;

    // Parámetros para el Arrival Behaviour
    this.radioLlegadaAlLider = 80; // Radio donde empieza a desacelerar
    this.radioParaBajarLaVelocidad = this.vision * 0.5;
    this.factorSeguirAlLider = 0.63;
    this.factorCohesion = 0.1; //a los amigos les bajo la cohesion pq igual estan siguiendo al lider
    this.factorAlineacion = 0.05; //a los amigos les bajo la alineacion pq igual estan siguiendo al lider
    this.crearSpritesheetAnimado(this.bando);
    this.crearFSMparaComportamientos();
    this.esperarAQueTengaSpriteCargado(() => {
      this.crearBarritaVida();
    });
  }

  crearFSMparaComportamientos() {
    this.behaviorFSM = new FSM(this, {
      states: {
        idle: AmigoIdleBehaviorState,
        enCombate: AmigoEnCombateBehaviorState,
        pasadoDeBando: PasadoDeBandoBehaviorState,
        huyendo: AmigoHuyendoBehaviorState,
      },
      initialState: "idle",
    });
  }

  seguirAlLider() {
    if (!this.juego.protagonista) return;

    // Si está muy lejos, no hace nada
    if (
      laDistanciaEntreDosObjetosEsMayorQue(
        this.posicion,
        this.juego.protagonista.posicion,
        this.vision
      )
    )
      return;

    const difX = this.juego.protagonista.posicion.x - this.posicion.x;
    const difY = this.juego.protagonista.posicion.y - this.posicion.y;

    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    if (
      laDistanciaEntreDosObjetosEsMenorQue(
        this.posicion,
        this.juego.protagonista.posicion,
        this.radioLlegadaAlLider
      )
    ) {
      //esta muy cerca, se aleja
      const dist = calcularDistancia(
        this.posicion,
        this.juego.protagonista.posicion
      );
      vectorNuevo.x *= -this.radioLlegadaAlLider / dist;
      vectorNuevo.y *= -this.radioLlegadaAlLider / dist;
    } else if (
      laDistanciaEntreDosObjetosEstaEntreDosDistancias(
        this.posicion,
        this.juego.protagonista.posicion,
        this.radioLlegadaAlLider,
        this.radioParaBajarLaVelocidad
      )
    ) {
      //si estoy a una distancia q no es al ladito y tampoco es tan lejos.
      return;

      // // Reducción más pronunciada cuando están muy cerca
      // const factor = (dist / this.radioParaBajarLaVelocidad) ** 3;

      // vectorNuevo.x *= factor;
      // vectorNuevo.y *= factor;
    } else if (
      laDistanciaEntreDosObjetosEstaEntreDosDistancias(
        this.posicion,
        this.juego.protagonista.posicion,
        this.radioParaBajarLaVelocidad,
        this.vision
      )
    ) {
      //esta lejos, va de una
    }

    this.aceleracion.x += vectorNuevo.x * this.factorSeguirAlLider;
    this.aceleracion.y += vectorNuevo.y * this.factorSeguirAlLider;
  }

  tick() {
    if (this.muerto) return;

    this.verificarSiEstoyMuerto();
    this.actualizarMiPosicionEnLaGrilla();
    if (this.behaviorFSM) this.behaviorFSM.update();
  }
}

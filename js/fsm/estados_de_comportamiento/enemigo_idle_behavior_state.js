class EnemigoIdleBehaviorState extends FSMState {
  onEnter() {
    this.owner.hablar("😊");
  }
  onExit() {}
  onUpdate() {
    super.onUpdate();

    this.owner.percibirEntorno();

    this.owner.cohesion();

    this.owner.separacion();

    this.owner.noChocarConObstaculos();
    this.owner.repelerSuavementeObstaculos();

    //moverse
    this.owner.aplicarFisica();

    this.owner.calcularAnguloYVelocidadLineal();

    if (this.owner.enemigoMasCerca) {
      this.owner.asignarTarget(this.owner.enemigoMasCerca);
    }
  }

  doChecks() {
    if (this.owner.enemigoMasCerca) {
      if (this.owner.vida < 0.5) {
        this.fsm.setState("huyendo");
      } else {
        this.fsm.setState("enCombate");
      }
    }
  }
}

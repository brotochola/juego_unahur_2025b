class AmigoHuyendoBehaviorState extends FSMState {
  onEnter() {
    this.owner.hablar("😨");
    this.originalFactorEscapar = this.owner.factorEscapar;
    this.originalFactorSeguirAlLider = this.owner.factorSeguirAlLider;
    this.owner.factorEscapar = 0.5;
    this.owner.factorSeguirAlLider = 0.75;
  }
  onExit() {
    this.owner.factorEscapar = this.originalFactorEscapar;
    this.owner.factorSeguirAlLider = this.originalFactorSeguirAlLider;
  }
  onUpdate() {
    super.onUpdate();

    this.owner.percibirEntorno();

    this.owner.separacion();

    this.owner.seguirAlLider();
    this.owner.cohesion();

    // this.owner.escapar();
    this.owner.repelerEnemigos();

    // this.owner.perseguir();

    this.owner.noChocarConObstaculos();
    // this.owner.repelerSuavementeObstaculos();

    // this.owner.pegarSiEstaEnMiRango();

    //moverse
    this.owner.aplicarFisica();

    this.owner.calcularAnguloYVelocidadLineal();
  }

  doChecks() {
    if (this.owner.vida > 0.5) {
      this.fsm.setState("idle");
    }
  }
}

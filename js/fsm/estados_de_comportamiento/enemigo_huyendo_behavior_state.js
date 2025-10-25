class EnemigoHuyendoBehaviorState extends FSMState {
  onEnter() {
    this.owner.hablar("😨");
    this.originalFactorEscapar = this.owner.factorEscapar;
    this.owner.factorEscapar = 0.5;
  }
  onExit() {
    this.owner.factorEscapar = this.originalFactorEscapar;
  }
  onUpdate() {
    super.onUpdate();

    this.owner.percibirEntorno();
    this.owner.evaluarSiMeConviertoEnAmigo();

    this.owner.separacion();
    // this.owner.alineacion();

    // this.owner.cohesion();

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

class AmigoIdleBehaviorState extends FSMState {
  onUpdate() {
    super.onUpdate();

    this.owner.percibirEntorno();

    this.owner.separacion();

    this.owner.seguirAlLider();
    this.owner.cohesion();

    // this.owner.perseguir();

    this.owner.noChocarConObstaculos();
    this.owner.repelerSuavementeObstaculos();

    // this.owner.pegarSiEstaEnMiRango();

    //moverse
    this.owner.aplicarFisica();

    this.owner.calcularAnguloYVelocidadLineal();
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

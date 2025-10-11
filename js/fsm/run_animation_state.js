class RunAnimationState extends FSMState {
  onEnter() {
    this.owner.sprite.changeAnimation("run");
  }
  onExit() {}

  doChecks() {
    if (this.owner.velocidadLineal < this.owner.velocidadMaxima * 0.7) {
      this.fsm.setState("walk");
    }
  }
}

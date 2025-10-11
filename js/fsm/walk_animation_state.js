class WalkAnimationState extends FSMState {
  onEnter() {
    this.owner.sprite.changeAnimation("walk");
  }

  doChecks() {
    if (this.owner.velocidadLineal > this.owner.velocidadMaxima * 0.7) {
      this.fsm.setState("run");
    } else if (this.owner.velocidadLineal < 0.1) {
      this.fsm.setState("idle");
    }
  }
}

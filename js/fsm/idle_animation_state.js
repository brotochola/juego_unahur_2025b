class IdleAnimationState extends FSMState {
  onEnter() {
    // this.owner.sprite.changeAnimation("idle");
  }
  onExit() {}
  onUpdate() {
    if (!this.owner.sprite) debugger;
    if (this.owner.noPuedoPegarPeroEstoyEnCombate) {
      this.owner.sprite.changeAnimation("combat");
    } else {
      this.owner.sprite.changeAnimation("idle");
    }
    super.onUpdate();
  }

  doChecks() {
    if (this.owner.velocidadLineal > 0.1) {
      this.fsm.setState("walk");
    }
  }
}

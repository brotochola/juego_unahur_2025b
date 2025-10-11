class PegarAnimationState extends FSMState {
  onEnter() {
    this.currentFrame = 0;
    this.owner.sprite.changeAnimation("slash");
  }
  onExit() {}

  onUpdate() {
    super.onUpdate();

    if (this.currentFrame > 6) {
      this.fsm.setState("idle");
    }
  }

  doChecks() {}
}

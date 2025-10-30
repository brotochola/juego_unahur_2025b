class ShootAnimationState extends FSMState {
  onEnter() {
    this.owner.sprite.changeAnimation("shoot");
    this.owner.sprite.animationSpeed = 2;
    this.owner.sprite.loop = true;
    this.counter = 0;
  }
  onExit() {}

  onUpdate() {
    super.onUpdate();

    this.counter++;
    console.log(this.counter);
  }

  doChecks() {
    if (this.counter > 13) {
      this.fsm.setState("idle");
    }
  }
}

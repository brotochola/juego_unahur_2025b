class ConvertirseAnimationState extends FSMState {
  onEnter() {
    console.log("on enter convertirse", this.owner.nombre);
    this.currentFrame = 0;
    this.owner.sprite.changeAnimation("spellcast");
  }
  onExit() {}
  onUpdate() {
    if (!this.owner.sprite) debugger;
    this.owner.sprite.changeAnimation("spellcast");
    console.log("on update convertirse", this.owner.nombre, this.currentFrame);
    if (this.currentFrame > 7) {
      this.fsm.setState("idle");
    }
    super.onUpdate();
  }
}

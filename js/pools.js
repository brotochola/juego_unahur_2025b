class Pools {
  static containers = [];
  static sprites = [];
  static crearContainer() {
    const container = new PIXI.Container();
    this.containers.push(container);
    return container;
  }
  static crearSprite(texture) {
    const sprite = new PIXI.Sprite(texture);
    this.sprites.push(sprite);
    return sprite;
  }
}

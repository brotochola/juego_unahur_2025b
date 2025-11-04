class Fuego extends EntidadEstatica {
  constructor(x, y, radio, juego) {
    super(x, y, juego);
    this.color = 0xffaa00;
    this.radio = radio || 25;
    this.cantidadDeLuz = 1;
    this.radioLuz = 1; //solo lo inicializo en 1, pero dps se calcula
    juego.fuegos.push(this);
    juego.cosasQueDanLuz.push(this);
    juego.obstaculos.push(this);
    this.container.label = "fuego" + this.id;
    console.log("creando fuego en", x, y);

    this.crearSprite().then(() => {
      console.log("sprite creado", this.id, this.sprite.width);
      // IMPORTANTE: Como radioLuz se calcula DESPUÉS de agregarnos a la grilla,
      // debemos notificar manualmente a la celda que somos un emisor de luz

      this.actualizarMiPosicionEnLaGrilla();
      this.celdaActual.agregarAlSetPorClaseYTipo(this);
    });

    // Para la animación de skew
    this.offsetSkew = Math.random() * Math.PI * 2; // Offset aleatorio para que no todos se muevan igual
    this.velocidadSkew = 0.2 + Math.random() * 0.1; // Velocidad muy lenta
    this.cantidadDeSkew = 0.05 + Math.random() * 0.05;

    this.offsetSkew2 = Math.random() * Math.PI * 2; // Offset aleatorio para que no todos se muevan igual
    this.velocidadSkew2 = 0.1 + Math.random() * 0.05; // Velocidad muy lenta
    this.cantidadDeSkew2 = 0.01 + Math.random() * 0.01;

    this.escala = Math.random() * 0.5 + 0.5;
    this.invalidarCacheDeFarolesCercanosDeLosObjetosCercanos(); //para que los objetos sepan que hay un nuevo fuego
  }

  async crearSprite() {
    const json = await PIXI.Assets.get("assets/pixelart/fuego/fuego.json");

    this.sprite = new PIXI.AnimatedSprite(json.animations.fire);
    this.sprite.anchor.set(0.5, 1);
    this.container.addChild(this.sprite);
    this.sprite.animationSpeed = 0.5 + Math.random() * 0.1;
    this.sprite.play();
    this.sprite.alpha = 0.9 - Math.random() * 0.3;
    this.sprite.scale.y = this.escala;
    this.sprite.scale.x = Math.random() > 0.5 ? this.escala : -this.escala;
    this.render();
    this.sprite.width = this.radio * 4;
    this.sprite.scale.y = Math.abs(this.sprite.scale.x);

    this.radioLuzOriginal = this.calcularRadioLuz();
    this.crearSpriteDeLuz();

    return 1;
  }

  cambiarTintParaSimularIluminacion() {}

  tick() {
    if (this.sprite) {
      if (
        this.juego.sistemaDeIluminacion &&
        this.radioLuzOriginal !== undefined
      ) {
        this.radioLuz = this.radioLuzOriginal * (Math.random() * 0.2 + 0.9);
      }
      // Incrementar el tiempo lentamente

      // Aplicar skew suave usando seno (-0.05 a 0.05 radianes, muy sutil)
      this.sprite.skew.x =
        Math.sin(
          this.juego.ahora * 0.01 * this.velocidadSkew + this.offsetSkew
        ) *
          this.cantidadDeSkew +
        Math.sin(
          this.juego.ahora * 0.03 * this.velocidadSkew2 + this.offsetSkew2
        ) *
          this.cantidadDeSkew2 *
          0.3;
    }
  }
}

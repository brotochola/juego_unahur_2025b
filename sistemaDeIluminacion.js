class SistemaDeIluminacion {
  constructor(juego) {
    this.juego = juego;
    this.activo = false;
    this.inicializado = false;
    this.graficoSombrasProyectadas = null;
    this.containerDeIluminacion = null;
    this.blurParaElGraficoDeSombrasProyectadas = null;

    this.inicializar();
  }
  crearGraficoSombrasProyectadas() {
    // Crear el gráfico de sombras proyectadas
    this.graficoSombrasProyectadas = new PIXI.Graphics();
    this.graficoSombrasProyectadas.zIndex = Z_INDEX.graficoSombrasProyectadas;
    this.graficoSombrasProyectadas.label = "graficoSombrasProyectadas";
    this.graficoSombrasProyectadas.blendMode = "multiply";
    this.juego.pixiApp.stage.addChild(this.graficoSombrasProyectadas);

    // Crear el filtro de blur para las sombras
    this.blurParaElGraficoDeSombrasProyectadas = new PIXI.BlurFilter({
      strength: 8,
      quality: 2,
      kernelSize: 5,
    });
    this.graficoSombrasProyectadas.filters = [
      this.blurParaElGraficoDeSombrasProyectadas,
    ];
  }

  inicializar() {
    // Crear el sistema de iluminación después de un pequeño delay
    // para asegurarse de que los faroles estén cargados
    setTimeout(() => {
      this.crearContainerDeIluminacion();
      this.crearGraficoSombrasProyectadas();
      this.inicializado = true;
      this.toggle();
    }, 1000);
  }

  crearContainerDeIluminacion() {
    this.containerDeIluminacion = new PIXI.Container();
    this.containerDeIluminacion.label = "containerDeIluminacion";
    this.containerDeIluminacion.zIndex = Z_INDEX.containerIluminacion;
    this.containerDeIluminacion.sortableChildren = true; // Para que funcione el zIndex

    this.juego.pixiApp.stage.addChild(this.containerDeIluminacion);

    // Primero crear el sprite negro de fondo
    const spriteNegro = crearSpriteNegro(this.juego.width, this.juego.height);
    spriteNegro.label = "spriteNegro";
    spriteNegro.zIndex = 1; // Debajo del gradiente
    this.containerDeIluminacion.addChild(spriteNegro);

    // Crear sprites individuales para cada farol usando sus propios métodos
    for (let farol of this.juego.faroles) {
      farol.spriteGradiente = crearSpriteConGradiente(farol.radioLuz);
      const posicionEnPantalla = farol.getPosicionEnPantalla();
      farol.spriteGradiente.x = posicionEnPantalla.x;
      farol.spriteGradiente.y = posicionEnPantalla.y;
      farol.spriteGradiente.scale.set(this.juego.zoom);
      farol.spriteGradiente.zIndex = 2; // Encima del sprite negro

      this.containerDeIluminacion.addChild(farol.spriteGradiente);
    }

    this.containerDeIluminacion.zIndex = 2;
    this.containerDeIluminacion.alpha = 0.99;
    this.containerDeIluminacion.cacheAsBitmap = true;
    this.containerDeIluminacion.blendMode = "multiply";

    // Establecer la visibilidad inicial
    this.containerDeIluminacion.visible = this.activo;
  }

  tick() {
    // Limpiar el gráfico de sombras proyectadas
    if (this.graficoSombrasProyectadas) {
      this.graficoSombrasProyectadas.clear();
    }

    // Si la iluminación está activa, actualizar las líneas de los faroles
    if (this.activo) {
      this.containerDeIluminacion.cacheAsBitmap = false;
      for (let farol of this.juego.faroles) {
        if (!farol.estoyVisibleEnPantalla(1.33)) {
          farol.spriteGradiente.visible = false;
          continue;
        }

        farol.spriteGradiente.visible = true;
        const posicionEnPantalla = farol.getPosicionEnPantalla();
        farol.spriteGradiente.x = posicionEnPantalla.x;
        farol.spriteGradiente.y = posicionEnPantalla.y;
        farol.spriteGradiente.scale.set(this.juego.zoom);

        this.actualizarSombrasProyectadas(farol);
      }
      this.containerDeIluminacion.cacheAsBitmap = true;
    }
  }

  toggle() {
    this.activo = !this.activo;

    // Alternar visibilidad del sistema de sprites individuales
    if (this.containerDeIluminacion) {
      this.containerDeIluminacion.visible = this.activo;
    }

    // Cambiar el tint de todos los objetos para simular iluminación
    for (let obj of [
      ...this.juego.autos,
      ...this.juego.personas,
      ...this.juego.arboles,
      ...this.juego.monumentos,
    ]) {
      obj.cambiarTintParaSimularIluminacion();
    }
  }

  // Método para obtener el estado actual de la iluminación
  isActivo() {
    return this.activo;
  }

  // Método para establecer el estado de la iluminación
  setActivo(valor) {
    if (this.activo !== valor) {
      this.toggle();
    }
  }

  actualizarSombrasProyectadas(farol) {
    // Obtener todos los objetos que pueden estar iluminados
    const todosLosObjetos = [
      ...this.juego.personas,
      //   ...this.juego.arboles,
      //   ...this.juego.autos,
      // ...this.juego.monumentos,
      // ...this.juego.objetosInanimados,
    ];

    const posDelFarol = farol.getPosicionEnPantalla();
    const zoom = this.juego.zoom;

    // Dibujar líneas a todos los objetos dentro del radioLuz
    for (let objeto of todosLosObjetos) {
      // Evitar dibujarse líneas a sí mismo si está en objetosInanimados
      if (objeto === farol) continue;
      if (!objeto.estoyVisibleEnPantalla(1)) continue;

      // Calcular distancia desde el farol hasta el objeto
      const distancia = calcularDistancia(farol.posicion, objeto.posicion);

      // Si el objeto está dentro del radioLuz, dibujar línea
      if (distancia <= farol.radioLuz) {
        // Calcular puntos tangentes al círculo del objeto
        const dx = objeto.posicion.x - farol.posicion.x;
        const dy = objeto.posicion.y - farol.posicion.y;
        const anguloAlCentro = Math.atan2(dy, dx);

        // Ángulo de las tangentes usando trigonometría: sin(θ) = radio_opuesto / hipotenusa
        const anguloTangente = Math.asin((objeto.radio * 0.66) / distancia);

        // Calcular los dos puntos tangentes
        const angulo1 = anguloAlCentro + anguloTangente;
        const angulo2 = anguloAlCentro - anguloTangente;

        // Distancia desde el farol hasta los puntos tangentes en el círculo
        const distanciaHastaTangente = Math.sqrt(
          distancia * distancia - objeto.radio * objeto.radio
        );
        // const posDelObjetoEnPantalla = objeto.getPosicionEnPantalla();
        // Puntos tangentes en el círculo del objeto (desde el farol)
        // Multiplicar distancias por zoom para convertir a coordenadas de pantalla
        const puntoTangente1x =
          posDelFarol.x + Math.cos(angulo1) * distanciaHastaTangente * zoom;
        const puntoTangente1y =
          posDelFarol.y + Math.sin(angulo1) * distanciaHastaTangente * zoom;
        const puntoTangente2x =
          posDelFarol.x + Math.cos(angulo2) * distanciaHastaTangente * zoom;
        const puntoTangente2y =
          posDelFarol.y + Math.sin(angulo2) * distanciaHastaTangente * zoom;

        // Extender las líneas tangentes hacia el lado opuesto al farol por la misma distancia
        const factorExtensionDeLaSombra =
          objeto.container.height * 0.66 + distancia * 0.1;
        const puntoFinal1x =
          puntoTangente1x +
          Math.cos(angulo1) * factorExtensionDeLaSombra * zoom;
        const puntoFinal1y =
          puntoTangente1y +
          Math.sin(angulo1) * factorExtensionDeLaSombra * zoom;
        const puntoFinal2x =
          puntoTangente2x +
          Math.cos(angulo2) * factorExtensionDeLaSombra * zoom;
        const puntoFinal2y =
          puntoTangente2y +
          Math.sin(angulo2) * factorExtensionDeLaSombra * zoom;

        // Dibujar el trapecio de sombra proyectada

        // Calcular punto de control para la curva (más alejado del farol)
        const centroX = (puntoFinal1x + puntoFinal2x) / 2;
        const centroY = (puntoFinal1y + puntoFinal2y) / 2;
        const extensionCurva = objeto.radio + distancia * 0.15; // Factor para que la curva sea sutil
        const puntoControlX =
          centroX + Math.cos(anguloAlCentro) * extensionCurva * zoom;
        const puntoControlY =
          centroY + Math.sin(anguloAlCentro) * extensionCurva * zoom;

        this.graficoSombrasProyectadas.moveTo(puntoTangente1x, puntoTangente1y);
        this.graficoSombrasProyectadas.lineTo(puntoFinal1x, puntoFinal1y);

        // Dibujar curva en lugar de línea recta para el lado alejado
        this.graficoSombrasProyectadas.quadraticCurveTo(
          puntoControlX,
          puntoControlY, // Punto de control de la curva
          puntoFinal2x,
          puntoFinal2y // Punto final de la curva
        );

        this.graficoSombrasProyectadas.lineTo(puntoTangente2x, puntoTangente2y);

        // Calcular punto de control para la curva del lado cercano al farol
        const centroTangenteX = (puntoTangente1x + puntoTangente2x) / 2;
        const centroTangenteY = (puntoTangente1y + puntoTangente2y) / 2;
        const extensionCurvaCercana = objeto.radio; // Curva más sutil en el lado cercano
        const puntoControlCercanoX =
          centroTangenteX -
          Math.cos(anguloAlCentro) * extensionCurvaCercana * zoom;
        const puntoControlCercanoY =
          centroTangenteY -
          Math.sin(anguloAlCentro) * extensionCurvaCercana * zoom;

        // Dibujar curva para conectar de vuelta al punto inicial
        this.graficoSombrasProyectadas.quadraticCurveTo(
          puntoControlCercanoX,
          puntoControlCercanoY, // Punto de control de la curva cercana
          puntoTangente1x,
          puntoTangente1y // Punto inicial
        );

        let cantDeSombra = (farol.radioLuz ** 1.5 / distancia ** 2) * 0.33;
        if (cantDeSombra > 0.33) cantDeSombra = 0.33;
        if (cantDeSombra < 0) cantDeSombra = 0;

        this.graficoSombrasProyectadas.fill({
          color: 0x000000,
          alpha: cantDeSombra,
        });

        // if (this.juego.stroke) this.graficoSombrasProyectadas.stroke();
      }
    }
  }
}

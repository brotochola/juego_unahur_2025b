class SistemaDeIluminacion {
  constructor(juego) {
    this.juego = juego;
    this.activo = false;
    this.inicializado = false;
    this.graficoSombrasProyectadas = null;
    this.renderTexture = null;
    this.spriteDeIluminacion = null;
    this.containerParaRenderizar = null;
    this.spriteNegro = null;
    this.blurParaElGraficoDeSombrasProyectadas = null;

    // NUEVO: Sistema de sombras con texturas (mucho más eficiente)
    this.texturaSombra = null;
    this.poolSombras = []; // Pool de sprites de sombra reutilizables
    this.sombrasActivas = []; // Sprites actualmente en uso

    this.inicializar();

    this.numeroDeDia = 0;
    this.minutoDelDia = 0;
    this.minutosPorDia = 1440;
    this.cantidadDeLuzDelDia = 0.5;
  }

  inicializar() {
    // Crear el sistema de iluminación después de un pequeño delay
    // para asegurarse de que los faroles estén cargados
    setTimeout(() => {
      this.crearSistemaDeIluminacionConRenderTexture();

      // NUEVO: Crear textura de sombra pre-renderizada
      this.crearTexturaDeSombra();

      this.pregenerarPoolDeSombras();

      this.inicializado = true;
      this.toggle();
    }, 1000);
  }

  /**
   * OPTIMIZACIÓN: Pre-generar textura de sombra
   * Esta textura se reutiliza para todas las sombras, solo cambiando
   * posición, rotación, escala y alpha
   */
  crearTexturaDeSombra() {
    // Factor de escala para efecto pixelado (0.1 = 10% del tamaño original)
    // Valores recomendados: 0.05-0.2 (más pequeño = más pixelado)

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Tamaño base de la sombra reducido para efecto pixelado
    const widthBase = 240;
    const heightBase = 340;
    const width = widthBase * Juego.CONFIG.escala_textura_sombras;
    const height = heightBase * Juego.CONFIG.escala_textura_sombras;

    canvas.width = width;
    canvas.height = height;

    // Desactivar antialiasing del contexto para efecto más pixelado
    ctx.imageSmoothingEnabled = false;

    // APLICAR BLUR ANTES DE DIBUJAR (ajustado por escala)
    const blurSize = Math.max(1, 12 * Juego.CONFIG.escala_textura_sombras);
    ctx.filter = `blur(${blurSize}px)`;

    // Crear gradiente cónico/trapezoidal (ajustado por escala)
    const margen = 20 * Juego.CONFIG.escala_textura_sombras;
    const gradient = ctx.createLinearGradient(
      width / 2,
      margen,
      width / 2,
      height - margen
    );

    // Gradiente de negro opaco a transparente
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.7)"); // Cerca del objeto
    gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.5)");
    gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.25)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Lejos, transparente

    // Dibujar forma trapezoidal CON CURVAS para simular perspectiva
    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Puntos de referencia (ajustados por escala)
    const topLeft = { x: width * 0.4, y: margen };
    const topRight = { x: width * 0.6, y: margen };
    const bottomLeft = { x: width * 0.25, y: height - margen };
    const bottomRight = { x: width * 0.75, y: height - margen };

    // Comenzar desde el punto superior izquierdo
    ctx.moveTo(topLeft.x, topLeft.y);

    // TECHO (semicírculo convexo hacia arriba) - más cerca del objeto
    const topCenterX = (topLeft.x + topRight.x) / 2;
    const topCenterY = topLeft.y - 10 * Juego.CONFIG.escala_textura_sombras;
    ctx.quadraticCurveTo(topCenterX, topCenterY, topRight.x, topRight.y);

    // Lado derecho (línea recta)
    ctx.lineTo(bottomRight.x, bottomRight.y);

    // BASE (semicírculo convexo hacia abajo) - más lejos del objeto
    const bottomCenterX = (bottomLeft.x + bottomRight.x) / 2;
    const bottomCenterY =
      bottomLeft.y + 20 * Juego.CONFIG.escala_textura_sombras;
    ctx.quadraticCurveTo(
      bottomCenterX,
      bottomCenterY,
      bottomLeft.x,
      bottomLeft.y
    );

    // Lado izquierdo (línea recta para cerrar)
    ctx.lineTo(topLeft.x, topLeft.y);

    ctx.closePath();
    ctx.fill();

    // Resetear el filtro
    ctx.filter = "none";

    // Crear textura PIXI desde canvas
    this.texturaSombra = PIXI.Texture.from(canvas);

    // CRÍTICO: Desactivar smoothing en la textura base para efecto pixelado
    this.texturaSombra.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    console.log(
      `✅ Textura pixelada de sombra creada (${width.toFixed(
        1
      )}x${height.toFixed(1)}px)`
    );
  }

  /**
   * Pre-generar pool de sprites de sombra para reutilizar
   * Esto evita crear/destruir sprites constantemente
   */
  pregenerarPoolDeSombras() {
    // Calcular tamaño del pool dinámicamente basado en cantidad de luces y personajes
    const cantidadFaroles = this.juego.cosasQueDanLuz.length || 10;
    const maxSombrasPorFarol = Juego.CONFIG.max_sombras_por_farol || 15;

    // Pool size = faroles × sombras por farol, con un mínimo de 100
    const poolSize = Math.max(100, cantidadFaroles * maxSombrasPorFarol);

    for (let i = 0; i < poolSize; i++) {
      const spriteSombra = new PIXI.Sprite(this.texturaSombra);
      spriteSombra.anchor.set(0.5, 0); // Anclar en la parte superior central
      spriteSombra.visible = false;
      spriteSombra.blendMode = "multiply"; // Para que se mezcle bien con el fondo

      // Asegurar que la textura use NEAREST para efecto pixelado (sin smooth)
      spriteSombra.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      // Agregar al container de renderizado
      this.containerParaRenderizar.addChild(spriteSombra);
      this.poolSombras.push(spriteSombra);
    }

    this.poolSizeOriginal = poolSize; // Guardar para advertencias
    this.poolWarningShown = false; // Flag para mostrar advertencia solo una vez

    console.log(
      `✅ Pool de ${poolSize} sprites pixelados de sombra creado (${cantidadFaroles} faroles × ${maxSombrasPorFarol} sombras)`
    );
  }

  /**
   * Obtener un sprite de sombra del pool
   * VALIDACIÓN: Asegura que los sprites no se dupliquen en sombrasActivas
   */
  obtenerSpriteSombraDelPool() {
    if (this.poolSombras.length > 0) {
      const sprite = this.poolSombras.pop();

      // Validar que no esté ya en el array de activas (doble seguridad)
      if (!this.sombrasActivas.includes(sprite)) {
        this.sombrasActivas.push(sprite);
      }

      sprite.visible = true;
      return sprite;
    }

    // Si el pool está vacío, crear uno nuevo (fallback) y advertir
    if (!this.poolWarningShown) {
      console.warn(
        `⚠️ Pool de sombras agotado! Creando sprites adicionales. Considera aumentar max_sombras_por_farol o reducir la cantidad de faroles/personajes.`
      );
      console.warn(
        `   Sombras activas: ${
          this.sombrasActivas.length
        }, Pool size original: ${this.poolSizeOriginal || "desconocido"}`
      );
      this.poolWarningShown = true;
    }

    const sprite = new PIXI.Sprite(this.texturaSombra);
    sprite.anchor.set(0.5, 0);
    sprite.blendMode = "multiply";
    // Asegurar efecto pixelado
    sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this.containerParaRenderizar.addChild(sprite);
    this.sombrasActivas.push(sprite);
    return sprite;
  }

  /**
   * Devolver un sprite al pool
   * VALIDACIÓN: Evita devolver sprites duplicados (bug fix)
   */
  devolverSpriteSombraAlPool(sprite) {
    // Validar que el sprite esté en el array de activas
    const index = this.sombrasActivas.indexOf(sprite);
    if (index === -1) {
      // El sprite ya fue devuelto al pool, no hacer nada
      return;
    }

    sprite.visible = false;
    this.sombrasActivas.splice(index, 1);

    // Validar que no esté ya en el pool antes de agregarlo
    if (!this.poolSombras.includes(sprite)) {
      this.poolSombras.push(sprite);
    }
  }

  /**
   * Limpiar todas las sombras activas (método de utilidad)
   * NOTA: Ya NO se usa en el flujo normal de renderizado
   * Las personas limpian sus propias sombras individualmente para evitar conflictos
   * Este método puede ser útil para casos especiales (cambio de nivel, reset, etc.)
   */
  limpiarSombrasActivas() {
    for (const sprite of this.sombrasActivas) {
      sprite.visible = false;
      // Validar que no esté ya en el pool antes de agregarlo
      if (!this.poolSombras.includes(sprite)) {
        this.poolSombras.push(sprite);
      }
    }
    this.sombrasActivas.length = 0;
  }

  crearSistemaDeIluminacionConRenderTexture() {
    // Crear RenderTexture del tamaño de la pantalla
    this.renderTexture = PIXI.RenderTexture.create({
      width: this.juego.width,
      height: this.juego.height,
    });

    // Crear sprite que mostrará la RenderTexture
    this.spriteDeIluminacion = new PIXI.Sprite(this.renderTexture);
    this.spriteDeIluminacion.label = "spriteDeIluminacion";
    this.spriteDeIluminacion.zIndex = Juego.Z_INDEX.containerIluminacion;
    this.spriteDeIluminacion.blendMode = "multiply";
    this.spriteDeIluminacion.alpha = 0.99;
    this.juego.pixiApp.stage.addChild(this.spriteDeIluminacion);

    // Crear container temporal para renderizar (no se agrega al stage)
    this.containerParaRenderizar = new PIXI.Container();
    this.containerParaRenderizar.sortableChildren = true;

    // Crear el sprite negro de fondo
    this.spriteNegro = crearSpriteNegro(this.juego.width, this.juego.height);
    this.spriteNegro.label = "spriteNegro";
    this.spriteNegro.zIndex = 1;
    this.containerParaRenderizar.addChild(this.spriteNegro);

    // Crear sprites de gradiente para cada farol
    for (let farol of this.juego.cosasQueDanLuz) {
      farol.spriteGradiente = crearSpriteConGradiente(farol.radioLuz, 0xffffcc);
      farol.spriteGradiente.zIndex = 2;
      this.containerParaRenderizar.addChild(farol.spriteGradiente);
    }

    // Establecer la visibilidad inicial
    this.spriteDeIluminacion.visible = this.activo;

    this.crearSpriteAmarilloParaElAtardecer();
  }
  crearSpriteAmarilloParaElAtardecer() {
    this.spriteAmarilloParaElAtardecer = new PIXI.Graphics();
    this.spriteAmarilloParaElAtardecer.label = "spriteAmarilloParaElAtardecer";
    this.spriteAmarilloParaElAtardecer.rect(
      0,
      0,
      this.juego.width,
      this.juego.height
    );
    this.spriteAmarilloParaElAtardecer.fill({
      color: 0xffcc00,
      alpha: 0.5,
    });

    this.spriteAmarilloParaElAtardecer.alpha = 0;
    this.spriteAmarilloParaElAtardecer.zIndex =
      Juego.Z_INDEX.spriteAmarilloParaElAtardecer;
    this.spriteAmarilloParaElAtardecer.blendMode = "multiply";
    this.juego.pixiApp.stage.addChild(this.spriteAmarilloParaElAtardecer);
  }

  redimensionarRenderTexture() {
    if (!this.renderTexture || !this.spriteDeIluminacion) return;

    // Destruir la RenderTexture anterior
    this.renderTexture.destroy(true);

    // Crear nueva RenderTexture con el nuevo tamaño
    this.renderTexture = PIXI.RenderTexture.create({
      width: this.juego.width,
      height: this.juego.height,
    });

    // Actualizar la textura del sprite
    this.spriteDeIluminacion.texture = this.renderTexture;

    // Recrear el sprite negro con el nuevo tamaño
    if (this.spriteNegro) {
      this.containerParaRenderizar.removeChild(this.spriteNegro);
      this.spriteNegro.destroy();
    }
    this.spriteNegro = crearSpriteNegro(this.juego.width, this.juego.height);
    this.spriteNegro.label = "spriteNegro";
    this.spriteNegro.zIndex = 1;
    this.containerParaRenderizar.addChild(this.spriteNegro);

    this.spriteAmarilloParaElAtardecer.width = this.juego.width;
    this.spriteAmarilloParaElAtardecer.height = this.juego.height;
  }

  avanzarDia() {
    this.minutoDelDia += this.juego.deltaTime * 0.01;
    if (this.minutoDelDia >= this.minutosPorDia) {
      this.minutoDelDia = 0;
      this.numeroDeDia++;
    }

    const cantidadDeLuzDelDiaProvisoria =
      -Math.cos((this.minutoDelDia / this.minutosPorDia) * Math.PI * 2) + 0.5;

    this.cantidadDeLuzDelDia = cantidadDeLuzDelDiaProvisoria;

    if (this.cantidadDeLuzDelDia > 1) this.cantidadDeLuzDelDia = 1;
    if (this.cantidadDeLuzDelDia < 0) this.cantidadDeLuzDelDia = 0;

    this.horaDelDia = this.minutoDelDia / 60;
  }

  prenderTodosLosFaroles() {
    for (let farol of this.juego.faroles) {
      farol.prender();
    }
  }
  apagarTodosLosFaroles() {
    for (let farol of this.juego.faroles) {
      farol.apagar();
    }
  }
  prenderOApagarTodosLosFarolesSegunLaHoraDelDia() {
    if (this.horaDelDia > 7 && this.horaDelDia < 7.2) {
      this.apagarTodosLosFaroles();
    } else if (this.horaDelDia > 18 && this.horaDelDia < 18.2) {
      this.prenderTodosLosFaroles();
    }
  }

  tick() {
    this.avanzarDia();

    // OPTIMIZACIÓN: Si es de día completo, no hacer nada de iluminación
    if (this.cantidadDeLuzDelDia >= 0.99999) {
      // Asegurar que todo esté visible al 100%
      if (this.spriteDeIluminacion) {
        this.spriteDeIluminacion.alpha = 0;
      }
      return; // Skip todo el sistema de iluminación
    }

    if (this.graficoSombrasProyectadas) {
      this.graficoSombrasProyectadas.clear();
    }

    if (this.activo) {
      for (let flash of this.juego.flashes) {
        flash.tick();
      }

      this.actualizarSpriteAmarilloParaElAtardecer();
      this.prenderOApagarTodosLosFarolesSegunLaHoraDelDia();

      // Las personas limpian sus propias sombras individualmente
      // NO llamar a limpiarSombrasActivas() aquí para evitar doble limpieza
      this.actualizarSombrasDesdeObjetos();

      this.actualizarGradientsDeLosFaroles();
      this.actualizarSpriteDeIluminacion();

      // OPTIMIZACIÓN: Actualizar tints solo cada N frames (es muy costoso)
      const framesEntreUpdates = Juego.CONFIG.frames_entre_updates_tint || 10;
      if (this.juego.FRAMENUM % framesEntreUpdates === 0) {
        this.cambiarTintDeTodosLosObjetosParaSimularIluminacion();
      }

      // OPTIMIZACIÓN: Actualizar sombras de personajes también cada N frames
      if (this.juego.FRAMENUM % framesEntreUpdates === 0) {
        this.cambiarElAlphaDeLasSombrasSegunLaCantidadDeLuzDelDia();
      }
    }
  }

  cambiarElAlphaDeLasSombrasSegunLaCantidadDeLuzDelDia() {
    for (let persona of this.juego.personas) {
      persona.cambiarAlphaDeLaSombra(this.cantidadDeLuzDelDia);
    }
  }
  cambiarTintDeTodosLosObjetosParaSimularIluminacion() {
    // OPTIMIZACIÓN: Solo actualizar tint de objetos visibles en pantalla
    for (let obj of this.juego.gameObjects) {
      if (!obj.estoyVisibleEnLaPantallaEnEsteFrame) continue;
      obj.cambiarTintParaSimularIluminacion();
    }
  }

  actualizarSpriteAmarilloParaElAtardecer() {
    if (!this.spriteAmarilloParaElAtardecer) return;
    const desde = 16;
    const hasta = 21;
    if (this.horaDelDia < desde || this.horaDelDia > hasta) {
      this.spriteAmarilloParaElAtardecer.alpha = 0;
      return;
    }

    const ratio = (this.horaDelDia - desde) / (hasta - desde);

    let valorAlpha = Math.sin(ratio * Math.PI);
    if (valorAlpha < 0) valorAlpha = 0;
    if (valorAlpha > 1) valorAlpha = 1;

    this.spriteAmarilloParaElAtardecer.alpha = valorAlpha;
  }

  actualizarSpriteDeIluminacion() {
    this.spriteDeIluminacion.alpha = 1 - this.cantidadDeLuzDelDia;

    // Renderizar el container en la RenderTexture
    this.juego.pixiApp.renderer.render({
      container: this.containerParaRenderizar,
      target: this.renderTexture,
      clear: true,
    });
  }

  actualizarGradientsDeLosFaroles() {
    // Limpiar sombras del frame anterior (si usamos texturas)

    // Primero: Actualizar los gradientes de luz de los faroles
    for (let farol of this.juego.cosasQueDanLuz) {
      // OPTIMIZACIÓN 1: Skip faroles apagados (estado === 0)
      if (farol.estado === 0) {
        if (farol.spriteGradiente) {
          farol.spriteGradiente.visible = false;
        }
        continue;
      }

      // Si el farol/fuego/flash no tiene spriteGradiente, crearlo
      if (!farol.spriteGradiente) {
        // Usar el color del objeto si está disponible (para flashes), sino usar amarillo-cálido por defecto
        const colorLuz = farol.color !== undefined ? farol.color : 0xffffcc;
        farol.spriteGradiente = crearSpriteConGradiente(
          farol.radioLuz,
          colorLuz
        );
        farol.spriteGradiente.zIndex = 2;
        this.containerParaRenderizar.addChild(farol.spriteGradiente);
      }

      // OPTIMIZACIÓN 2: No procesar faroles fuera de pantalla (con margen)
      if (!farol.estoyVisibleEnLaPantallaEnEsteFrame) {
        farol.spriteGradiente.visible = false;
        continue;
      }

      // El farol está prendido y visible
      farol.spriteGradiente.visible = true;
      const posicionEnPantalla = farol.getPosicionEnPantalla();
      farol.spriteGradiente.x = posicionEnPantalla.x;
      farol.spriteGradiente.y = posicionEnPantalla.y;
      farol.spriteGradiente.scale.set(this.juego.zoom);
    }
  }

  /**
   * NUEVO APPROACH: Iterar objetos en lugar de faroles
   * Cada objeto visible calcula sus propias sombras
   */
  actualizarSombrasDesdeObjetos() {
    // Iterar solo personas vivas y visibles en pantalla
    for (let persona of this.juego.personas) {
      if (persona.muerto) continue;
      if (!persona.estoyVisibleEnLaPantallaEnEsteFrame) continue;

      // Cada persona calcula sus sombras basándose en sus faroles cercanos
      persona.calcularYCrearSombrasProyectadas(this);
    }
  }

  /**
   * NUEVO: Versión optimizada usando texturas pre-renderizadas
   * 10-20x más rápido que la versión con geometría
   */
  actualizarSombrasProyectadasConTexturas(farol) {
    if (!Juego.CONFIG.usar_sombras_proyectadas) return;
    if (!this.texturaSombra) return;

    const posDelFarol = farol.getPosicionEnPantalla();
    const zoom = this.juego.zoom;

    // OPTIMIZACIÓN: Limitar cantidad de sombras
    const MAX_SOMBRAS = Juego.CONFIG.max_sombras_por_farol || 15;

    // Obtener objetos cercanos usando la grilla
    let objetosCercanos;
    if (Juego.CONFIG.usar_grilla && farol.celdaActual) {
      const celdasABuscar = Math.ceil(
        farol.radioLuz / this.juego.grilla.anchoCelda
      );
      const entidadesCerca =
        farol.celdaActual.obtenerEntidadesAcaYEnCEldasVecinas(celdasABuscar);
      objetosCercanos = entidadesCerca.filter(
        (entidad) => entidad instanceof Persona && !entidad.muerto
      );
    } else {
      objetosCercanos = this.juego.personas.filter(
        (persona) => !persona.muerto
      );
    }

    // Ordenar por distancia y tomar solo los más cercanos
    // PRIORIDAD: Personajes sin sombras primero, luego por distancia
    if (objetosCercanos.length > MAX_SOMBRAS) {
      objetosCercanos.sort((a, b) => {
        // Priorizar personajes que no tienen sombras aún
        const aSinSombra = (a.misSombrasProyectadas?.length || 0) === 0 ? 0 : 1;
        const bSinSombra = (b.misSombrasProyectadas?.length || 0) === 0 ? 0 : 1;

        if (aSinSombra !== bSinSombra) {
          return aSinSombra - bSinSombra; // Sin sombra primero
        }

        // Si ambos tienen o no tienen sombras, ordenar por distancia
        const distA = calcularDistanciaCuadrada(posDelFarol, a.posicion);
        const distB = calcularDistanciaCuadrada(posDelFarol, b.posicion);
        return distA - distB;
      });
      objetosCercanos = objetosCercanos.slice(0, MAX_SOMBRAS);
    }

    // Procesar cada objeto cercano
    for (let objeto of objetosCercanos) {
      if (objeto === farol) continue;
      if (!objeto.estoyVisibleEnLaPantallaEnEsteFrame) continue;

      // Verificar distancia
      if (
        !laDistanciaEntreDosObjetosEsMenorQue(
          farol.posicion,
          objeto.posicion,
          farol.radioLuz
        )
      )
        continue;

      const distancia = calcularDistancia(farol.posicion, objeto.posicion);
      if (distancia <= 0 || distancia > farol.radioLuz) continue;

      // Calcular ángulo de la sombra (del farol al objeto)
      const dx = farol.posicion.x - objeto.posicion.x;
      const dy = farol.posicion.y - objeto.posicion.y;
      const anguloRadianes = Math.atan2(dy, dx);

      // Obtener sprite del pool
      const spriteSombra = this.obtenerSpriteSombraDelPool();
      if (!spriteSombra) continue;

      objeto.misSombrasProyectadas.push(spriteSombra);

      // Posicionar la sombra más cerca del objeto (10px hacia el farol)
      const posObjeto = objeto.getPosicionEnPantalla();
      const offsetCerca = 10 * zoom; // Ajustar por zoom
      spriteSombra.x = posObjeto.x + Math.cos(anguloRadianes) * offsetCerca;
      spriteSombra.y = posObjeto.y + Math.sin(anguloRadianes) * offsetCerca;

      // Rotar según dirección de la luz
      // +90° porque la textura apunta hacia abajo por defecto
      spriteSombra.rotation = anguloRadianes + Math.PI / 2;

      // Escalar según distancia (sombras más largas cuando más lejos)
      const longitudBase = 1.0;
      const factorDistancia = Math.min(distancia / farol.radioLuz, 1);
      const longitudSombra = longitudBase + factorDistancia * 1.5;

      // Escalar en X según el radio del objeto (sombras más anchas para objetos grandes)
      const anchoSombra = objeto.radio / 10;

      // COMPENSAR por la reducción de tamaño de la textura (efecto pixelado)
      // Si la textura es 0.1 del tamaño original, necesitamos escalarla 10x (1/0.1)
      const compensacionEscala = 1 / Juego.CONFIG.escala_textura_sombras;

      spriteSombra.scale.set(
        anchoSombra * 0.5 * zoom * compensacionEscala,
        longitudSombra * 0.5 * zoom * compensacionEscala
      );

      // Alpha según distancia (más transparente cuando más lejos)
      let cantDeSombra = (farol.radioLuz ** 1.5 / distancia ** 2) * 0.33;
      if (cantDeSombra > 0.4) cantDeSombra = 0.4;
      if (cantDeSombra < 0.05) cantDeSombra = 0.05;

      // LIMITADOR: Asegurar que el alpha total de todas las sombras no supere 0.8
      const MAX_ALPHA_TOTAL = 0.8;
      const alphaDisponible = MAX_ALPHA_TOTAL - objeto.alphaAcumuladoDeSombras;

      if (alphaDisponible <= 0) {
        // Ya llegamos al límite, no agregar más sombras a este objeto
        this.devolverSpriteSombraAlPool(spriteSombra);
        objeto.misSombrasProyectadas.pop(); // Remover la referencia que agregamos
        continue;
      }

      // Ajustar el alpha si excede el disponible
      if (cantDeSombra > alphaDisponible) {
        cantDeSombra = alphaDisponible;
      }

      spriteSombra.alpha = cantDeSombra;
      objeto.alphaAcumuladoDeSombras += cantDeSombra;

      // Z-index para que se dibuje correctamente
      spriteSombra.zIndex = 3;
    }
  }

  toggle() {
    this.activo = !this.activo;

    // Alternar visibilidad del sprite de iluminación
    if (this.spriteDeIluminacion) {
      this.spriteDeIluminacion.visible = this.activo;
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

  /**
   * Crea un flash temporal de luz (para disparos, explosiones, etc.)
   *
   * @param {Object} posicionEnElMundo - {x, y} posición en coordenadas del mundo
   * @param {Number} radio - Radio de la luz en unidades del mundo
   * @param {Number} intensidad - Intensidad de la luz (0-1)
   * @param {Number} duracion - Duración del flash en milisegundos
   * @param {Number} color - Color de la luz (opcional, por defecto amarillo-blanco)
   * @returns {Flash} La instancia de Flash creada
   */
  crearFlashDeDisparoEn(
    posicionEnElMundo,
    radio,
    intensidad = 1,
    duracion = 100,
    color = 0xffffaa
  ) {
    // Simplemente crear una instancia de Flash
    // Se encargará automáticamente de todo: grilla, iluminación, tick, destrucción

    const flash = new Flash(
      posicionEnElMundo.x,
      posicionEnElMundo.y,
      this.juego,
      radio,
      intensidad,
      duracion,
      color
    );

    return flash;
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
}

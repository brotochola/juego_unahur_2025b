class Arma {
  melee = false;
  range = 50; //suma de los radios + this.range
  cooldown = 250; //ms
  lastTimeFired = 0;
  fuerzaDeAtaque = 0.2;
  owner = null;
  maxBalas = 10;
  balasRestantes = 10;
  tiempoRecarga = 1000;
  recargando = false;
  cuandoEmpezoARecargar = 0;
  radioLuzDisparo = 400;
  constructor(owner) {}

  establecerFuerzaDeAtaqueParaLasBalas(bala) {
    bala.fuerzaDeAtaque =
      this.fuerzaDeAtaque * 0.5 + Math.random() * this.fuerzaDeAtaque;
  }

  disparar(posicion) {
    if (this.balasRestantes <= 0) {
      this.evaluarRecargar();
      return;
    }
    if (!this.owner.sprite) return;
    // Sistema de cooldown: solo disparar si pasaron suficientes milisegundos
    const tiempoActual = performance.now();
    const tiempoDesdeUltimoDisparo = tiempoActual - this.lastTimeFired;

    if (tiempoDesdeUltimoDisparo < this.cooldown) {
      return; // No disparar si el cooldown no terminó
    }

    this.reproduceSonidoDeDisparo();

    // Actualizar el último tiempo de disparo
    this.lastTimeFired = tiempoActual;

    // Obtener una bala del pool
    const bala = BalasPool.get(this.owner.juego);
    this.establecerFuerzaDeAtaqueParaLasBalas(bala);

    // Calcular dirección del disparo (desde el protagonista hacia la posición)
    const dx = posicion.x - this.owner.posicion.x;
    const dy = posicion.y - this.owner.posicion.y;
    const anguloRadianes =
      Math.atan2(dy, dx) -
      Math.random() * (1 - this.owner.punteria) +
      (1 - this.owner.punteria) * 0.5;

    // Activar la bala en la posición del protagonista
    // Pasar 'this' como el que disparó para que no se golpee a sí mismo
    const posicionInicial = this.owner.getPosicionCentral();
    posicionInicial.y -= this.owner.sprite.height * 0.4;

    // Calcular la distancia de separación para que la bala empiece fuera del protagonista
    const distanciaSeparacion = (this.owner.radio + bala.radio) * 2;

    // Desplazar la posición inicial en la dirección del disparo
    const posX =
      posicionInicial.x + Math.cos(anguloRadianes) * distanciaSeparacion;
    const posY =
      posicionInicial.y + Math.sin(anguloRadianes) * distanciaSeparacion;

    bala.activar(posX, posY, anguloRadianes, this.owner);

    this.owner.animationFSM.setState("shoot");

    // Crear flash de disparo en el sistema de iluminación
    if (
      this.owner.juego.sistemaDeIluminacion &&
      this.owner.juego.sistemaDeIluminacion.activo
    ) {
      this.owner.juego.sistemaDeIluminacion.crearFlashDeDisparoEn(
        { x: posX, y: posY }, // Posición del disparo en el mundo
        this.radioLuzDisparo, // Radio de la luz
        0.8, // Intensidad (0-1)
        66 // Duración en milisegundos
      );
    }
    this.owner.juego.camara.shake(0.1, 4);
    this.balasRestantes--;
  }
  reproduceSonidoDeDisparo() {
    SoundManager.playSound(
      this.sonidoDeDisparo,
      0.5,
      0.95 + Math.random() * 0.1
    );
  }

  evaluarRecargar() {
    // Si no estamos recargando
    if (!this.recargando) {
      // Iniciamos recarga si no hay balas
      if (this.balasRestantes <= 0) {
        this.recargando = true;
        this.cuandoEmpezoARecargar = performance.now();
      }
      return;
    }

    // Si estamos recargando, verificar si se completó
    if (performance.now() - this.cuandoEmpezoARecargar >= this.tiempoRecarga) {
      this.recargando = false;
      this.balasRestantes = this.maxBalas;
    }
  }
}

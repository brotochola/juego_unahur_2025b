/**
 * CLASE PROTAGONISTA - PERSONAJE CONTROLADO POR EL JUGADOR
 *
 * Extiende la clase Persona con características especiales:
 * - Vida prácticamente infinita para evitar game over
 * - Visión ilimitada (puede ver a todos los enemigos)
 * - Bando 1 (diferente de los enemigos)
 * - Control por mouse en lugar de IA automática
 */
class Protagonista extends Persona {
  constructor(x, y, juego) {
    super(x, y, juego);

    // Configuración especial del protagonista
    this.vida = this.vidaMaxima = 9999999;
    this.vision = 1000; // Visión ilimitada
    this.bando = 1; // Bando del jugador
    this.crearSpritesheetAnimado(this.bando);
    this.container.label = "prota";
    this.factorIrAlTarget = 0.9;
    this.distanciaParaEmpezarABajarLaVelocidad = this.radio * 20;
    this.distanciaAlTarget = Infinity;
    this.esperarAQueTengaSpriteCargado(() => {
      this.crearBarritaVida();
    });
    this.target = null;

    this.ultimoTiempoDisparo = 0; // Último tiempo (performance.now()) en el que disparó
    this.punteria = 0.9;

    this.guardarEnInventario(new Ametralladora(this));
    this.guardarEnInventario(new Pistola(this));
    this.guardarEnInventario(new LanzadorDeMolotov(this));
    this.cambiarItemActivo(0);
  }

  morir() {
    super.morir();
    // this.juego.finDelJuego();
  }
  recibirDanio(danio) {
    super.recibirDanio(danio);
  }

  tick() {
    /*

El protagonista no usa separación automática, ni alineacion ni cohesion. Pero sigue al mouse.
Si esta cerca del target, no repele obstaculos.
Si esta muy lejos del target, repelo obstaculos de forma piola, para ir llegando, pero si queres meterte en algun recoveco
y le seguimos aplicando la fuerza que repele obstaculos, no va a llegar

*/
    this.actualizarMiPosicionEnLaGrilla();
    this.verificarSiEstoyMuerto();

    this.moverConLasTeclas();

    this.irAlTarget(); // Control por mouse
    this.percibirEntorno();
    this.noChocarConObstaculos();

    //si no estoy cerca del target, repelo obstaculos de forma piola
    if (
      this.target &&
      this.distanciaAlTarget > this.distanciaParaEmpezarABajarLaVelocidad
    ) {
      this.repelerSuavementeObstaculos();
    }

    this.aplicarFisica(); // Física del movimiento

    // Datos para animación
    this.calcularAnguloYVelocidadLineal();

    this.dispararSiSePresionoElBotonIzquierdoDelMouse();
  }

  calcularAnguloYVelocidadLineal() {
    if (this.animationFSM.currentStateName === "shoot") {
      const dx = this.juego.mouse.posicion.x - this.posicion.x;
      const dy = this.juego.mouse.posicion.y - this.posicion.y;

      this.angulo = radianesAGrados(Math.atan2(dy, dx)) + 180;
    } else {
      this.angulo =
        radianesAGrados(Math.atan2(this.velocidad.y, this.velocidad.x)) + 180;
    }

    // Calcular la magnitud de la velocidad
    this.velocidadLineal = calcularDistancia(this.velocidad, { x: 0, y: 0 });
  }

  dispararSiSePresionoElBotonIzquierdoDelMouse() {
    if (this.juego.mouse.apretado[0]) {
      this.disparar(this.juego.mouse.posicion);
    }
  }

  moverConLasTeclas() {
    if (this.juego.teclado.a) {
      this.aceleracion.x -= this.velocidadMaxima;
    }
    if (this.juego.teclado.d) {
      this.aceleracion.x += this.velocidadMaxima;
    }

    if (this.juego.teclado.w) {
      this.aceleracion.y -= this.velocidadMaxima;
    }
    if (this.juego.teclado.s) {
      this.aceleracion.y += this.velocidadMaxima;
    }
  }

  irAlTarget() {
    /**
     * SISTEMA DE CONTROL POR MOUSE
     *
     * Implementa movimiento hacia la posición del último clic:
     *
     * 1. DETECCIÓN DE INPUT:
     *    - Solo actúa si hay un clic registrado (mouse.up)
     *    - mouse.up contiene las coordenadas del último clic
     *
     * 2. CÁLCULO DE DIRECCIÓN:
     *    - Vector = posición_objetivo - posición_actual
     *    - Normalización para obtener dirección pura
     *
     * 3. DESACELERACIÓN PROGRESIVA:
     *    - Zona de frenado = rangoDeAtaque × 3
     *    - Factor cúbico: (distancia/zona_frenado)³
     *    - Esto crea una aproximación suave al objetivo
     *
     * 4. APLICACIÓN DE FUERZA:
     *    - Se suma a la aceleración (no reemplaza)
     *    - Permite combinación con otras fuerzas físicas
     *
     * Resultado: Control responsivo con parada suave
     */
    if (!this.target) return;

    // Calcular vector hacia el objetivo
    const difX = this.target.x - this.posicion.x;
    const difY = this.target.y - this.posicion.y;
    this.distanciaAlTarget = calcularDistancia(this.posicion, this.target);

    // Normalizar dirección
    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    // Sistema de desaceleración progresiva

    if (this.distanciaAlTarget < this.distanciaParaEmpezarABajarLaVelocidad) {
      this.juego.hacerQueCruzTargetSeVaya();
      // Curva cúbica de desaceleración para aproximación suave
      const factor =
        (this.distanciaAlTarget / this.distanciaParaEmpezarABajarLaVelocidad) **
        3;
      vectorNuevo.x *= factor;
      vectorNuevo.y *= factor;
    }

    // Aplicar fuerza de movimiento
    this.aceleracion.x += vectorNuevo.x * this.factorIrAlTarget;
    this.aceleracion.y += vectorNuevo.y * this.factorIrAlTarget;
  }

  render() {
    super.render();
  }
}

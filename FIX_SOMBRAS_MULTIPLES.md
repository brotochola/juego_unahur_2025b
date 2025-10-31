# 🔧 FIX: Sombras Proyectadas Múltiples por Luz

## 📋 Problema Identificado

Cuando había más de una persona cerca de una fuente de luz, **solo una persona mostraba su sombra proyectada**.

### Causa Raíz

**Doble limpieza desincronizada del pool de sprites de sombra:**

1. **Frame N:**

   - Persona A tiene sombras → `misSombrasProyectadas = [sprite1, sprite2]`
   - Persona B tiene sombras → `misSombrasProyectadas = [sprite3, sprite4]`
   - `sombrasActivas (global) = [sprite1, sprite2, sprite3, sprite4]`

2. **Frame N+1 (CON EL BUG):**

   ```
   tick() → limpiarSombrasActivas()
            ↓
            Devuelve sprite1, sprite2, sprite3, sprite4 al pool
            Limpia sombrasActivas = []
            ↓
         actualizarSombrasDesdeObjetos()
            ↓
            Persona A → calcularYCrearSombrasProyectadas()
                        ↓
                        Intenta devolver sprite1, sprite2 (¡YA EN EL POOL!)
                        Obtiene sprite del pool → sprite1
            ↓
            Persona B → calcularYCrearSombrasProyectadas()
                        ↓
                        Intenta devolver sprite3, sprite4 (¡YA EN EL POOL!)
                        Obtiene sprite del pool → sprite1 (¡EL MISMO!)
   ```

3. **Resultado:**
   - Ambas personas obtienen la MISMA referencia de sprite
   - La última que lo posiciona "gana"
   - Solo se ve UNA sombra

### Por qué ocurría

El método `limpiarSombrasActivas()` devolvía todos los sprites al pool de forma global, pero luego cada persona intentaba devolver sus propios sprites individualmente, creando **duplicados en el pool**. Esto causaba que múltiples personas obtuvieran el mismo sprite.

## ✅ Solución Implementada

### Cambios Realizados

#### 1. **Eliminada la doble limpieza** (`sistemaDeIluminacion.js`)

- ❌ Removida la llamada a `limpiarSombrasActivas()` en el flujo de renderizado
- ✅ Cada persona ahora limpia sus propias sombras de forma individual y controlada

#### 2. **Validación en devolución de sprites** (`sistemaDeIluminacion.js`)

```javascript
devolverSpriteSombraAlPool(sprite) {
  // Validar que el sprite esté en sombrasActivas
  const index = this.sombrasActivas.indexOf(sprite);
  if (index === -1) return; // Ya fue devuelto, ignorar

  sprite.visible = false;
  this.sombrasActivas.splice(index, 1);

  // Validar que no esté ya en el pool
  if (!this.poolSombras.includes(sprite)) {
    this.poolSombras.push(sprite);
  }
}
```

#### 3. **Validación en obtención de sprites** (`sistemaDeIluminacion.js`)

```javascript
obtenerSpriteSombraDelPool() {
  if (this.poolSombras.length > 0) {
    const sprite = this.poolSombras.pop();

    // Validar que no esté duplicado en activas
    if (!this.sombrasActivas.includes(sprite)) {
      this.sombrasActivas.push(sprite);
    }

    sprite.visible = true;
    return sprite;
  }
  // ...
}
```

#### 4. **Limpieza mejorada por persona** (`gameObject.js`)

```javascript
// Validación adicional para mayor seguridad
if (!this.misSombrasProyectadas) {
  this.misSombrasProyectadas = [];
} else if (this.misSombrasProyectadas.length > 0) {
  // La validación en devolverSpriteSombraAlPool previene duplicados
  for (const spriteSombra of this.misSombrasProyectadas) {
    sistemaIluminacion.devolverSpriteSombraAlPool(spriteSombra);
  }
  this.misSombrasProyectadas.length = 0;
}
```

## 🎯 Resultado Esperado

### Antes del Fix

- ❌ Solo 1 persona mostraba sombra cuando había múltiples personas cerca de una luz
- ❌ Sprites duplicados en el pool causaban conflictos
- ❌ Última persona en procesar "ganaba" el sprite compartido

### Después del Fix

- ✅ **Todas las personas muestran sus sombras correctamente**
- ✅ Cada persona obtiene sprites únicos del pool
- ✅ No hay duplicados en el pool ni en sombrasActivas
- ✅ Sistema de limpieza descentralizado y robusto

## 🔍 Flujo Correcto (Post-Fix)

```
Frame N+1:
  tick() → actualizarSombrasDesdeObjetos()
           ↓
           Persona A → calcularYCrearSombrasProyectadas()
                       ↓
                       Devuelve sprite1, sprite2 al pool (con validación)
                       Obtiene sprite5 del pool
                       misSombrasProyectadas = [sprite5]
           ↓
           Persona B → calcularYCrearSombrasProyectadas()
                       ↓
                       Devuelve sprite3, sprite4 al pool (con validación)
                       Obtiene sprite6 del pool (DIFERENTE!)
                       misSombrasProyectadas = [sprite6]
```

## 📊 Archivos Modificados

1. `js/sistemaDeIluminacion.js`

   - Removida llamada a `limpiarSombrasActivas()` en `tick()`
   - Agregada validación en `devolverSpriteSombraAlPool()`
   - Agregada validación en `obtenerSpriteSombraDelPool()`
   - Actualizada documentación de `limpiarSombrasActivas()`

2. `js/gameObject.js`
   - Mejorada lógica de limpieza en `calcularYCrearSombrasProyectadas()`
   - Agregado comentario explicativo

## 🧪 Testing Recomendado

Para verificar que el fix funciona correctamente:

1. Crear múltiples personas (3-5) cerca de un farol
2. Observar que **todas** muestren sus sombras proyectadas
3. Mover personas para que entren/salgan del radio de luz
4. Verificar que no haya warnings en la consola sobre pool agotado
5. Probar con múltiples faroles y muchas personas (stress test)

## 💡 Beneficios Adicionales

- **Mayor robustez:** Validaciones previenen bugs futuros
- **Mejor performance:** Menos operaciones redundantes
- **Código más claro:** Responsabilidad descentralizada
- **Debugging más fácil:** Cada persona maneja sus propias sombras

---

**Fecha del Fix:** 31 de Octubre, 2025
**Severidad del Bug:** Alta (funcionalidad visible afectada)
**Impacto del Fix:** Crítico (restaura funcionalidad esperada)

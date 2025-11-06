# 🔴 Memory Leak Fix - Shadow System

## Problem Summary

Your **JS Heap was growing continuously** due to **3 critical memory leaks** in the shadow sprite pooling system in `sistemaDeIluminacion.js`.

## Root Causes Identified

### 1. **Sprites Not Removed from Container** ⚠️ CRITICAL

**Location:** `devolverSpriteSombraAlPool()` method

**The Issue:**

```javascript
// ❌ OLD CODE - MEMORY LEAK
devolverSpriteSombraAlPool(sprite) {
    sprite.visible = false;  // ← Only hidden, NOT removed!
    this.sombrasActivas.splice(index, 1);
    this.poolSombras.push(sprite);
}
```

**Why It Leaks:**

- Sprites were **never removed** from `containerParaRenderizar`
- PIXI container kept **strong references** to sprites
- Even though sprites were in the "pool", they remained in the container's children array
- This prevented garbage collection

**Impact:** Every frame, multiple shadows are created → added to container → "returned to pool" but stayed in container → **heap grows infinitely**

---

### 2. **Sprite Properties Never Reset** ⚠️ CRITICAL

**Location:** `devolverSpriteSombraAlPool()` method

**The Issue:**

- Shadow sprites keep their old values: `position`, `scale`, `rotation`, `alpha`, etc.
- PIXI's internal rendering cache retains these values
- This creates "phantom" references in memory

**Fix Applied:**

```javascript
// ✅ NEW CODE - Reset all properties
sprite.alpha = 1; // Reset to default
sprite.rotation = 0; // Reset to default
sprite.scale.set(1, 1); // Reset to default
sprite.x = 0; // Reset position
sprite.y = 0;
```

---

### 3. **Cross-References Between Objects** ⚠️ MEDIUM

**Location:** `gameObject.js` line 551

**The Issue:**

```javascript
// ❌ PROBLEM - Creates circular reference
spriteSombra.perteneceAFarol = farol; // Sprite → Farol reference
// Farol has gradient sprite → Farol
// Creates reference cycle preventing garbage collection
```

**Fix Applied:**

- Removed this unnecessary reference
- Sprites don't need to know which farol they belong to
- This reference was never used anywhere

---

## Solutions Implemented

### Fix #1: Remove Sprite from Container

```javascript
// 🔴 CRITICAL: Remove sprite from container to break cycles
if (sprite.parent) {
  sprite.parent.removeChild(sprite);
}
```

### Fix #2: Reset All Properties

```javascript
// 🔴 CRITICAL: Reset properties to break references in PIXI's cache
sprite.visible = false;
sprite.alpha = 1;
sprite.rotation = 0;
sprite.scale.set(1, 1);
sprite.x = 0;
sprite.y = 0;

// 🔴 CRITICAL: Clean up custom references
if (sprite.perteneceAFarol !== undefined) {
  sprite.perteneceAFarol = null;
}
```

### Fix #3: Re-add to Container on Reuse

```javascript
// 🔴 CRITICAL: When getting sprite from pool, ensure it's in container
if (!sprite.parent) {
  this.containerParaRenderizar.addChild(sprite);
}
```

### Fix #4: Consistent Cleanup

Updated `limpiarSombrasActivas()` to use the same cleanup logic:

```javascript
const spritesALimpiar = this.sombrasActivas.slice();
for (const sprite of spritesALimpiar) {
  this.devolverSpriteSombraAlPool(sprite); // Uses new cleanup logic
}
```

---

## Expected Impact

### Memory Heap Behavior

**Before Fix:**

```
Frame 1: Heap = 50 MB
Frame 2: Heap = 52 MB  (+ 2 MB)
Frame 3: Heap = 54 MB  (+ 2 MB)
Frame 4: Heap = 56 MB  (+ 2 MB)
...
Frame 100: Heap = 250 MB ← Grows infinitely
```

**After Fix:**

```
Frame 1: Heap = 50 MB
Frame 2: Heap = 50.5 MB
Frame 3: Heap = 50 MB
Frame 4: Heap = 50.5 MB
...
Frame 100: Heap = 50-51 MB ← Stable! (minor GC fluctuations)
```

---

## Files Modified

1. **js/sistemaDeIluminacion.js**

   - `obtenerSpriteSombraDelPool()` - Added container check
   - `devolverSpriteSombraAlPool()` - Added complete cleanup
   - `limpiarSombrasActivas()` - Use consistent cleanup method

2. **js/gameObject.js**
   - `calcularYCrearSombrasProyectadas()` - Removed circular reference

---

## Testing Checklist

- [ ] Run game for 5 minutes and check heap doesn't grow > 100MB
- [ ] Verify shadows still render correctly
- [ ] Check performance (should be same or better)
- [ ] Test with many faroles (20+) active
- [ ] Monitor in Chrome DevTools: Performance → Memory

---

## Why This Works

### Object Pool Pattern - Correct Usage

✅ **Correct Pattern:**

1. Create objects once (constructor)
2. **Remove from scene** when done
3. **Reset all state** when returning to pool
4. **Re-add to scene** when retrieved from pool
5. Reuse objects

❌ **What Was Happening:**

1. Create objects ✅
2. Hide objects (but don't remove from scene) ❌
3. Don't reset state ❌
4. Keep in scene forever ❌
5. Memory leaks

---

## Additional Notes

- The pool was **too large** (100-1500 sprites): Each shadow sprite takes ~2-5 KB in PIXI's structures
- With proper cleanup, you can reduce pool size if needed
- Consider monitoring `sistemaDeIluminacion.sombrasActivas.length` during gameplay
- If it grows beyond expected, there's a reference cycle we missed

---

## Reference: How PIXI Memory Works

When a sprite is in a container:

```
Container.children[]
    ↓
Sprite instance (properties)
    ↓
Texture (shared, doesn't duplicate)
    ↓
Render cache (shadow map, transforms)
    ↓
Each keeps the sprite alive!
```

When you hide but don't remove:

```
Container.children[] ← Still references sprite!
Sprite.visible = false ← Just visual flag
```

Garbage collection **cannot** free the sprite because the container holds a strong reference.

---

## Future Optimization Ideas

1. **Reduce pool size:** With proper cleanup, 100-200 sprites should be enough instead of 1500
2. **Monitor warnings:** Check if `poolWarningShown` appears - if not, pool is oversized
3. **Dynamic pool growth:** Only create more sprites if really needed
4. **Profile shadows:** See if reducing max_sombras_per_objeto improves performance

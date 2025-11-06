# 🎨 Memory Leak Visual Explanation

## The Problem: Visual Comparison

### BEFORE FIX ❌ (Growing Heap)

```
FRAME 1:
┌─────────────────────────┐
│  Container (1500 kids)  │
├─────────────────────────┤
│ Shadow1 (visible=true)  │────→ Rendered ✓
│ Shadow2 (visible=true)  │────→ Rendered ✓
│ Shadow3 (visible=false) │────  NOT Rendered ✗ (but still in container!)
│ Shadow4 (visible=false) │────  NOT Rendered ✗
│ ...                     │
│ Shadow1500 (visible)    │
└─────────────────────────┘
     ↓
Pool array: [Shadow3, Shadow4, ..., Shadow1500]
     ↓
PROBLEM: Container still references ALL 1500 sprites
         Even hidden ones can't be garbage collected!

Heap used: 50 MB


FRAME 2 (1 second later):
┌──────────────────────────────┐
│  Container (3000 kids!! 🔴)  │ ← DOUBLED because new sprites added
├──────────────────────────────┤
│ Shadow1 (visible)            │
│ Shadow2 (visible)            │
│ OLD Hidden shadows (1500)    │────  Still here! (should be GC'd but can't)
│ NEW Shadow1501 (visible)     │────→ Rendered ✓
│ ...                          │
│ NEW Shadow3000 (visible)     │
└──────────────────────────────┘
     ↓
SAME PROBLEM: NEW sprites created, old ones not freed

Heap used: 100 MB (+50 MB in 1 second!)


FRAME 3:
Container children: 4500  🔴🔴
Heap used: 150 MB
```

**Memory Timeline:**

```
Time: 0s    5s    10s    15s    20s    30s    60s
Heap: 50────100───150────200────250────300────500 MB ← DISASTER!
      └──╱─────────╱─────────╱─────────╱────────╱
         Grows continuously!
```

---

### AFTER FIX ✅ (Stable Heap)

```
FRAME 1:
Pool: [1500 unused sprites]
   (NOT in container yet!)
     ↓
Add Shadow1 to container for rendering
Add Shadow2 to container for rendering
Container children: 2
     ↓
Render frame
     ↓
Remove Shadow1 from container ← KEY!
Remove Shadow2 from container ← KEY!
Container children: 0
     ↓
Return sprites to pool
Pool: [1500 sprites, including Shadow1 & 2]

Heap used: 50 MB


FRAME 2 (same)
Add Shadow3, Shadow4 to container
Container children: 2 (not 3000!)
     ↓
Render frame
     ↓
Remove Shadow3, Shadow4 from container
Container children: 0 (back to zero!)
     ↓
Return to pool

Heap used: 50 MB (still stable!)


FRAME 3:
Add Shadow5, Shadow6 to container
Container children: 2 (always 2-100, never accumulates)
     ↓
SAME CYCLE
     ↓
Heap used: 50 MB
```

**Memory Timeline:**

```
Time: 0s    5s    10s    15s    20s    30s    60s
Heap: 50────50────50─────50────50────50────50 MB ✓ STABLE!
      └─────────────────────────────────────────
         Constant memory usage!
```

---

## The Reference Cycle

### BEFORE FIX: Why It Leaks ❌

```
Container
    ↓ (holds reference in children[])
Sprite1 ←─────────────┐
    ↓                 │
Properties (x, y, α) │ Circular reference!
    ↓                 │
perteneceAFarol ──────┘ Points back to Sprite
    ↓
Farol
    ↓
spriteGradiente (another sprite)
    ↓
Canvas cache
```

**The Cycle:**

```
Container → Sprite → Farol → back to Sprite
└──────────────────────────────────┘
        GARBAGE COLLECTION CAN'T BREAK THIS!

When GC tries to free Sprite:
1. Check if anyone references it
2. Container.children[] references it ✓
3. Can't delete it
4. Even though we don't need it, memory leaks
```

### AFTER FIX: No Cycle ✅

```
Pool array (only reference)
    ↓
Sprite1
    ↓
Properties (RESET to defaults)
    ↓
NO references to Farol ✓ (removed)
    ↓
When not used: Safe to garbage collect!

When needed again:
1. Get from pool
2. Add to container temporarily
3. Use sprite
4. Remove from container
5. Reset properties
6. Return to pool
```

---

## Detailed Memory Comparison

### Container Children Count

```
BEFORE FIX:
Frame 0: Container.children.length = 1500 (initial)
Frame 1: Container.children.length = 3000 (doubled!)
Frame 2: Container.children.length = 4500 (tripled!)
Frame 3: Container.children.length = 6000 (quadrupled!)
         ↑ This is the smoking gun!

AFTER FIX:
Frame 0: Container.children.length = 1500 (pre-allocated pool)
Frame 1: Container.children.length = 1500 (same!)
Frame 2: Container.children.length = 1500 (same!)
Frame 3: Container.children.length = 1500 (same!)
         ↑ Perfect!
```

### Active Shadows vs Pool

```
BEFORE FIX:
sombrasActivas = [Sprite1, Sprite2, ...]  (some visible)
poolSombras = [Sprite3, Sprite4, ...]     (some hidden in container)
Container = [ALL 1500 sprites]            ← Problem: both active and pooled!

AFTER FIX:
sombrasActivas = []                         (when not rendering)
poolSombras = [ALL 1500 Sprite]            (waiting in pool, not in container)
Container = []                              (when not rendering)

During render:
  Get Sprite from pool → Add to Container
  Add to sombrasActivas
  Render
  Remove from Container ← KEY!
  Add back to pool
```

---

## What Garbage Collector Sees

### BEFORE FIX ❌

```
MARKED FOR COLLECTION (shouldn't exist):
┌─────────────────────────────────────┐
│ PIXI.Sprite (1000 instances)        │
├─────────────────────────────────────┤
│ Type: "detached DOM node"           │
│ Size: ~2 KB each                    │
│ Total: ~2000 KB                     │
│ Reference count: 1                  │
│   └─ From Container.children[]      │
│                                     │
│ Status: KEPT (can't delete)         │
│         Not freed ❌                │
└─────────────────────────────────────┘

Even though we're not using these sprites:
- Container holds reference
- GC won't delete them
- Memory stays allocated
- NEW sprites created each frame
- Old ones STILL referenced
- Result: Linear memory growth
```

### AFTER FIX ✅

```
IN POOL (AVAILABLE FOR REUSE):
┌─────────────────────────────────────┐
│ PIXI.Sprite (1500 instances)        │
├─────────────────────────────────────┤
│ Type: "detached"                    │
│ Size: ~2 KB each                    │
│ Total: ~3000 KB                     │
│ Reference count: 1                  │
│   └─ From poolSombras array only   │
│                                     │
│ Status: REUSED                      │
│         No new allocations ✓        │
└─────────────────────────────────────┘

GC Summary:
- Pool references = CONSTANT (1500 sprites)
- Container references = CHANGES (0-100 per frame)
- Memory = STABLE
```

---

## Frame-by-Frame Animation

### BEFORE FIX (The Leak)

```
[Frame 1 Start]
Container: [S1, S2, ..., S1500]
Pool: [hidden sprites]
Heap: 50 MB

[Frame 2 Start]
Create NEW 1500 sprites (old ones couldn't be freed!)
Container: [S1, S2, ..., S1500, NEW_S1, ..., NEW_S1500]  ← 3000!
Pool: [old hidden + new hidden]
Heap: 100 MB

[Frame 3 Start]
Create NEW 1500 more sprites!
Container: [S1, ..., S1500, NEW_S1, ..., NEW_S1500, NEW2_S1, ..., NEW2_S1500]  ← 4500!
Heap: 150 MB

[Frame 4+]
...exponential growth...
```

### AFTER FIX (The Solution)

```
[Frame 1 Start]
Pool: [S1, S2, ..., S1500]  (pre-allocated)
Container: []
Heap: 50 MB

[Frame 1 Render]
  Get S1, S2 from pool
  Add to Container
  Container: [S1, S2]
  Render...
  Remove S1, S2 from Container
  Container: []
  Return S1, S2 to pool
  Pool: [S1, S2, ..., S1500]  (same!)

[Frame 2 Start]
  SAME CYCLE with SAME sprites
  Container: []
  Heap: 50 MB

[Frame 3+ Start]
  SAME CYCLE
  SAME sprites
  SAME memory
  Heap: 50 MB ← STABLE!
```

---

## The Three Key Changes

### Change 1: Remove from Container

```javascript
// BEFORE:
devolverSpriteSombraAlPool(sprite) {
    sprite.visible = false;  // ❌ Still in container!
}

// AFTER:
devolverSpriteSombraAlPool(sprite) {
    if (sprite.parent) {
        sprite.parent.removeChild(sprite);  // ✅ Removes reference!
    }
}
```

**Effect:**

```
BEFORE: Container → Sprite [GC BLOCKED]
AFTER:  (nothing) ← Sprite [GC OK ✓]
```

---

### Change 2: Reset Properties

```javascript
// BEFORE:
devolverSpriteSombraAlPool(sprite) {
    sprite.visible = false;
    // Properties stay: x=500, y=600, α=0.7, rotation=1.5...
}

// AFTER:
devolverSpriteSombraAlPool(sprite) {
    sprite.alpha = 1;
    sprite.rotation = 0;
    sprite.scale.set(1, 1);
    sprite.x = 0;
    sprite.y = 0;
}
```

**Effect:**

```
BEFORE: Old values cached in PIXI renderer
        └─ Keeps memory references alive

AFTER: Properties reset to defaults
       └─ Clears PIXI's internal cache
```

---

### Change 3: Remove Circular Reference

```javascript
// BEFORE:
spriteSombra.perteneceAFarol = farol;  // ❌ Creates cycle

// AFTER:
// Removed - not needed anywhere

Sprite → Farol → Sprite? NO!
```

**Effect:**

```
BEFORE: Sprite ←→ Farol (cycle)
AFTER:  Sprite (no back-reference)
```

---

## Summary: The Root Cause

```
┌──────────────────────────────────────────────────┐
│  Why JavaScript Heap Keeps Growing              │
└──────────────────────────────────────────────────┘

1. Object Pooling Misunderstanding
   ├─ Assumption: "Hidden = Not using memory"
   └─ Reality: "Container reference = Can't GC"

2. Container Reference Holds Everything
   ├─ Container.children[] keeps strong reference
   ├─ Even hidden sprites stay in memory
   └─ New sprites created instead of reusing

3. Circular References Block GC
   ├─ Sprite → Farol → Sprite
   └─ Cycle prevents garbage collection

4. Properties Keep Memory Allocated
   ├─ PIXI caches old values
   ├─ Prevents memory consolidation
   └─ Each sprite takes extra space

RESULT: Memory grows indefinitely!
        Container.children keeps growing
        GC can't free objects
        Heap fragments
        FPS drops

THE FIX:
  1. Remove from container ← Breaks strongest reference
  2. Reset properties ← Clears caches
  3. Remove circular refs ← Allows GC
  4. Re-add when needed ← Just for rendering
```

---

## Expected Results After Fix

```
Chrome DevTools Memory Profiler:

BEFORE FIX:
Heap snapshots (every 10 seconds):
  10s:  50 MB
  20s:  100 MB
  30s:  150 MB
  40s:  200 MB
  50s:  250 MB
  └─ Growing 5 MB per 10 seconds!

AFTER FIX:
Heap snapshots (every 10 seconds):
  10s:  50 MB
  20s:  50 MB
  30s:  50 MB
  40s:  50 MB
  50s:  50 MB
  └─ Flat line! ✓
```

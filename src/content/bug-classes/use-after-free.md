---
title: "Use-After-Free (UAF)"
description: "Dangling pointer reuse: the bug class that connects heap internals to code execution."
severity: critical
prerequisites:
  - "Heap allocator internals (Linux ptmalloc or Windows NT Heap)"
  - "Understanding of virtual memory and object lifecycles"
  - "Familiarity with at least one scripting language for exploit prototyping"
affected:
  heap: true
  stack: false
  kernel: true
  userland: true
tags: ["memory-corruption", "dangling-pointer", "heap"]
---

<div class="speech-bubble">
  <strong style="color: var(--accent);">Narrator:</strong> Every program allocates memory. Every program frees memory. But what happens when a program <em>uses</em> memory after it has been freed?
</div>

## Chapter 1: The Setup

A **Use-After-Free** occurs when a program continues to use a pointer after the memory it references has been freed.

Think of it like this:

> You rent an apartment. You get the keys. You move out and return the keys. But you secretly kept a copy. Later, you use that copy to enter the apartment — only now someone else lives there.

That's a Use-After-Free. The apartment is heap memory. The keys are your pointer.

### The Anatomy of a UAF

```c
void* obj = malloc(sizeof(object_t));
// ... initialize obj ...

free(obj);          // Memory released back to allocator
// obj is now dangling

obj->field = value; // USE AFTER FREE: write to freed memory
```

<div class="manga-panel manga-panel--danger" data-shake>
  <div class="sfx">CRASH!</div>
  <p style="margin: 0; color: var(--danger); font-weight: 600;">
    In a multithreaded or event-driven program, the gap between <code>free</code> and reuse can be huge. Browsers, kernels, and complex daemons are full of UAFs.
  </p>
</div>

## Chapter 2: Why It Is Exploitable

After `free(ptr)`, the chunk enters a bin (fastbin, tcache, LFH, etc.). The allocator will eventually return this same address on a subsequent allocation of a similar size.

If the attacker can:

1. **Control** the next allocation of that size
2. **Place** attacker-controlled data at the same address

Then the original dangling pointer now points to attacker-controlled memory.

### The Classic Exploitation Flow

<div class="manga-panel">
  <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; text-align: center;">
    <div>
      <div style="font-size: 2rem;">📦</div>
      <div style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">Allocate Object A</div>
    </div>
    <div style="color: var(--text-muted); font-size: 1.5rem;">→</div>
    <div>
      <div style="font-size: 2rem;">🔓</div>
      <div style="font-size: 0.8rem; color: var(--danger); font-weight: 600;">Free Object A</div>
    </div>
    <div style="color: var(--text-muted); font-size: 1.5rem;">→</div>
    <div>
      <div style="font-size: 2rem;">💀</div>
      <div style="font-size: 0.8rem; color: var(--warning); font-weight: 600;">Allocate Object B</div>
    </div>
    <div style="color: var(--text-muted); font-size: 1.5rem;">→</div>
    <div>
      <div style="font-size: 2rem;">💥</div>
      <div style="font-size: 0.8rem; color: var(--success); font-weight: 600;">Exploit!</div>
    </div>
  </div>
</div>

**Step by step:**

1. **Allocate** object A (type `foo_t`).
2. **Free** object A. Pointer `p` dangles.
3. **Allocate** object B (type `bar_t`) of the same size.
4. The allocator gives B the same address as A.
5. Program uses `p` (thinking it's a `foo_t`), but it's now a `bar_t` under attacker control.

This is a **type confusion** scenario. Even without type confusion, if the dangling pointer is used for a function pointer or vtable dispatch, the attacker can redirect execution.

<div class="speech-bubble speech-bubble--right speech-bubble--danger">
  <strong style="color: var(--danger);">Attacker:</strong> "Your pointer thinks it's talking to a friendly object. But it's actually talking to ME."
</div>

## Chapter 3: Platform-Specific Variations

### Linux / ptmalloc

<div class="manga-panel manga-panel--success">
  <p style="margin: 0;"><strong style="color: var(--accent);">Tcache poisoning</strong> makes UAF exploitation extremely reliable. After freeing a chunk into tcache, corrupt its <code>fd</code> to point anywhere (e.g., <code>__free_hook</code> or a stack address).</p>
</div>

- If the chunk goes into fastbins, double-free protections are weak (no safe-linking in fastbins).
- **House of Botcake**, **House of Spirit**, and other techniques often chain off an initial UAF primitive.

### Windows / NT Heap

<div class="manga-panel manga-panel--warning">
  <p style="margin: 0;">LFH randomization means you cannot always predict which slot gets reused. <strong style="color: var(--warning);">Heap grooming</strong> is required: spray allocations of the target size to fill active subsegments, then free the target and reallocate with your controlled object.</p>
</div>

- Metadata encoding means you usually cannot corrupt allocator state directly through a UAF. Instead, you corrupt **application objects** that happen to live in the same LFH bucket.
- In the Windows kernel (pool allocator), UAFs are extremely common and often lead directly to arbitrary read/write via corrupted `_POOL_HEADER` or object type confusion.

## Chapter 4: Detection & Mitigations

| Mitigation | How It Helps | Limitations |
|-----------|-------------|-------------|
| **ASAN** (AddressSanitizer) | Tracks allocations with shadow memory; detects UAF at runtime. | 2-3x memory overhead; not deployed in production. |
| **Dangling pointer scrubbing** | Zero out pointers immediately after `free`. | Requires discipline; easy to miss in complex codebases. |
| **Safe unlinking** (glibc) | Validates `fd`/`bk` pointers during list operations. | Only protects small/large bins, not tcache. |
| **Safe linking** (glibc 2.32+) | XORs fastbin/tcache `fd` with heap address. | Makes tcache poisoning harder but not impossible. |
| **MemGC / Oilpan** (Browsers) | GC-like memory management for DOM/C++ bindings. | Performance cost; does not cover all object types. |

## Chapter 5: The Study Checklist

Before moving to case studies, understand:

- [ ] How `free()` decides which bin/tcache a chunk enters.
- [ ] How `malloc()` selects a chunk to return from a bin.
- [ ] What metadata exists at the dangling pointer's address after free.
- [ ] How to groom the heap so your controlled allocation reclaims the exact same slot.
- [ ] How to turn a UAF primitive into an arbitrary read, write, or code execution.

<div class="speech-bubble">
  <strong style="color: var(--success);">Sensei:</strong> "Master the allocator. Understand the bins. Only then can you break them."
</div>

## References

- [Azeria Labs - Use After Free](https://azeria-labs.com/heap-exploitation-part-4-learning-heap-exploitation-with-gdb/)
- *"Attacking the Android Heap"* by Joshua J. Drake
- Chrome / V8 UAF bug reports (e.g., CVE-2021-21220, CVE-2023-2033)

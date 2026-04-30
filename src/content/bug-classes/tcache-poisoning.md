---
title: "Tcache Poisoning"
description: "Corrupting the thread cache to achieve arbitrary allocation — the most reliable modern heap primitive on Linux."
severity: critical
prerequisites:
  - "Understanding of ptmalloc2 tcache internals"
  - "Ability to trigger a UAF or heap overflow"
  - "Knowledge of target libc version and safe-linking status"
affected:
  heap: true
  stack: false
  kernel: false
  userland: true
tags: ["tcache", "ptmalloc", "arbitrary-write", "linux"]
---

Tcache poisoning is the act of corrupting the `fd` (forward) pointer of a chunk in the thread cache, causing subsequent allocations to return attacker-controlled addresses. It is arguably the most reliable heap exploitation primitive on modern Linux systems.

## Why Tcache Is Vulnerable

The thread cache (`tcache`) was introduced in glibc 2.26 as a performance optimization. Each thread maintains its own cache of up to 7 recently freed chunks per size class. When `malloc()` is called, the allocator checks tcache first — before any locking or integrity checks.

Key weaknesses:
- **No integrity checks** on `fd` pointers (pre-glibc 2.32)
- **Per-thread**, so no contention with other threads
- **LIFO ordering** — predictable allocation sequence
- **Fast path** — skips most security validations

## The Primitive

### Pre-glibc 2.32 (No Safe-Linking)

```c
// 1. Allocate and free a chunk
void *a = malloc(0x40);
free(a);  // a enters tcache[0x40]

// 2. Corrupt a's fd pointer (via UAF or overflow)
// a->fd now points to __free_hook

// 3. First malloc returns a
void *b = malloc(0x40);  // b == a

// 4. Second malloc returns controlled address
void *c = malloc(0x40);  // c == __free_hook

// 5. Write target address
*(size_t *)c = system_addr;

// 6. Trigger
free(any_ptr);  // Calls system()
```

### Post-glibc 2.32 (Safe-Linking)

Safe-linking XORs the `fd` pointer with the heap base address shifted right by 12 bits:

```c
// Safe-linked fd = fd ^ (chunk_addr >> 12)
// To poison: write (target ^ (chunk_addr >> 12)) as fd
```

This requires:
1. **Heap leak** — know the chunk's address to compute the XOR
2. **Target address** — know where you want to allocate

Once you have a heap leak, safe-linking is bypassable:

```c
size_t safe_link = target ^ ((size_t)a >> 12);
*(size_t *)a = safe_link;
```

## Target Selection

| Target | glibc Version | Reliability |
|--------|--------------|-------------|
| `__free_hook` | All | High |
| `__malloc_hook` | All | High |
| `__realloc_hook` | All | High |
| `stdout->_IO_write_ptr` | All | Medium |
| `tls_dtor_list` | All | Medium |
| `environ` pointer | All | Medium (for stack leak) |
| GOT entries | All | Low (PIE required) |
| Vtable pointers | Application-specific | High |

## Modern Variants

### House of Botcake (tcache + fastbin overlap)

1. Fill tcache[0x40] with 7 chunks
2. Free an 8th chunk — it goes to fastbin
3. Free a 9th chunk adjacent to the 8th
4. They coalesce into a larger chunk
5. Reallocate and control the fastbin chunk's metadata
6. Re-enter fastbin, which now overlaps with tcache entries

### Tcache Stashing Unlink (House of Lore variant)

Abuse the `tcache_put()` and `tcache_get()` macros to stash arbitrary pointers into tcache bins without ever having a valid chunk at that address.

## Detection

- **glibc 2.32+ safe-linking** makes naive poisoning harder
- **Pointer encryption** (some hardened allocators) prevents this entirely
- **ASAN** catches the initial UAF/overflow, not the tcache corruption itself
- **Double-free detection** in tcache: glibc 2.29+ checks for duplicate entries

## References

- [shellphish/how2heap](https://github.com/shellphish/how2heap) — tcache_poison.c
- [Safe-Linking](https://research.checkpoint.com/2020/safe-linking-eliminating-a-20-year-old-malloc-exploit-primitive/) by Check Point Research
- [House of Botcake](https://github.com/vulns-1000/CTF-writeups/blob/master/2020/PlaidCTF-2020/mojo/mojo.md) writeup

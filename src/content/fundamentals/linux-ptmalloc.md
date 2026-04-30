---
title: "Linux ptmalloc2"
description: "glibc's heap allocator: chunks, arenas, bins, and the tcache."
order: 2
tags: ["ptmalloc", "glibc", "linux"]
platform: linux
---

ptmalloc2 is the allocator used by glibc. If you're writing C on Linux, this is what sits behind `malloc` / `free`.

## The Chunk

Every allocation returns a pointer to **user data**, but immediately before that pointer lives a `malloc_chunk` structure:

```c
typedef struct malloc_chunk {
    INTERNAL_SIZE_T mchunk_prev_size;  /* Size of previous chunk (if free) */
    INTERNAL_SIZE_T mchunk_size;       /* Size in bytes, including metadata */
    struct malloc_chunk* fd;           /* Forward pointer (if free) */
    struct malloc_chunk* bk;           /* Backward pointer (if free) */
} malloc_chunk;
```

The **size field** embeds three flags in its low bits:
- `PREV_INUSE` (0x1): Is the previous chunk allocated?
- `IS_MMAPPED` (0x2): Was this chunk allocated via `mmap`?
- `NON_MAIN_ARENA` (0x4): Does this chunk belong to a thread arena?

When a chunk is **allocated**, only `mchunk_prev_size` and `mchunk_size` are used. When it is **freed**, `fd` and `bk` become valid and link it into a bin.

## Arenas

To reduce lock contention in multithreaded programs, ptmalloc creates **per-thread arenas**. The main thread uses the **main arena** (served by `brk`), while additional threads get their own arenas (served by `mmap`).

## Bins

Free chunks are stored in **bins**, sorted by size and usage pattern:

| Bin Type | Size Range | Behavior |
|----------|-----------|----------|
| **Fastbins** | 0x20 – 0x80 (by default) | LIFO singly-linked list. No coalescing. Fast reallocation. |
| **Small bins** | < 0x400 bytes | Doubly-linked, FIFO. Coalescing enabled. |
| **Large bins** | ≥ 0x400 bytes | Doubly-linked, sorted by size. Best-fit search. |
| **Unsorted bin** | Any size | Temporary holding area before sorting into small/large bins. |
| **Tcache** | 0x20 – 0x408 (default) | Per-thread LIFO cache. Minimal safety checks. Introduced in glibc 2.26. |

## The Tcache

The **thread cache** (`tcache`) is the most important modern ptmalloc concept for exploitation:

- Each thread has its own tcache with up to 7 entries per size class.
- `free()` places chunks directly into tcache (if room exists).
- `malloc()` checks tcache first — no locking, extremely fast.
- **Security trade-off**: tcache has almost no integrity checks. A corrupted `fd` pointer in a tcache entry will be returned verbatim on the next allocation of that size.

This makes **tcache poisoning** one of the most reliable modern heap primitives:

1. Free chunk A into tcache.
2. Overwrite A's `fd` pointer (e.g., via a UAF or heap overflow) to point to an arbitrary address.
3. Allocate twice: first allocation gets A, second gets your arbitrary address.

## Classical Attacks

- **Unsafe unlink**: Corrupt `fd`/`bk` in a small/large bin chunk to achieve an arbitrary write when coalescing occurs.
- **House of Spirit**: Create a fake chunk on the stack or in `.bss`, then free it.
- **Fastbin dup**: Double-free a fastbin chunk to corrupt the fastbin linked list.
- **Tcache poisoning**: Corrupt the tcache `fd` pointer for arbitrary allocation.

## Notes for Further Study

- glibc version matters *a lot*. A technique that works on 2.27 may be patched by 2.35.
- Always check `mp_.tcache_count`, `mp_.tcache_bins`, and whether safe-linking is enabled (glibc 2.32+).

## References

- [shellphish/how2heap](https://github.com/shellphish/how2heap)
- [Understanding the glibc malloc implementation](https://sploitfun.wordpress.com/2015/02/10/understanding-glibc-malloc/)

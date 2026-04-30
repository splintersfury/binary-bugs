---
title: "Heap Overview"
description: "High-level anatomy of userland heap allocators and why they matter for exploitation."
order: 1
tags: ["memory", "allocators"]
platform: both
---

The heap is where a program stores dynamically allocated memory. Unlike the stack, which is deterministic and linear, the heap is a managed region where chunks of memory are requested (`malloc`, `HeapAlloc`) and later released (`free`, `HeapFree`). 

Understanding the heap is a prerequisite for studying **Use-After-Free**, **Heap Overflow**, **Double-Free**, and **Heap Feng Shui**.

## Why the Heap Matters

When you call `malloc(size)` (Linux) or `HeapAlloc(heap, 0, size)` (Windows), the allocator does not simply hand you raw memory. It:

1. Searches existing free chunks for a suitable size.
2. If none exist, requests more memory from the OS via `brk`/`mmap` (Linux) or reserves pages (Windows).
3. Returns a **user pointer** that points past internal metadata.

When you `free(ptr)`, the allocator:

1. Validates the pointer (sometimes).
2. Reads metadata adjacent to the user chunk.
3. Places the chunk into a **free list** or **bin** for later reuse.

The exploitability of heap bugs comes from corrupting this metadata or reusing a dangling pointer after the chunk has been recycled.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Chunk / Block** | The unit of allocation managed by the allocator. Contains metadata + user data. |
| **Bin / Free List** | A linked list of free chunks, categorized by size or recency. |
| **Coalescing** | Merging adjacent free chunks into a larger chunk to reduce fragmentation. |
| **Fastbin / LFH** | Small-chunk optimizations that trade security for speed. |
| **Metadata** | Size fields, flags, and pointers stored inline with user data. Corrupting these is the root of most heap exploits. |

## Platform Map

### Linux: ptmalloc2 (glibc)
- Derived from Doug Lea's allocator (`dlmalloc`).
- Uses **fastbins**, **small bins**, **large bins**, **unsorted bin**, and **tcache** (since glibc 2.26).
- Metadata lives **in-band** — right before the user pointer.
- Key structures: `malloc_chunk`, `malloc_state` (arena).

### Windows: Segment Heap + NT Heap
- Windows 10+ uses the **Segment Heap** for UWP/Modern apps and the **NT Heap** (with Low-Fragmentation Heap, LFH) for desktop.
- The LFH manages small allocations in fixed-size buckets.
- Metadata is largely **out-of-band** or stored in separate structures, making some classic attacks harder.
- Key structures: `_HEAP`, `_HEAP_ENTRY`, `_HEAP_SEGMENT`, `_LFH_HEAP`.

## Study Order

1. [Linux ptmalloc internals](/binary-bugs/fundamentals/linux-ptmalloc) — chunks, bins, tcache, and classical corruption.
2. [Windows heap internals](/binary-bugs/fundamentals/windows-heap) — LFH, segments, and Windows-specific mitigations.
3. [Use-After-Free](/binary-bugs/bug-classes/use-after-free) — the bug class that requires understanding both.

## References

- [how2heap](https://github.com/shellphish/how2heap) — CTF-oriented ptmalloc exploitation.
- *"Windows 10 Segment Heap Internals"* by Mark Yason (Black Hat 2016).
- [ Azeria Labs - Heap Exploitation](https://azeria-labs.com/heap-exploitation-part-1-understanding-the-glibc-heap-implementation/)

---
title: "Windows Heap"
description: "NT Heap, Segment Heap, and the Low-Fragmentation Heap on Windows."
order: 3
tags: ["nt-heap", "lfh", "segment-heap", "windows"]
platform: windows
---

Windows heap management is split across two primary allocators depending on the application type and Windows version. Desktop applications traditionally use the **NT Heap**, while modern UWP and some system processes use the **Segment Heap**.

## NT Heap (Desktop)

The NT Heap is the classic Windows allocator exposed via `HeapAlloc` / `HeapFree`. Internally it is implemented in `ntdll.dll`.

### Key Structures

- **`_HEAP`** — The top-level structure. Contains flags, segment list, and free lists.
- **`_HEAP_SEGMENT`** — A contiguous region of memory belonging to the heap.
- **`_HEAP_ENTRY`** — The chunk header. In modern Windows this is encoded (XORed) to prevent direct metadata tampering.
- **`_HEAP_VIRTUAL_ALLOC_ENTRY`** — For large allocations (`> 0x3FF0` bytes by default).

### Low-Fragmentation Heap (LFH)

Introduced in Windows Vista, the LFH is a sub-allocator within the NT Heap optimized for frequently allocated small blocks (≤ 16KB).

- Divides memory into fixed-size **buckets** (e.g., 0x20, 0x30, 0x40...).
- Each bucket contains multiple **subsegments**.
- Each subsegment is a contiguous block divided into equal-sized slots.
- The front-end allocator attempts to serve requests from LFH before falling back to the back-end NT Heap.

**From an attacker’s perspective:**
- LFH randomization (Windows 8+) makes predictable chunk placement harder than ptmalloc fastbins.
- However, once you understand the bucket sizes, **heap grooming** is still possible.
- LFH does not coalesce, so adjacent overflow into a freed LFH chunk is a classic path to UAF.

### Heap Metadata Encoding

Since Windows 10, `_HEAP_ENTRY` fields are **XOR-encoded** with the heap base address and a random cookie. This defeats trivial metadata overwrites but does not stop logic bugs or information leaks.

## Segment Heap

The Segment Heap is the default for modern Windows apps (Edge, UWP, some system processes). It is designed for performance and security:

- Uses **buckets** and **segments** like LFH, but at a global level.
- Metadata is stored **out-of-band** in a separate backend structure.
- Much harder to corrupt inline, but not impossible.

For vulnerability research, the NT Heap + LFH is still the most common target because:
1. Most third-party software uses it.
2. The allocator is well-documented through reverse engineering.
3. Classical techniques (heap grooming, pool spraying) still apply with adaptations.

## Key Differences from ptmalloc

| Feature | ptmalloc2 (Linux) | NT Heap (Windows) |
|---------|-------------------|-------------------|
| Metadata location | In-band (before user ptr) | In-band but encoded |
| Small-allocation optimization | Fastbins / tcache | LFH buckets |
| Coalescing | Yes (except fastbins/tcache) | No (LFH), yes (back-end) |
| Thread safety | Arenas + mutex | Lock-free per-heap |
| Chunk randomization | Minimal (until recent glibc) | LFH randomized since Win8 |

## Attacker's Mindset

On Windows, your goal is usually:
1. **Information leak** — defeat ASLR by leaking a heap address or module base.
2. **Heap grooming** — allocate and free in patterns that place a target chunk adjacent to a controllable one.
3. **Corruption** — overflow, UAF, or type confusion to corrupt an object in the same LFH bucket.
4. **Reuse** — reallocate the corrupted region with a controlled object (e.g., a string or array) to gain read/write primitives.

## References

- *"The Windows 10 Heap Internals"* by Yoann Dubreuil
- [Corentin's Windows Heap Exploitation series](https://corentinbayet.fr/)
- [Windows Exploit Development by FuzzySecurity](https://www.fuzzysecurity.com/tutorials.html)
- `!heap` commands in WinDbg

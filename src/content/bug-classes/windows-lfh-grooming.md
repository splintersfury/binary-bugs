---
title: "Windows LFH Grooming"
description: "Spraying, freeing, and reallocating to achieve deterministic chunk placement in the Windows Low-Fragmentation Heap."
severity: high
prerequisites:
  - "Understanding of Windows NT Heap and LFH internals"
  - "Ability to allocate and free chunks of controlled size"
  - "Knowledge of LFH bucket sizes and subsegment layout"
affected:
  heap: true
  stack: false
  kernel: false
  userland: true
tags: ["lfh", "windows", "heap-grooming", "type-confusion"]
---

Heap grooming on Windows is the process of carefully allocating and freeing chunks to achieve deterministic memory layout. Unlike ptmalloc's predictable fastbins, the Windows Low-Fragmentation Heap (LFH) randomizes chunk placement within subsegments. Grooming overcomes this randomization through statistical saturation.

## LFH Architecture

### Buckets

The LFH divides memory into fixed-size buckets:
- Bucket sizes: 0x8, 0x10, 0x18, 0x20, 0x28 ... up to 0x4000
- Each bucket contains multiple **subsegments**
- Each subsegment is a contiguous block divided into equal-sized slots

### Subsegment Randomization

Since Windows 8, LFH uses randomized slot allocation within subsegments:
- New allocations pick a random free slot
- This prevents predictable adjacency
- **However**, if a subsegment is full, the allocator creates a new one

## The Grooming Strategy

### Phase 1: Fill Active Subsegments

Allocate many chunks of the target size to fill all available slots in active subsegments:

```c
// Spray allocations to saturate LFH bucket
void *spray[0x100];
for (int i = 0; i < 0x100; i++) {
    spray[i] = HeapAlloc(GetProcessHeap(), 0, 0x40);
}
```

After spraying, the LFH has created multiple subsegments. Most slots are occupied.

### Phase 2: Create a Hole

Free exactly one chunk. This creates a single free slot in a saturated subsegment:

```c
// Free the target chunk
HeapFree(GetProcessHeap(), 0, spray[0x50]);
// spray[0x50] is now a free slot in a full subsegment
```

Because the subsegment is otherwise full, the next allocation of this size **must** return this exact slot (high probability).

### Phase 3: Reallocate with Controlled Object

Allocate an attacker-controlled object of the same size. It reclaims the freed slot:

```c
// Allocate controlled object — reclaims the hole
void *controlled = HeapAlloc(GetProcessHeap(), 0, 0x40);
// controlled now occupies the same memory as the freed spray[0x50]
```

### Phase 4: Trigger Vulnerability

If the original pointer (dangling or via overflow) now accesses this slot, it operates on attacker-controlled data.

## Type Confusion via LFH Grooming

A classic Windows UAF exploitation pattern:

```c
// Step 1: Allocate victim object
MyObject *victim = new MyObject();
// victim->vtable points to legitimate vtable

// Step 2: Free victim (but reference remains)
delete victim;
// victim pointer is now dangling

// Step 3: Groom LFH for 0x40 bucket
// ... spray allocations ...

// Step 4: Free one chunk to create hole
// ... free spray[i] ...

// Step 5: Allocate FakeObject at same address
FakeObject *fake = new FakeObject();
// fake occupies victim's former memory
// fake->vtable points to attacker-controlled address

// Step 6: Use dangling pointer
victim->virtual_method();  // Jumps to attacker address!
```

## Heap Feng Shui Variant

For more precise control, use **Heap Feng Shui** (deterministic heap layout):

1. Allocate many padding chunks to exhaust existing subsegments
2. Force creation of a fresh subsegment
3. Allocate target chunks in predictable positions
4. Free specific chunks to create holes at known offsets

This is harder on modern Windows due to LFH randomization but still possible with sufficient spray.

## Kernel Pool Grooming

Windows kernel exploitation uses the **Non-Paged Pool** or **Paged Pool**:

```c
// Allocate kernel objects of same size
for (i = 0; i < 0x1000; i++) {
    handles[i] = CreateEvent(NULL, FALSE, FALSE, NULL);
    // Events are ~0x40 bytes in the pool
}

// Free specific event to create hole
CloseHandle(handles[target]);

// Allocate vulnerable object — reclaims pool chunk
// Trigger UAF through driver ioctl
```

## Detection & Mitigations

| Mitigation | Effectiveness |
|-----------|--------------|
| **LFH randomization** (Win8+) | High — requires grooming to defeat |
| **Heap metadata encoding** | Medium — prevents direct metadata corruption |
| **Control Flow Guard (CFG)** | Medium — validates indirect call targets |
| **ASAN** | High — catches UAF at runtime |
| **MemGC / Oilpan** | High — prevents dangling pointers entirely |

## Key Differences from Linux

| Aspect | Linux ptmalloc | Windows NT Heap |
|--------|---------------|-----------------|
| Small chunk cache | Fastbins / tcache (deterministic) | LFH (randomized) |
| Exploitation approach | Corrupt allocator metadata | Corrupt application objects |
| Reliability | Very high | Medium (requires grooming) |
| Predictability | High (LIFO/FIFO) | Low (randomized) |
| Key primitive | Tcache/fastbin poisoning | Type confusion via grooming |

## References

- [Corentin's Windows Heap Exploitation](https://corentinbayet.fr/)
- [FuzzySecurity — Windows Exploit Development](https://www.fuzzysecurity.com/tutorials.html)
- [Windows 10 Segment Heap Internals](https://www.blackhat.com/docs/us-16/materials/us-16-Yason-Windows-10-Segment-Heap-Internals.pdf) by Mark Yason

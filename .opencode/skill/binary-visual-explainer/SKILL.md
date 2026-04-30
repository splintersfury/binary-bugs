---
name: binary-visual-explainer
description: Generate interactive SVG diagrams and visualizations specifically for binary exploitation, memory corruption, and vulnerability research concepts. Produces dark-themed, cyber-aesthetic diagrams that explain heap structures, bug classes, exploitation flows, and mitigations. Use when the user asks for diagrams of memory layouts, allocator internals, exploit chains, or vulnerability concepts.
license: MIT
metadata:
  author: splintersfury
  version: "0.1.0"
  repo: https://github.com/splintersfury/binary-bugs
---

# Binary Visual Explainer

Generate interactive, dark-themed SVG diagrams for binary exploitation concepts. Every diagram is a self-contained HTML file or Astro component that can be embedded in the binary-bugs knowledge base.

**When to use:**
- User asks for a diagram of heap structures, chunks, bins, or allocators
- User wants to visualize an exploitation flow (UAF, overflow, type confusion)
- User needs a comparison of mitigations across platforms
- User is explaining a vulnerability and needs visual aids
- Any time ASCII art would be used to explain memory layouts

**When NOT to use:**
- General architecture diagrams (use visual-explainer instead)
- Data tables without binary-specific context
- Non-technical diagrams

## Aesthetic Direction

**Theme:** Dark cyber-research lab. Deep void black backgrounds with electric cyan accents. Everything feels like a reverse engineering tool or debugger view.

**Palette:** See `./references/binary-palette.md`

**Typography:**
- Body: Inter (fallback: system-ui)
- Code/labels: JetBrains Mono
- Headings: Inter with tight tracking

**Forbidden:**
- Purple/violet gradients (AI slop)
- Inter + indigo combination
- Glowing animated box-shadows
- Emoji in section headers
- Neon cyan-magenta-pink combos

## Diagram Types

### Memory Layouts
Visualize memory regions, heap chunks, stack frames, or virtual address spaces. Use CSS Grid + inline SVG for precise control over byte offsets and field labels.

### Exploitation Flows
Step-by-step attack chains: allocate → corrupt → reuse → exploit. Use connected cards with animated arrows and state transitions.

### Allocator Structures
Internal structures of ptmalloc, NT Heap, LFH, tcache. Use SVG rectangles with metadata labels and pointer arrows.

### Mitigation Matrices
Compare security features across platforms (ASLR, DEP, CFG, CFI, etc.). Use styled HTML tables with status indicators.

### Register States
CPU register layouts during exploitation. Use monospace grid layouts.

## Workflow

### 1. Identify the Concept
What binary exploitation concept needs visualization?
- Heap internals (chunk structure, bins, tcache)
- Bug class anatomy (UAF, overflow, type confusion)
- Exploitation primitive (arbitrary read/write, infoleak)
- Mitigation comparison
- Attack chain / kill chain

### 2. Choose the Approach

| Concept Type | Rendering Approach | Why |
|---|---|---|
| Memory chunk/structure | Inline SVG with hover tooltips | Precise byte-level layout, interactive field exploration |
| Exploitation flow | Connected cards + animated arrows | Shows sequence and state transitions |
| Allocator overview | CSS Grid cards + SVG connectors | Multiple related structures (bins, arenas) |
| Mitigation matrix | HTML table with status badges | Structured comparison, copy-paste friendly |
| Register layout | Monospace grid | Exact bit/byte positioning |

### 3. Apply the Binary Bugs Aesthetic

Read `./references/binary-palette.md` for the exact color values.
Read `./references/diagram-patterns.md` for SVG patterns specific to binary exploitation.

Key visual rules:
- Background: `#0a0a0f` (deep void)
- Surface cards: `#161620`
- Primary accent: `#00f0ff` (electric cyan)
- Danger: `#ff4466` (corruption/red)
- Warning: `#ffb800` (caution/amber)
- Success: `#00ff9d` (mitigation/green)
- Borders: subtle, low-opacity
- Glow effects: static only, no animations

### 4. Build Interactivity

Every diagram should have:
- **Hover tooltips** on memory fields explaining their purpose
- **Click-to-expand** for complex diagrams
- **Step-by-step reveal** for exploitation flows (optional)
- **Color-coded states**: allocated (cyan), freed (red), corrupted (amber), controlled (green)

### 5. Deliver

**Output options:**
1. **Standalone HTML** → `~/.agent/diagrams/binary-<topic>.html` → open in browser
2. **Astro component** → save to `src/components/diagrams/` in binary-bugs repo
3. **Embedded SVG** → inline in Markdown content

**Filename convention:** `binary-<concept>-<platform>.html` (e.g., `binary-ptmalloc-chunk-linux.html`)

## Commands

- `generate-memory-layout` — Heap chunk, stack frame, or virtual memory layout
- `generate-exploit-flow` — Step-by-step exploitation chain
- `generate-mitigation-matrix` — Platform mitigation comparison

## Quality Checks

Before delivering:
- [ ] Does the diagram explain the concept better than text alone?
- [ ] Are byte offsets and field sizes accurate?
- [ ] Do hover tooltips provide useful context?
- [ ] Is the color coding consistent? (cyan=normal, red=freed/corrupted, amber=warning, green=controlled)
- [ ] Does it match the binary-bugs dark aesthetic?
- [ ] No animated glows or pulsing effects
- [ ] Typography uses Inter + JetBrains Mono

## Anti-Patterns

- Generic dark theme with blue/purple accents
- Inaccurate memory layouts (wrong offsets, field sizes)
- Overly complex diagrams that obscure the concept
- Missing interactivity on interactive diagrams
- ASCII art fallback when SVG is possible

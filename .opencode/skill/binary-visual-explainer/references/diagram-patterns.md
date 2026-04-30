# Diagram Patterns for Binary Exploitation

Reusable SVG and CSS patterns for memory layout and exploitation diagrams.

## Memory Chunk / Block

The fundamental building block. A rectangle representing a heap chunk or memory region.

```html
<div class="mem-chunk" style="
  width: 200px;
  height: 80px;
  border-radius: 8px;
  border: 1.5px solid var(--accent);
  background: rgba(0, 240, 255, 0.06);
  position: relative;
  padding: 12px;
">
  <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent); font-weight: 600;">
    Chunk Header
  </div>
  <div style="font-family: var(--font-mono); font-size: 9px; color: var(--text-muted); margin-top: 4px;">
    size: 0x40 | prev_inuse: 1
  </div>
</div>
```

### Chunk States

| State | Border | Background | Style |
|-------|--------|-----------|-------|
| Allocated | `--accent` solid | `rgba(0,240,255,0.06)` | Normal |
| Freed | `--danger` dashed | `rgba(255,68,102,0.06)` | Dashed border |
| Corrupted | `--warning` solid | `rgba(255,184,0,0.08)` | Thick border |
| Controlled | `--warning` solid | `rgba(255,184,0,0.06)` | Glow effect |

## Pointer Arrows

SVG arrows connecting memory regions.

```html
<svg style="position: absolute; width: 100%; height: 100%; pointer-events: none; top: 0; left: 0;">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="var(--accent)"/>
    </marker>
  </defs>
  <line x1="50" y1="20" x2="150" y2="20" 
        stroke="var(--accent)" stroke-width="1.5" 
        marker-end="url(#arrowhead)"/>
</svg>
```

## Address Labels

Monospace address labels for memory diagrams.

```html
<div style="
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  text-align: right;
  width: 80px;
">
  0x7fff8a20
</div>
```

## Metadata Field Highlight

Highlight a specific field within a chunk on hover.

```css
.chunk-field {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  background: transparent;
  transition: background 0.2s;
  cursor: help;
}

.chunk-field:hover {
  background: rgba(0, 240, 255, 0.1);
}
```

## Bin / List Structure

Visualize a linked list of chunks (fastbin, tcache, etc.).

```html
<div style="display: flex; align-items: center; gap: 8px;">
  <div class="mem-chunk" style="width: 60px; height: 40px;">
    <div style="font-size: 9px; text-align: center;">0x40</div>
  </div>
  <span style="color: var(--text-muted); font-size: 14px;">→</span>
  <div class="mem-chunk" style="width: 60px; height: 40px;">
    <div style="font-size: 9px; text-align: center;">0x40</div>
  </div>
  <span style="color: var(--text-muted); font-size: 14px;">→</span>
  <span style="color: var(--text-muted); font-family: var(--font-mono); font-size: 10px;">NULL</span>
</div>
```

## Exploitation Step Cards

Cards representing steps in an exploit chain.

```html
<div style="
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid var(--accent);
">
  <div style="font-size: 10px; font-family: var(--font-mono); color: var(--accent); margin-bottom: 8px;">
    STEP 1: ALLOCATE
  </div>
  <div style="font-size: 13px; color: var(--text-secondary);">
    Program allocates object A on the heap.
  </div>
</div>
```

## Register Layout

CPU register visualization.

```html
<div style="
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.8;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
">
  <div style="display: flex; justify-content: space-between;">
    <span style="color: var(--accent);">RAX</span>
    <span style="color: var(--text-secondary);">0x00007fff8a204000</span>
  </div>
  <div style="display: flex; justify-content: space-between;">
    <span style="color: var(--accent);">RBX</span>
    <span style="color: var(--text-secondary);">0x0000000000000000</span>
  </div>
  <!-- ... -->
</div>
```

## Status Badges

Small inline labels for vulnerability/mitigation status.

```html
<span style="
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  background: var(--success-dim);
  color: var(--success);
">
  <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
  Enabled
</span>
```

## Mitigation Comparison Table

```css
.mitigation-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.mitigation-table th {
  background: var(--bg-elevated);
  padding: 10px 12px;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border);
}

.mitigation-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}
```

## Animation Patterns

### Fade In Up
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Pulse Border (for dangling pointers)
```css
@keyframes pulseBorder {
  0%, 100% { border-color: rgba(255, 68, 102, 0.4); }
  50% { border-color: rgba(255, 68, 102, 0.9); }
}
```

### Typewriter Cursor
```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

## Responsive Rules

```css
@media (max-width: 768px) {
  .diagram-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .mem-chunk {
    min-width: 120px;
  }
}
```

# Binary Bugs Color Palette

The canonical color system for all binary exploitation diagrams.

## Core Colors

```css
:root {
  --bg: #0a0a0f;
  --bg-elevated: #12121a;
  --bg-card: #161620;
  --border: #1e1e2e;
  --border-hover: #2a2a3f;
  
  --text: #e2e2e2;
  --text-secondary: #6e6e8a;
  --text-muted: #4a4a5e;
  
  --accent: #00f0ff;
  --accent-dim: rgba(0, 240, 255, 0.1);
  --accent-glow: rgba(0, 240, 255, 0.3);
  
  --danger: #ff4466;
  --danger-dim: rgba(255, 68, 102, 0.1);
  
  --warning: #ffb800;
  --warning-dim: rgba(255, 184, 0, 0.1);
  
  --success: #00ff9d;
  --success-dim: rgba(0, 255, 157, 0.1);
}
```

## Semantic Usage

| Color | Meaning | Use For |
|-------|---------|---------|
| `--accent` (cyan) | Normal/Active | Allocated memory, valid pointers, primary actions |
| `--danger` (red) | Freed/Corrupted | Freed chunks, dangling pointers, corrupted state |
| `--warning` (amber) | Warning/Controlled | Attacker-controlled data, suspicious state |
| `--success` (green) | Mitigation/Secure | Security features, safe operations, mitigations |

## Memory State Color Coding

Always use these colors consistently across all memory layout diagrams:

- **Allocated chunk**: Border `--accent`, background `--accent-dim`
- **Freed chunk**: Border `--danger`, background `--danger-dim`, dashed border
- **Corrupted field**: Background `--warning-dim`, text `--warning`
- **Attacker-controlled**: Border `--warning`, background `--warning-dim`
- **Metadata/header**: Border `--warning` (amber), distinct from data
- **Safe/Protected**: Border `--success`, background `--success-dim`

## Typography

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
```

## Glow Effects

Static glows only — no animations:

```css
.glow-text {
  text-shadow: 0 0 40px rgba(0, 240, 255, 0.3), 0 0 80px rgba(0, 240, 255, 0.1);
}

.glow-border {
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.05);
}
```

## Background Patterns

```css
/* Subtle grid */
.grid-bg {
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Radial glow behind focal area */
.radial-glow {
  background-image: radial-gradient(ellipse at 50% 0%, rgba(0, 240, 255, 0.05) 0%, transparent 60%);
}
```

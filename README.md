# Texo

> **Weave Text into UI.**
> A stream-oriented Generatable UI framework for the LLM era.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Concept

**Texo** (Latin for *weave, construct*) is a framework designed to bridge the gap between **LLM Streaming Text** and **Native UI Components**.

Unlike Vercel's `v0` or standard generative UI tools that rely on brittle JSON or raw HTML generation, Texo uses a robust, human-readable syntax (**Markdown Directives + YAML**) to "weave" UI components in real-time.

It is platform-agnostic, supporting **React (Web)**, **React Native (Mobile)**, and even **Legacy Web (Standalone)** via CDN.

## Why Texo?

- **Stream-First:** Renders UI incrementally as the LLM types, without waiting for a complete JSON object.
- **Fault Tolerant:** If the syntax breaks, it gracefully degrades to text/code blocks. No white screens.
- **Platform Agnostic:** Write the parser once (`@texo-ui/core`), render anywhere (`@texo-ui/react`, `@texo-ui/native`).
- **Drop-in Ready:** Use it on WordPress, jQuery sites, or raw HTML via CDN without a build step.
- **Developer Control:** You define the components; the LLM just invokes them.

## Architecture

Texo transforms a stream of text into a Virtual UI Tree (AST) and reconciles it with your component registry.

```mermaid
graph LR
    A[LLM Stream] -->|Markdown/YAML| B(Texo Parser)
    B -->|UI AST| C{Renderer}
    C -->|Web| D[React Components]
    C -->|Mobile| E[React Native Views]
    C -->|CDN| F[Standalone Widget]
```

## Usage Preview

### 1. The Protocol (LLM Output)
The LLM generates standard Markdown mixed with **UI Directives**:

```markdown
Here is the analysis of your server costs:

::: stats-card
title: "Monthly Cost"
value: "$1,240"
trend: "up"
:::

And the details:

::: data-table
columns: ["Service", "Cost"]
data:
  - ["EC2", 800]
  - ["RDS", 440]
:::
```

### 2. Integration: React (Modern Web)

```jsx
import { TexoRenderer } from '@texo-ui/react';
import { StatsCard, DataTable } from './design-system';

const registry = {
  'stats-card': StatsCard,
  'data-table': DataTable,
};

function ChatInterface({ stream }) {
  return (
    <TexoRenderer 
      content={stream} 
      registry={registry} 
      fallback={MarkdownView} 
    />
  );
}
```

### 3. Integration: Standalone (CDN / Legacy Web)
You can use Texo without a build step (like webpack/vite). Just drop a script tag.

```html
<script src="[https://cdn.jsdelivr.net/npm/@texo-ui/standalone@latest/dist/texo.min.js](https://cdn.jsdelivr.net/npm/@texo-ui/standalone@latest/dist/texo.min.js)"></script>

<div id="texo-root"></div>

<script>
  // 3. Initialize (jQuery-style)
  const ui = Texo.init('#texo-root');

  // 4. Stream data from LLM (Push text chunk by chunk)
  llmSource.on('data', (chunk) => {
    ui.stream(chunk); 
  });

  // 5. Handle User Interaction (Bi-directional)
  // When user clicks a button in the generated UI, it simulates a chat input
  ui.on('action', (payload) => {
    console.log('User Action:', payload); 
    // e.g. { type: 'submit', value: 'Confirm Purchase' }
    
    // Send back to Chat Interface or LLM
    chatInput.value = payload.value;
  });
</script>
```

## Directory Structure

```text
texo/
├── packages/
│   ├── core/           # @texo-ui/core (Parser & AST)
│   ├── react/          # @texo-ui/react (Web Renderer)
│   ├── native/         # @texo-ui/native (React Native Renderer)
│   └── standalone/     # @texo-ui/standalone (CDN Bundle)
├── examples/           # Demo Projects
├── package.json        # Monorepo Root
└── README.md
```

## Roadmap

- [ ] **@texo-ui/core**: Streaming Markdown/YAML parser implementation.
- [ ] **@texo-ui/react**: React reconciler and hooks.
- [ ] **@texo-ui/native**: React Native adapter.
- [ ] **@texo-ui/standalone**: Pre-bundled version for CDN usage.
- [ ] **Schema Generator**: Auto-generate system prompts for LLMs based on component props.

## License

MIT © Texo Authors

# @texo-ui/react

> The React renderer for [Texo](https://github.com/WinM2M/texo-ui): a streaming UI tree,
> reconciled into components you own.

## You define the components; the model only invokes them

This is the line Texo draws, and everything about this package follows from it.

An agent that writes JSX writes *new* UI — new spacing, new colours, new interaction
patterns, invented on the spot and inconsistent with the last screen it produced. An agent
that emits Texo directives can only name things that already exist in your registry. It
chooses arrangement and content. It cannot choose implementation.

```tsx
import { TexoRenderer } from '@texo-ui/react';
import { createBuiltInComponents } from '@texo-ui/kit';

const registry = {
  ...createBuiltInComponents(),
  'invoice-card': InvoiceCard, // your component, your rules
};

<TexoRenderer content={stream} registry={registry} onAction={handleAction} />
```

A directive naming something absent from the registry does not crash and does not silently
vanish — it falls through to your `fallback`. The failure is visible and contained.

## Rendering is bidirectional

A generated screen that can only be looked at is a picture. Texo components dispatch
actions, and `onAction` hands them back to you as structured payloads:

```json
{ "type": "open-breakdown", "directive": "button",
  "value": { "label": "Open full breakdown", "action": "open-breakdown" } }
```

Feed that to the model and the conversation continues with the user's click as a turn in it.
The UI is part of the loop, not the end of it.

## Layout is the reconciler's job, not a component's

`grid` is handled by the reconciler itself rather than resolved through the registry,
because a layout container has to own cell geometry and the mount protocol before any child
can be placed. Directives declare where they mount (`mount: "board:1:2"`) and the reconciler
resolves that against the grid it built. Re-emitting a directive with an `id` it has used
before replaces it in place, so a model can revise a screen mid-conversation instead of
appending a second copy of it.

`theme` is handled the same way: it sets CSS custom properties on a scope and renders
nothing of its own. Both are exported as `LAYOUT_DIRECTIVES` and `CONTROL_DIRECTIVES` so
tooling can tell them apart from registry components.

## Streaming is the normal case

`useTexoStream` and `TexoRenderer` treat a partial tree as valid. Directives still arriving
carry `status: 'streaming'`; malformed ones surface through `onError` while the rest of the
document keeps rendering. There is no state in which the screen is blank because the
response is not finished.

## Install

```bash
npm install @texo-ui/react @texo-ui/kit
```

Requires React 18 or 19 as a peer dependency.

MIT © Youngjune Kwon

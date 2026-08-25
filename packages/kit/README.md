# @texo-ui/kit

> The vocabulary a model is allowed to speak — and the catalog that teaches it.
> Part of [Texo](https://github.com/WinM2M/texo-ui).

## Primitives, not bespoke components

Texo shipped a different design once: one purpose-built component per use case —
`tournament-bracket`, `tarot-deck`, `decision-matrix`, `auto-dashboard`. It was withdrawn,
and the reasoning is worth stating plainly, because it is the whole argument for this
package.

**A demo whose UI comes from a component written for that demo does not demonstrate the
framework. It demonstrates React.** If every new use case needs a new component, the model
never composed anything; a human did, in advance, and the model picked from a menu.

So the vocabulary is small, general and fixed:

```
stack  grid  button  checkbox  input  label  table  chart  rect  svg  theme
```

Everything is built by arranging these. The claim Texo makes — that a model can assemble a
real interface from a stable vocabulary — is only testable if the vocabulary refuses to grow
one entry per screen.

New expressive power should arrive as **new props on existing primitives**, or as a new
primitive justified by being reusable across unrelated use cases. `chart`'s drilldown and
date-axis props, and `grid`'s span protocol, are the intended shape of that growth. Anything
narrower belongs in *your* registry, not here — registering your own components alongside
`createBuiltInComponents()` is the supported and expected path.

## The catalog: documentation whose reader is a machine

`BUILTIN_COMPONENT_CATALOG` describes every primitive — name, summary, each prop with its
type and whether it is required, and a working example:

```ts
{
  name: 'button',
  summary: 'Action trigger button that emits an action payload.',
  props: [
    { name: 'label',  type: 'string', required: true, description: 'Visible button text.' },
    { name: 'action', type: 'string', required: true, description: 'Action id to emit.' },
    { name: 'variant', type: 'primary|secondary|ghost', description: 'Visual style.' },
    // ...selected, stylePreset
  ],
  example: ':> button\n - label: "Save"\n - action: "save-form"',
}
```

This is the same information a component library normally puts in prose documentation, in a
shape a model can consume. `TEXO_STREAM_PRIMER` is generated from it, so the prompt the
model receives is derived from the components that actually exist. A model cannot be told
about a prop that was never implemented, because there is nowhere to write such a lie.

That property is enforced, not aspired to. The test suite parses every catalog example and
asserts it produces the component it claims to document, using only props that entry
declares. Documentation drift is a build failure.

## Install

```bash
npm install @texo-ui/kit @texo-ui/react
```

```ts
import { createBuiltInComponents, BUILTIN_COMPONENT_CATALOG } from '@texo-ui/kit';
```

Note that `grid` and `theme` are absent from the registry on purpose: the reconciler in
`@texo-ui/react` owns them. They are still documented in the catalog, because the model may
emit them.

MIT © Youngjune Kwon

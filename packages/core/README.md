# @texo-ui/core

> Weave text into UI. The parser at the centre of [Texo](https://github.com/WinM2M/texo-ui).

## The idea

A language model does not return a user interface. It returns text, one token at a time.

Most generative-UI tools bridge that gap by asking the model for a JSON blob describing a
screen, then rendering it once the blob is complete and valid. That trade is worse than it
looks. You wait for the whole response before anything appears. A single missing brace
costs you the entire screen. And the model spends its budget producing syntax that exists
only to survive `JSON.parse`.

Texo takes the opposite position: **the stream is the interface.** Markdown is what models
are best at emitting, so Texo reads markdown, plus a directive form that is deliberately
line-oriented:

```
Here is the analysis of your server costs:

:> label
 - text: "Monthly cost: $1,240"

:> table
 - columns: ["Service", "Cost"]
 - rows: [{"Service":"EC2","Cost":800},{"Service":"RDS","Cost":440}]
```

Every line is meaningful on arrival. A directive opens on its header line and closes when
the indented block ends — no closing token to wait for, no bracket to balance. That is what
makes progressive rendering possible rather than merely simulated.

## Fault tolerance is a design constraint, not a feature

Models produce malformed output. Not occasionally — routinely, and more often at the tail
of a long response. A generative UI that assumes well-formed input is a UI that white-screens
in front of a user.

So `core` never throws at the caller for bad input. Unparseable content degrades to text or
a code block, the recovery manager records what happened, and the rest of the stream keeps
rendering. Partial output is a normal state with its own representation in the AST
(`status: 'streaming'`), not an error condition.

## Renderer-independent by construction

`core` produces an AST and holds no opinion about what draws it. It has no React import, no
DOM access, no platform assumptions. Parse once; render on the web with
[`@texo-ui/react`](https://www.npmjs.com/package/@texo-ui/react), on a plain page with
[`@texo-ui/standalone`](https://www.npmjs.com/package/@texo-ui/standalone), and on whatever
comes next by writing a renderer instead of a parser.

This package also owns `TEXO_STREAM_PRIMER`, the system prompt that teaches a model the
directive syntax. Keeping the prompt next to the parser is deliberate: the instructions a
model receives and the grammar that accepts its output should never be maintained
separately.

## Install

```bash
npm install @texo-ui/core
```

```ts
import { TexoPipeline } from '@texo-ui/core';

const pipeline = new TexoPipeline();
pipeline.push(chunk);        // call repeatedly as tokens arrive
const ast = pipeline.getAST(); // valid at every point in the stream
pipeline.end();
```

MIT © Youngjune Kwon

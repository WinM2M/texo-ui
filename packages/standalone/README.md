# @texo-ui/standalone

> [Texo](https://github.com/WinM2M/texo-ui) in one script tag. No build step, no bundler,
> no install.

```html
<script src="https://cdn.jsdelivr.net/npm/@texo-ui/standalone"></script>

<div id="texo-root"></div>

<script>
  var ui = Texo.init('#texo-root');

  ui.stream(':> label\n - text: "Monthly cost: $1,240"\n\n');
  ui.stream(':> button\n - label: "Open breakdown"\n - action: "open"\n\n');
  ui.end();

  ui.on('action', function (action) {
    console.log(action); // { type: 'open', directive: 'button', value: {...} }
  });
</script>
```

Live example: **https://winm2m.github.io/texo-ui/try.html**

## Why a bundle like this exists

Generative UI is usually packaged for the stack that produces the most conference talks:
React, a bundler, a framework, a deploy pipeline. Most software that would benefit from it
is not that. It is an internal tool on jQuery, a WordPress page, a support console someone
wrote in 2016, a CMS template nobody wants to migrate.

Those are exactly the places where an LLM assembling a small interactive panel is worth the
most, and exactly the places where "run `npm create`" is a non-starter. So the entire
framework — parser, reconciler, React, and the built-in component vocabulary — is compiled
into a single self-contained file with a global entry point. Around 92 kB gzipped, and
nothing to configure.

## Isolated by default

Rendering happens inside a shadow root. A 2016 stylesheet with `button { }` selectors cannot
reach into the generated UI, and the generated UI cannot leak out into the host page. On a
page you did not write and cannot refactor, that isolation is what makes the whole idea
usable rather than merely possible.

## The same contract as the rest of Texo

The stream renders progressively, malformed directives degrade instead of throwing, and
interactions come back out as structured actions you can hand to the model. Your own
components are still yours:

```js
// renderFn receives (container, props) and may return a cleanup function.
ui.registerComponent('invoice-card', function (container, props) {
  container.innerHTML = '<div class="invoice">' + props.title + '</div>';
});
```

## Instance API

`stream(chunk)` · `end()` · `reset()` · `render(content)` · `on(event, fn)` ·
`off(event, fn)` · `registerComponent(name, fn)` · `addStyle(css)` · `destroy()`

Events: `action`, `error`, `ready`.

## Other ways to load it

| Source | URL |
|---|---|
| npm via jsDelivr | `https://cdn.jsdelivr.net/npm/@texo-ui/standalone` |
| Straight from the repo | `https://cdn.jsdelivr.net/gh/WinM2M/texo-ui@main/docs/cdn/texo.min.js` |
| GitHub Pages | `https://winm2m.github.io/texo-ui/cdn/texo.min.js` |

The published package has no runtime dependencies. React is inside the bundle; installing
this package does not pull a second copy into your tree.

MIT © Youngjune Kwon

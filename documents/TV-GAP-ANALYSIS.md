# What a living-room build asked Texo for, and where it had to step outside

On 2026-10-04 Texo drove a real screen for the first time: a Google TV in a living
room, rendering a Claude conversation and then a CGV showtime picker, driven by a
TV remote. The whole surface is `@texo-ui/standalone` in a WebView.

It worked. But each new request from the user landed outside the directive
vocabulary, and the same ~250 lines of host code kept growing. This is a record of
which request broke which boundary, because the pattern is consistent enough to be
a roadmap.

## The seven requests, in the order they arrived

| # | Request | Where Texo stopped | Host code it cost |
|---|---|---|---|
| 1 | Put the conversation on the TV | `:> theme` sets colour, not scale. Nothing addresses 10-foot type, overscan safe area, or density | A whole stylesheet in `vmin` |
| 2 | Let the remote answer back | No focus model, no navigation, and the shadow root hides every rendered button from `document.querySelectorAll` | Shadow-piercing collector + focus ring + numbered key handler |
| 3 | Thumbnails beside each film | Directives do not nest and `card` has no image slot | Custom `poster-row` component |
| 4 | Tiles, not a list | Only `table` accepts an array. Six films means six directives, and no way to lay them out as a grid | Custom `poster-grid` component |
| 5 | A QR beside every showtime | Same collection problem, plus only `button` can carry an action — a tile cannot be pressed | Custom `showtime-grid` component |
| 6 | (implicit) know which button was pressed | The action event arrives as `{type, value:{action,label}}`; reading `.action` yields nothing, so every model-authored button looked identical | Payload re-interpretation |
| 7 | (implicit) keep the screen correct | A custom component can be rendered twice into the same container, and `items` sometimes arrives as a string | Defensive `container.textContent = ''` and `JSON.parse` |

Requests 3, 4 and 5 are one request wearing three hats: **show me a collection and
let me choose from it.** That is the shape of most generated UI, and it is the one
shape Texo cannot express today.

## Proposals

### P0 — Collection primitives that take `items`

```markdown
:> tiles
 - columns: 4
 - items: [{"title":"오디세이","media":"https://…/poster.jpg","meta":"15세 · IMAX",
            "caption":"20:55 · 00:20","action":"movie:30001323"}]
```

Three of them cover what came up: `tiles` (media-led), `list` (row-led),
`options` (choice-led). `table` already proves the model can emit an array of
records; this just lets that array become layout instead of a grid of cells.

This alone removes roughly 80% of the host code written today.

### P0 — `action:` on any directive, and one action shape

Any component that carries `action:` becomes activatable. Every activation reports
the same record:

```js
{ action: 'movie:30001323', label: '오디세이', component: 'tiles', item: {…} }
```

Today only `button` is pressable, and its payload has to be reverse-engineered.

### P1 — A navigation model, not just a renderer

```js
Texo.init('#out', { navigation: 'numeric' })   // 'pointer' | 'dpad' | 'numeric'
ui.actions()        // the activatable nodes, in reading order
ui.focus(n); ui.activate(n)
```

A TV remote is the hard case, but the same API serves kiosks, keyboards and screen
readers. `numeric` should also paint the index badge the host otherwise has to draw.
Note the trigger: on this TV the browser consumes the arrow keys for its own
pointer, so the page never sees them — a renderer that owns focus has to own the
key contract too.

### P1 — A scale axis on `theme`

```markdown
:> theme
 - preset: "midnight-dark"
 - scale: "tv"        # tv | desktop | compact
 - safeArea: 3        # percent, for overscan
```

Colour is already a first-class prop; size is not, and it is the difference between
a page that reads from 50cm and one that reads from 3m.

### P2 — Media in `card`, or a `media-card`

Request 3 was a one-liner that cost a component. `card - media: "<url>"` with a
side/top placement would have been enough.

### P2 — A written contract for `registerComponent`

Document that the adapter owns the container and may re-render; coerce declared
props (`items: 'array'`, `columns: 'number'`) before they reach the render
function. Both of today's bugs were contract gaps, not logic errors.

### P2 — Partial update

Every turn here re-streamed the whole screen (`reset()` + `stream()`), because
there is no way to replace one region. A dashboard needs `:> update - target: "…"`.

### P3 — Smaller things that surfaced

- Inline markdown (`**bold**`) renders literally in body copy in some paths.
- An unknown directive dumps its source; a labelled placeholder would degrade better.
- `image` has no error/fallback behaviour — on a memory-tight TV, broken images
  left holes until the host added an `onerror` handler.

### P3 — Harvest the TV preset

The components written today (`tiles`, showtime tiles, the numbered focus ring, the
10-foot stylesheet) are a `@texo-ui/tv` preset waiting to happen. They live in
`/contents/workspace/claude-tv/relay/web/tv.html` and are MIT-compatible with this
repo.

## What Texo got right, for the record

- The stream never white-screened, including while a model-authored directive was
  half-written.
- Fallback to text meant an unknown `:> poster-grid` degraded to a code block
  instead of breaking the screen — the bug was visible, not fatal.
- Shadow-root isolation meant the TV page's own stylesheet could not leak in, which
  is exactly why the rendered UI looked the same on a 1.38GB Android TV as in a
  desktop Chromium.
- `registerComponent` + `addStyle` made every gap above *workable* in an evening.
  The argument here is not that Texo blocked the work; it is that the same four
  components keep getting rewritten by every host.

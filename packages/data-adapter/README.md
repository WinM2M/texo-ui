# @texo-ui/data-adapter

> Bring your own storage. Part of [Texo](https://github.com/WinM2M/texo-ui).

## The idea: serverless in the literal sense

If a language model can generate the interface on demand, the interesting question is what
happens to everything behind it. A conventional answer keeps the backend and merely changes
who writes the frontend. Texo's answer is that for a large class of small tools, there
should be no backend at all — and no database you operate on someone else's behalf.

An expense tracker, a reading list, a decision log, a personal inventory. Each is a few
fields and a file. The user already has somewhere to put a file: their disk, their Google
Drive, their Notion workspace. Standing up a service to hold it on their behalf creates an
account to manage, a privacy question to answer, a migration to promise, and a bill to pay —
for data the user could simply have kept.

So `data-adapter` treats the user's own storage as the database:

| Driver | Where the data lives |
|---|---|
| `LocalStorageDriver` | The browser, and nowhere else |
| `GoogleDriveDriver` | The user's Drive, in the app-data folder |
| `NotionDriver` | The user's Notion workspace |
| `RemoteHttpDriver` | A backend, when you genuinely have one |

## One CRUD interface, swappable underneath

Every driver implements the same interface, so the choice of storage is configuration
rather than architecture. Prototype against `LocalStorageDriver`, ship on
`GoogleDriveDriver`, and move to `RemoteHttpDriver` the day a use case actually earns a
server — without rewriting the code that reads and writes.

This is the same instinct as the rest of Texo: keep the parts that vary at the edges, and
let the middle stay small. The parser does not know which renderer draws it; the renderer
does not know which model produced the stream; and the data layer does not know whose disk
it is writing to.

## Install

```bash
npm install @texo-ui/data-adapter
```

```ts
import { DataAdapter, createDriver } from '@texo-ui/data-adapter';

const store = new DataAdapter();
store.registerDriver(createDriver('local-storage', { prefix: 'expenses_' }));
await store.use('local-storage');

await store.create('expenses', { label: 'EC2', amount: 800 });
const all = await store.list('expenses');
```

Swapping storage is one line — `createDriver('google-drive', { ... })` and
`store.use('google-drive')` — because every driver satisfies the same CRUD contract.

MIT © Youngjune Kwon

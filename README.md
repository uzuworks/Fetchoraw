# Fetchoraw

[![npm version](https://img.shields.io/npm/v/fetchoraw)](https://www.npmjs.com/package/fetchoraw)
[![MIT License](https://img.shields.io/npm/l/fetchoraw)](./LICENSE)
![type: module](https://img.shields.io/badge/type-module-green)

**Fetchoraw** is a small library to rewrite asset URLs in HTML.
You can replace `src`, `href`, and other attributes using your own resolver.

[Read this page in Japanese →](./README.ja.md)

---

## ✨ Features

* Rewrite asset links in HTML or structured content
* Fully customizable with your own resolver
* Supports both full HTML rewriting and individual URL resolution
* Built-in resolvers for data URLs, file saving, smart handling
* Gracefully handles environments like Cloudflare Workers where Node.js modules are unavailable.

---

## 📦 Install

```bash
npm install fetchoraw
```

---

## 🚀 Usage

### Rewrite HTML with a custom resolver

```ts
import { Fetchoraw } from 'fetchoraw';

const resolver = async (url: string) =>
  url.replace('https://cdn.example.com/', '/assets/');

const fetchoraw = new Fetchoraw(resolver);
const { html, map } = await fetchoraw.html(
  '<img src="https://cdn.example.com/logo.png">'
);

console.log(html); // <img src="/assets/logo.png">
console.log(map);  // [{ url: 'https://cdn.example.com/logo.png', resolvedPath: '/assets/logo.png' }]
```

### Resolve a single URL

```ts
const fetchoraw = new Fetchoraw(resolver);
const result = await fetchoraw.url('https://cdn.example.com/logo.png');

console.log(result.path); // /assets/logo.png
```

---

## 🛠 API Overview

### `Fetchoraw`

```ts
new Fetchoraw(resolver, options?)
```

* `resolver`: `(url: string, options?: RequestInit) => Promise<string | { path: string, data?: unknown }> `
* `options.envModeName?`: env var name to control rewriting (default: `PUBLIC_FETCHORAW_MODE`)
* `options.enableFetchEnvValue?`: value to enable rewriting (default: `FETCH`)
* `options.enableCacheEnvValue?`: value to read from cache (default: `CACHE`)
* `options.cacheFilePath?`: file to store cache (default: `cache/fetchoraw_cache.json`)

#### Methods

##### `html(html: string, config?)`

* `config.selectors?`: selectors/attributes to rewrite (default presets: `img[src]`, `source[srcset]`, etc.)
* Returns `{ html, map }`

##### `url(url: string, origin?, fetchOptions?)`

* Resolves a single URL
* Returns `{ path, data?, map }`

---

## 🧙 Built-in Resolvers

You can use any of the included resolvers depending on your use case:

### `createDataUrlResolver()`

Fetches and inlines assets as base64 `data:` URLs.

```ts
import { createDataUrlResolver } from 'fetchoraw/resolvers';

const resolver = createDataUrlResolver();
```

Options:

* `inlineLimitBytes`: max size to inline (default: 2MB)
* `allowMimeTypes`: allowed types (default: image/audio/video/pdf)

---

### `createFileSaveResolver()`

Saves remote assets to the local filesystem.

```ts
import { createFileSaveResolver } from 'fetchoraw/resolvers';

const resolver = createFileSaveResolver({
  saveRoot: 'public/assets',
  prependPath: 'assets'
});
```

Options:

* `saveRoot`: root folder to store files (default: `dist/assets`)
* `prependPath`: prefix in rewritten paths (default: `assets`)
* `keyString`: pattern to strip from saved paths (default: URL base)

---

### `createSmartResolver()`

Combines `data:` and file saving based on file size and URL pattern.

```ts
import { createSmartResolver } from 'fetchoraw/resolvers';

const resolver = createSmartResolver({
  inlineLimitBytes: 500000,
  requireFilePatterns: [/\.svg$/]
});
```

* Small files are inlined
* Larger or matching `requireFilePatterns` are saved to file

---

### `createJsonFileSaveResolver()`

Fetches JSON and saves both the file and parsed data.

```ts
import { createJsonFileSaveResolver } from 'fetchoraw/resolvers';

const resolver = createJsonFileSaveResolver();
```

Useful for working with CMS APIs, feeds, config files, etc.

---

## 📄 License

MIT

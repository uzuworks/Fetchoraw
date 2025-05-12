# Fetchoraw

[![npm version](https://img.shields.io/npm/v/fetchoraw)](https://www.npmjs.com/package/fetchoraw)
[![MIT License](https://img.shields.io/npm/l/fetchoraw)](./LICENSE)
![type: module](https://img.shields.io/badge/type-module-green)

**Fetchoraw** is a tiny library to transform asset URLs in HTML.
You can rewrite `src`, `href`, and other attributes using your custom resolver.

[Read this page in Japanese →](./README.ja.md)

---

## ✨ Features

* Rewrite HTML asset links easily
* Use your own resolver for URL rewriting
* Supports both full HTML and individual URL resolution
* Simple and flexible API

---

## 📆 Install

```bash
npm install fetchoraw
```

---

## 🚀 Usage

### Rewrite HTML with custom resolver

```ts
import { Fetchoraw } from 'fetchoraw';

const resolver = async (url: string) =>
  url.replace('https://cdn.example.com/', '/assets/');

const fetchoraw = new Fetchoraw(resolver);
const { output: html, map } = await fetchoraw.html(
  '<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>'
);

console.log(html); // <html><body><img src="/assets/images/pic.png"></body></html>
console.log(map);  // Map { "https://cdn.example.com/images/pic.png" => "/assets/images/pic.png" }
```

### Resolve a single URL

```ts
const fetchoraw = new Fetchoraw(resolver);
const { output: newUrl } = await fetchoraw.url('https://cdn.example.com/images/pic.png');

console.log(newUrl); // "/assets/images/pic.png"
```

---

## 🛠 Overview

### Fetchoraw class

* `new Fetchoraw(resolver, options?)`

  * `resolver`: `(url: string) => Promise<string>`
  * `options.envModeName?`: environment variable name to control rewriting (default: `"FETCHORAW_MODE"`)
  * `options.enableEnvValue?`: value that enables rewriting (default: `"FETCH"`)

* `await fetchoraw.html(html, config?)`

  * `html`: input HTML string
  * `config.selectors?`: target selectors to rewrite (default presets provided)
  * returns `{ output: string, map: Map<string, string> }`

* `await fetchoraw.url(url, origin?)`

  * `url`: target URL string (absolute, relative, or protocol-relative)
  * `origin?`: base origin to resolve relative URLs
  * returns `{ output: string, map: Map<string, string> }`

---

## 🧙‍♂️ Resolver Types

You can create your own resolver or use built-in resolvers:

### Data URL Resolver

Fetches a file and inlines it as a base64 `data:` URL.

```ts
import { createDataUrlResolver } from 'fetchoraw';

const resolver = createDataUrlResolver();
const fetchoraw = new Fetchoraw(resolver);
const { output: html } = await fetchoraw.html('<img src="https://cdn.example.com/images/pic.png">');

console.log(html); // <img src="data:image/png;base64,...">
```

### File Save Resolver

Downloads a file and saves it to your local filesystem.

```ts
import { createFileSaveResolver } from 'fetchoraw';

const resolver = createFileSaveResolver({
  saveRoot: 'public/assets',
  prependPath: 'assets'
});
const fetchoraw = new Fetchoraw(resolver);
const { output: html } = await fetchoraw.html('<img src="https://cdn.example.com/images/pic.png">');

console.log(html); // <img src="/assets/images/pic.png">
```

### Smart Resolver

Tries to inline small files as data URLs, otherwise saves as local files.

```ts
import { createSmartResolver } from 'fetchoraw';

const resolver = createSmartResolver({ inlineLimitBytes: 500000 });
const fetchoraw = new Fetchoraw(resolver);
const { output: html } = await fetchoraw.html('<img src="https://cdn.example.com/images/pic.png">');

// Result depends on file size: data URL or saved path
console.log(html);
```

---

## 📄 License

MIT

# Fetchoraw

[![npm version](https://img.shields.io/npm/v/fetchoraw)](https://www.npmjs.com/package/fetchoraw)
[![MIT License](https://img.shields.io/npm/l/fetchoraw)](./LICENSE)

**Fetchoraw** is a tiny library to transform asset URLs in HTML.
You can rewrite `src`, `href`, and other attributes using your custom resolver.

[Read this page in Japanese →](./README.ja.md)

---

## ✨ Features

- Rewrite HTML asset links easily
- Use your own resolver for URL rewriting
- Simple and flexible API

---

## 📆 Install

```bash
npm install fetchoraw
```

---

## 🚀 Usage

```ts
import { Fetchoraw } from 'fetchoraw';

// Example: Rewrite a CDN URL to a local asset path
const resolver = async (url: string) => url.replace('https://cdn.example.com/', '/assets/');

const fetchoraw = new Fetchoraw(resolver);
const { html, map } = await fetchoraw.exec(
  '<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>'
);

console.log(html); // <html><body><img src="/assets/images/pic.png"></body></html>
console.log(map);  // Map { "https://cdn.example.com/images/pic.png" => "/assets/images/pic.png" }
```

---

## 🛠 Overview

### Fetchoraw class

- `new Fetchoraw(resolver, options?)`
  - `resolver`: `(url) => Promise<string>`
  - `options.envModeName?`: environment variable name to control rewriting (default: `"FETCHORAW_MODE"`)
  - `options.enableEnvValue?`: value that enables rewriting (default: `"FETCH"`)

- `await fetchoraw.exec(html, config?)`
  - `html`: input HTML string
  - `config.selectors?`: target selectors to rewrite (default presets provided)

### Resolver Types

You can create your own resolver or use built-in resolvers:

- **Data URL Resolver**: Fetches a file and inlines it as a base64 `data:` URL.

  ```ts
  import { createDataUrlResolver } from 'fetchoraw';

  const resolver = createDataUrlResolver();
  const fetchoraw = new Fetchoraw(resolver);
  const { html } = await fetchoraw.exec('<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>');

  console.log(html); // <html><body><img src="data:image/png;base64,..."></body></html>
  ```

- **File Save Resolver**: Downloads a file and saves it to your local filesystem.

  ```ts
  import { createFileSaveResolver } from 'fetchoraw';

  const resolver = createFileSaveResolver({ saveRoot: 'public/assets', prependPath: 'assets' });
  const fetchoraw = new Fetchoraw(resolver);
  const { html } = await fetchoraw.exec('<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>');

  console.log(html); // <html><body><img src="/assets/images/pic.png"></body></html>
  ```

- **Smart Resolver**: Tries to inline small files as data URLs, otherwise saves as local files.

  ```ts
  import { createSmartResolver } from 'fetchoraw';

  const resolver = createSmartResolver({ inlineLimitBytes: 500000 });
  const fetchoraw = new Fetchoraw(resolver);
  const { html } = await fetchoraw.exec('<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>');

  console.log(html); // data URL or saved path based on file size
  ```

---

## 📄 License

MIT


# Fetchoraw（日本語版）

[![npm version](https://img.shields.io/npm/v/fetchoraw)](https://www.npmjs.com/package/fetchoraw)
[![MIT License](https://img.shields.io/npm/l/fetchoraw)](./LICENSE)
![type: module](https://img.shields.io/badge/type-module-green)

**Fetchoraw** は、HTML内のアセットURLを書き換えるための軽量ライブラリです。  
`src` や `href` などの属性を、独自のリゾルバを使って自由に置き換えることができます。

---

## ✨ 特長

- HTMLや構造化コンテンツ内のアセットリンクを一括書き換え
- 独自のリゾルバで柔軟に制御可能
- HTML全体、または単一URLの解決に対応
- `data:` URL、ファイル保存、スマート切り替えなどの組み込みリゾルバ付き
* Cloudflare Workers で動作確認済み


---

## 📦 インストール

```bash
npm install fetchoraw
```

---

## 🚀 使い方

### カスタムリゾルバでHTMLを書き換える

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

### 単一のURLを解決する

```ts
const fetchoraw = new Fetchoraw(resolver);
const result = await fetchoraw.url('https://cdn.example.com/logo.png');

console.log(result.path); // /assets/logo.png
```

---

## 🛠 API概要

### `Fetchoraw` クラス

```ts
new Fetchoraw(resolver, options?)
```

- `resolver`: `(url: string, options?: RequestInit) => Promise<string | { path: string, data?: unknown }>`
- `options.envModeName?`: 環境変数名（デフォルト: `PUBLIC_FETCHORAW_MODE`）
- `options.enableFetchEnvValue?`: 書き換えを有効にする値（デフォルト: `FETCH`）
- `options.enableCacheEnvValue?`: キャッシュを使用する値（デフォルト: `CACHE`）
- `options.cacheFilePath?`: キャッシュファイルのパス（デフォルト: `cache/fetchoraw_cache.json`）

#### メソッド

##### `html(html: string, config?)`

- `config.selectors?`: 対象セレクタと属性（デフォルト: `img[src]`, `source[srcset]` など）
- 戻り値: `{ html, map }`

##### `url(url: string, origin?, fetchOptions?)`

- 単一のURLを解決
- 戻り値: `{ path, data?, map }`

---

## 🧙 組み込みリゾルバ

ユースケースに応じて以下のリゾルバを利用できます：

### `createDataUrlResolver()`

ファイルを取得して `data:` URL（base64）としてインライン化。

```ts
import { createDataUrlResolver } from 'fetchoraw/resolvers';

const resolver = createDataUrlResolver();
```

オプション:
- `inlineLimitBytes`: インライン化の最大サイズ（デフォルト: 2MB）
- `allowMimeTypes`: 対象のMIMEタイプ（画像・音声・動画・PDFなど）

---

### `createFileSaveResolver()`

ファイルをローカルに保存し、パスを書き換える。

```ts
import { createFileSaveResolver } from 'fetchoraw/resolvers';

const resolver = createFileSaveResolver({
  saveRoot: 'public/assets',
  prependPath: 'assets'
});
```

オプション:
- `saveRoot`: 保存先ディレクトリ（デフォルト: `dist/assets`）
- `prependPath`: 書き換え後パスのプレフィックス（デフォルト: `assets`）
- `keyString`: 保存パスから削除する対象（デフォルト: URLのベース）

---

### `createSmartResolver()`

小さなファイルはインライン化、大きなファイルは保存。

```ts
import { createSmartResolver } from 'fetchoraw/resolvers';

const resolver = createSmartResolver({
  inlineLimitBytes: 500000,
  requireFilePatterns: [/\.svg$/]
});
```

- サイズによって `data:` またはファイル保存に自動切り替え

---

### `createJsonFileSaveResolver()`

JSONを取得し、ファイル保存とデータ抽出の両方に対応。

```ts
import { createJsonFileSaveResolver } from 'fetchoraw/resolvers';

const resolver = createJsonFileSaveResolver();
```

CMS API、設定ファイル、フィードなどに便利です。

---

## 📄 ライセンス

MIT

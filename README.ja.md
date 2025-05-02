# Fetchoraw (日本語版)

[![npm version](https://img.shields.io/npm/v/fetchoraw)](https://www.npmjs.com/package/fetchoraw)
[![MIT License](https://img.shields.io/npm/l/fetchoraw)](./LICENSE)

**Fetchoraw** は、HTML内のアセットURL（`src`、`href`など）を変換するための小さなライブラリです。
カスタムリゾルバを使って自由にURLを書き換えることができます。

[View this page in English →](./README.md)

---

## ✨ 特徴

- HTML内のアセットリンクを簡単に変換
- 任意のルールでリゾルバを作成可能
- シンプルで柔軟なAPI

---

## 📆 インストール

```bash
npm install fetchoraw
```

---

## 🚀 使い方

```ts
import { Fetchoraw } from 'fetchoraw';

// 例: CDN URLをローカルパスに書き換えるリゾルバ
const resolver = async (url: string) => url.replace('https://cdn.example.com/', '/assets/');

const fetchoraw = new Fetchoraw(resolver);
const { html, map } = await fetchoraw.exec(
  '<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>'
);

console.log(html); // <html><body><img src="/assets/images/pic.png"></body></html>
console.log(map);  // Map { "https://cdn.example.com/images/pic.png" => "/assets/images/pic.png" }
```

---

## 🛠 概要

### Fetchoraw クラス

- `new Fetchoraw(resolver, options?)`
  - `resolver`: `(url) => Promise<string>` 型の関数
  - `options.envModeName?`: 環境変数の名前（デフォルト: `"FETCHORAW_MODE"`）
  - `options.enableEnvValue?`: 有効化する値（デフォルト: `"FETCH"`）

- `await fetchoraw.exec(html, config?)`
  - `html`: 入力HTML文字列
  - `config.selectors?`: 書き換え対象のセレクタリスト（デフォルトあり）

### リゾルバ種類と使い方

自作リゾルバのほか、以下の組み込みリゾルバが利用できます。

- **Data URLリゾルバ**: ファイルを取得してBase64の `data:` URLに変換します。

  ```ts
  import { createDataUrlResolver } from 'fetchoraw';

  const resolver = createDataUrlResolver();
  const fetchoraw = new Fetchoraw(resolver);
  const { html } = await fetchoraw.exec('<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>');

  console.log(html); // <html><body><img src="data:image/png;base64,..."></body></html>
  ```

- **ファイル保存リゾルバ**: ファイルをダウンロードしてローカルに保存します。

  ```ts
  import { createFileSaveResolver } from 'fetchoraw';

  const resolver = createFileSaveResolver({ saveRoot: 'public/assets', prependPath: 'assets' });
  const fetchoraw = new Fetchoraw(resolver);
  const { html } = await fetchoraw.exec('<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>');

  console.log(html); // <html><body><img src="/assets/images/pic.png"></body></html>
  ```

- **スマートリゾルバ**: 小さいファイルはData URL化、それ以外はローカル保存に自動で振り分けます。

  ```ts
  import { createSmartResolver } from 'fetchoraw';

  const resolver = createSmartResolver({ inlineLimitBytes: 500000 });
  const fetchoraw = new Fetchoraw(resolver);
  const { html } = await fetchoraw.exec('<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>');

  console.log(html); // ファイルサイズに応じた結果が出力されます
  ```

---

## 📄 ライセンス

MIT


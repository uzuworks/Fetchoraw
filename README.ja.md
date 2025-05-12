# Fetchoraw (日本語版)

[![npm version](https://img.shields.io/npm/v/fetchoraw)](https://www.npmjs.com/package/fetchoraw)
[![MIT License](https://img.shields.io/npm/l/fetchoraw)](./LICENSE)
![type: module](https://img.shields.io/badge/type-module-green)

**Fetchoraw** は、HTML内のアセットURL（`src`、`href`など）を変換するための小さなライブラリです。
カスタムリゾルバを使って自由にURLを書き換えることができます。

[View this page in English →](./README.md)

---

## ✨ 特徴

* HTML内のアセットリンクを簡単に変換
* 任意のルールでリゾルバを作成可能
* シンプルで柔軟なAPI

---

## 📆 インストール

```bash
npm install fetchoraw
```

---

## 🚀 使い方

### HTMLをリライトする

```ts
import { Fetchoraw } from 'fetchoraw';

// 例: CDN URLをローカルパスに書き換えるリゾルバ
const resolver = async (url: string) => url.replace('https://cdn.example.com/', '/assets/');

const fetchoraw = new Fetchoraw(resolver);
const { output: html, map } = await fetchoraw.html(
  '<html><body><img src="https://cdn.example.com/images/pic.png"></body></html>'
);

console.log(html); // <html><body><img src="/assets/images/pic.png"></body></html>
console.log(map);  // Map { "https://cdn.example.com/images/pic.png" => "/assets/images/pic.png" }
```

### 単一のURLを変換する

```ts
const fetchoraw = new Fetchoraw(resolver);
const { output: newUrl } = await fetchoraw.url('https://cdn.example.com/images/pic.png');

console.log(newUrl); // "/assets/images/pic.png"
```

---

## 🛠 概要

### Fetchoraw クラス

* `new Fetchoraw(resolver, options?)`

  * `resolver`: `(url: string) => Promise<string>` 型の関数
  * `options.envModeName?`: 環境変数の名前（デフォルト: `"FETCHORAW_MODE"`）
  * `options.enableEnvValue?`: 有効化する値（デフォルト: `"FETCH"`）

* `await fetchoraw.html(html, config?)`

  * `html`: 入力HTML文字列
  * `config.selectors?`: 書き換え対象のセレクタリスト（デフォルトあり）
  * 戻り値: `{ output: string, map: Map<string, string> }`

* `await fetchoraw.url(url, origin?)`

  * `url`: 対象のURL文字列（絶対、相対、プロトコル相対）
  * `origin?`: 相対URLを解決する基準となるオリジン
  * 戻り値: `{ output: string, map: Map<string, string> }`

---

## 🧙‍♂️ リゾルバの種類と使い方

自作リゾルバのほか、以下の組み込みリゾルバが利用できます。

### Data URLリゾルバ

ファイルを取得してBase64の `data:` URLに変換します。

```ts
import { createDataUrlResolver } from 'fetchoraw';

const resolver = createDataUrlResolver();
const fetchoraw = new Fetchoraw(resolver);
const { output: html } = await fetchoraw.html('<img src="https://cdn.example.com/images/pic.png">');

console.log(html); // <img src="data:image/png;base64,...">
```

### ファイル保存リゾルバ

ファイルをダウンロードしてローカルに保存します。

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

### スマートリゾルバ

小さいファイルはData URL化、それ以外はローカル保存に自動で振り分けます。

```ts
import { createSmartResolver } from 'fetchoraw';

const resolver = createSmartResolver({ inlineLimitBytes: 500000 });
const fetchoraw = new Fetchoraw(resolver);
const { output: html } = await fetchoraw.html('<img src="https://cdn.example.com/images/pic.png">');

// ファイルサイズに応じた結果が出力されます
console.log(html);
```

---

## 📄 ライセンス

MIT

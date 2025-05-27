import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, extname, join, normalize } from 'path';
import type { JsonFileSaveResolverOptions, ResolveAssetFn, ResolverResult } from "../types";
import {
  DEFAULT_SAVE_ROOT,
  DEFAULT_TARGET_PATTERN,
  DEFAULT_KEY_STRING,
  DEFAULT_PREPEND_PATH,
  DEFAULT_ON_ERROR,
} from '../defaults.js';
import { onErrorHandler } from '../utils';

export function createJsonFileSaveResolver(options: JsonFileSaveResolverOptions = {}): ResolveAssetFn<ResolverResult> {
  const {
    saveRoot = DEFAULT_SAVE_ROOT,
    targetPattern = DEFAULT_TARGET_PATTERN,
    keyString = DEFAULT_KEY_STRING,
    prependPath = DEFAULT_PREPEND_PATH,
    onError = DEFAULT_ON_ERROR,
  } = options;

  const patterns = Array.isArray(targetPattern) ? targetPattern : [targetPattern];

  return async function resolve(url: string, options: RequestInit = {}): Promise<ResolverResult> {
    if (!patterns.some(rx => rx.test(url))) return { path: url};

    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${url} (status ${res.status})`);
      }

      const jsonData = await res.json();
      const urlObj = new URL(url);
      const hashBase = JSON.stringify({ url, options })
      const hash = crypto.createHash('sha256').update(hashBase).digest('hex').slice(0, 6);
      const rawPathname = decodeURI(url.replace(urlObj.search, '').replace(keyString, ''));
      const untrustedPath = `${dirname(rawPathname)}/${basename(rawPathname).replace(extname(rawPathname), '')}${hash}.json`;
      const normalizedPath = normalize(untrustedPath).replace(/^\.+[\\/]/, '');
      const savePath = join(saveRoot, normalizedPath.replace(/^\/+/g, ''));

      await mkdir(dirname(savePath), { recursive: true });
      await writeFile(savePath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log(`Saved: ${savePath}`);

      return {
        path: '/' + join(prependPath, normalizedPath).replace(/^\/+/g, ''),
        data: jsonData
      } 
    } catch (error) {
      return onErrorHandler<ResolverResult>(error, onError, { path: url }, { path: '' });
    }
  }
}

export const jsonFileSave = createJsonFileSaveResolver;

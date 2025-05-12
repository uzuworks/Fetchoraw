import { Buffer } from 'buffer';
import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, extname, join, normalize } from 'path';
import type { FileSaveResolverOptions } from '../types.js';
import {
  DEFAULT_SAVE_ROOT,
  DEFAULT_TARGET_PATTERN,
  DEFAULT_KEY_STRING,
  DEFAULT_PREPEND_PATH,
  DEFAULT_ON_ERROR,
} from '../defaults.js';

/**
 * Create a resolver that saves assets to local files.
 *
 * If URL matches targetPattern, download and save it,
 * then return the local public path.
 *
 * @param options - resolver settings
 * @param options.saveRoot - root folder to save files (default: "dist/assets")
 * @param options.keyString - prefix to strip from URL paths
 * @param options.prependPath - path prefix for returned URL (default: "assets")
 * @param options.targetPattern - URL patterns to match
 * @param options.onError - error handling mode (default: "throw")
 * @returns function to resolve a URL
 */
export function createFileSaveResolver(options: FileSaveResolverOptions = {}) {
  const {
    saveRoot = DEFAULT_SAVE_ROOT,
    targetPattern = DEFAULT_TARGET_PATTERN,
    keyString = DEFAULT_KEY_STRING,
    prependPath = DEFAULT_PREPEND_PATH,
    onError = DEFAULT_ON_ERROR,
  } = options;

  const patterns = Array.isArray(targetPattern) ? targetPattern : [targetPattern];

  return async function resolve(url: string): Promise<string> {
    if (url.trim().toLowerCase().startsWith('javascript:')) return url;
    if (!patterns.some(rx => rx.test(url))) return url;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${url} (status ${res.status})`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      const urlObj = new URL(url);
      const replacedSearch = [...urlObj.searchParams.entries()]
        .map(([k, v]) => `-${k}${v}`)
        .join('');
      const rawPathname = decodeURI(url.replace(urlObj.search, '').replace(keyString, ''));
      const untrustedPath = `${dirname(rawPathname)}/${basename(rawPathname).replace(extname(rawPathname), '')}${replacedSearch}${extname(rawPathname)}`;
      const normalizedPath = normalize(untrustedPath).replace(/^\.+[\\/]/, '');
      const savePath = join(saveRoot, normalizedPath.replace(/^\/+/g, ''));

      await mkdir(dirname(savePath), { recursive: true });
      await writeFile(savePath, buffer);
      console.log(`Saved: ${savePath}`);

      return '/' + join(prependPath, normalizedPath).replace(/^\/+/g, '');
    } catch (error) {
      console.warn(`Error saving: ${url} (${(error as Error).message})`);
      if (onError === 'return-empty') return '';
      if (onError === 'return-url') return url;
      throw error;
    }
  };
}

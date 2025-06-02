import type { FileSaveResolverOptions, ResolveAssetFn } from '../types.js';
import {
  DEFAULT_SAVE_ROOT,
  DEFAULT_TARGET_PATTERN,
  DEFAULT_KEY_STRING,
  DEFAULT_PREPEND_PATH,
  DEFAULT_ON_ERROR,
} from '../defaults.js';
import { generateResolvedFilePaths, onErrorHandler } from '../utils.js';

const PROJECT_ROOT = process.cwd()

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
export function createImageFileSaveResolver(options: FileSaveResolverOptions = {}): ResolveAssetFn<string> {
  const {
    saveRoot = DEFAULT_SAVE_ROOT,
    targetPattern = DEFAULT_TARGET_PATTERN,
    keyString = DEFAULT_KEY_STRING,
    prependPath = DEFAULT_PREPEND_PATH,
    onError = DEFAULT_ON_ERROR,
  } = options;

  const patterns = Array.isArray(targetPattern) ? targetPattern : [targetPattern];

  return async function resolve(url: string, fetchOptions: RequestInit = {}): Promise<string> {
    if (url.trim().toLowerCase().startsWith('javascript:')) return url;
    if (!patterns.some(rx => rx.test(url))) return url;

    let fsp, path;
    try {
      fsp = await import('fs/promises');
      path = await import('path');
      if((globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__){
        throw new Error('__FETCHORAW_FORCE_NODE_FALLBACK__');
      }
    } catch (error) {
      return url;
    }

    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${url} (status ${res.status})`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const paths = await generateResolvedFilePaths(
        url,
        fetchOptions,
        true,
        0,
        '',
        saveRoot,
        keyString,
        prependPath
      )

      await fsp.mkdir(path.dirname(paths.savePath), { recursive: true });
      await fsp.writeFile(paths.savePath, buffer);
      console.log(`Saved: ${paths.savePath}`);

      return paths.sitePath;
    } catch (error) {
      return onErrorHandler<string>(error, onError, url, '');
    }
  };
}

export const imageFileSave = createImageFileSaveResolver;

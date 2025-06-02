import type { FileSaveResolverOptions, ResolveAssetFn, ResolverResult } from "../types";
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
 * Create a resolver that fetches JSON from a remote API and saves it as a local file.
 *
 * If URL matches targetPattern, download and save it,
 * then return the local public path.
 * Returns an object including both the saved `path` and parsed `data`.
 *
 * @param options - resolver settings
 * @param options.saveRoot - root folder to save files (default: "dist/assets")
 * @param options.keyString - prefix to strip from URL paths
 * @param options.prependPath - path prefix for returned URL (default: "assets")
 * @param options.targetPattern - URL patterns to match
 * @param options.onError - error handling mode (default: "throw")
 * @returns function to resolve a URL
 */
export function createJsonFileSaveResolver(options: FileSaveResolverOptions = {}): ResolveAssetFn<ResolverResult> {
  const {
    saveRoot = DEFAULT_SAVE_ROOT,
    targetPattern = DEFAULT_TARGET_PATTERN,
    keyString = DEFAULT_KEY_STRING,
    prependPath = DEFAULT_PREPEND_PATH,
    onError = DEFAULT_ON_ERROR,
  } = options;

  const patterns = Array.isArray(targetPattern) ? targetPattern : [targetPattern];

  return async function resolve(url: string, fetchOptions: RequestInit = {}): Promise<ResolverResult> {
    if (!patterns.some(rx => rx.test(url))) return { path: url};

    let fsp, path;
    try {
      fsp = await import('fs/promises');
      path = await import('path');
      if((globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__){
        throw new Error('__FETCHORAW_FORCE_NODE_FALLBACK__');
      }
    } catch (error) {
      return {path: url}
    }
    
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${url} (status ${res.status})`);
      }
      const jsonData = await res.json();

      const paths = await generateResolvedFilePaths(
        url,
        fetchOptions,
        false,
        6,
        '.json',
        saveRoot,
        keyString,
        prependPath
      )

      await fsp.mkdir(path.dirname(paths.savePath), { recursive: true });
      await fsp.writeFile(paths.savePath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log(`Saved: ${paths.savePath}`);

      return {
        path: paths.sitePath,
        data: jsonData
      } 
    } catch (error) {
      return onErrorHandler<ResolverResult>(error, onError, { path: url }, { path: '' });
    }
  }
}

export const jsonFileSave = createJsonFileSaveResolver;

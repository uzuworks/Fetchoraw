import type { ImageSmartResolverOptions, ResolveAssetFn, ResolverResult } from '../types.js';
import {
  DEFAULT_TARGET_PATTERN,
  DEFAULT_INLINE_LIMIT,
  DEFAULT_ALLOW_MIME_TYPES,
  DEFAULT_SAVE_ROOT,
  DEFAULT_PREPEND_PATH,
  DEFAULT_ON_ERROR
} from '../defaults.js';

import { createImageDataUrlResolver } from './imageDataUrlResolver.js';
import { createImageFileSaveResolver } from './imageFileSaveResolver.js';
import { onErrorHandler } from '../utils.js';

/**
 * Create a smart resolver that tries data URL first, then file save.
 *
 * If URL matches requireFilePatterns, always save as file.
 * Otherwise, try inline (data URL). If it fails, fallback to save file.
 *
 * @param options - resolver settings
 * @param options.requireFilePatterns - patterns to force file save
 * @param options.inlineLimitBytes - max size to inline (default: 2MB)
 * @param options.allowMimeTypes - allowed MIME types for inlining
 * @param options.saveRoot - root folder to save files (default: "dist/assets")
 * @param options.keyString - prefix to strip for file paths
 * @param options.prependPath - path prefix for returned URL (default: "assets")
 * @param options.targetPattern - patterns to match URLs
 * @param options.onError - error handling mode (default: "throw")
 * @returns function to resolve a URL
 */
export function createImageSmartResolver(options: ImageSmartResolverOptions): ResolveAssetFn<string> {
  const {
    requireFilePatterns = [],
    targetPattern = DEFAULT_TARGET_PATTERN,
    inlineLimitBytes = DEFAULT_INLINE_LIMIT,
    allowMimeTypes = DEFAULT_ALLOW_MIME_TYPES,
    saveRoot = DEFAULT_SAVE_ROOT,
    keyString = DEFAULT_PREPEND_PATH,
    prependPath = DEFAULT_PREPEND_PATH,
    onError = DEFAULT_ON_ERROR,
  } = options;

  const patterns = Array.isArray(targetPattern) ? targetPattern : [targetPattern];
  const requirePatterns = Array.isArray(requireFilePatterns) ? requireFilePatterns : [requireFilePatterns];

  const dataUrlResolver = createImageDataUrlResolver({
    targetPattern,
    inlineLimitBytes,
    allowMimeTypes,
    onError,
  });

  const fileSaveResolver = createImageFileSaveResolver({
    saveRoot,
    keyString,
    prependPath,
    targetPattern,
    onError,
  });

  return async function resolve(url: string, options: RequestInit = {}): Promise<string> {
    if (!patterns.some(rx => rx.test(url))) return url;

    if (requirePatterns.some(rx => rx.test(url))) {
      try {
        return await fileSaveResolver(url, options);
      } catch (error) {
        return onErrorHandler<string>(error, onError, url, '');
      }
    }

    try {
      return await dataUrlResolver(url, options);
    } catch (dataurlError) {
      try {
        return await fileSaveResolver(url, options);
      } catch (filesaveError) {
        return onErrorHandler<string>(filesaveError, onError, url, '');
      }
    }
  };
}

const imageSmart = createImageSmartResolver;

import { Buffer } from 'buffer';
import { extname } from 'path';
import mime from 'mime';
import type { ImageDataUrlResolverOptions, ResolveAssetFn } from '../types.js';
import {
  DEFAULT_INLINE_LIMIT,
  DEFAULT_TARGET_PATTERN,
  DEFAULT_ALLOW_MIME_TYPES,
  DENY_ALWAYS_MIME_TYPES,
  DEFAULT_ON_ERROR,
} from '../defaults.js';
import { onErrorHandler } from '../utils.js';

/**
 * Create a resolver that inlines assets as data URLs.
 *
 * If URL matches targetPattern, MIME is allowed, and size is small enough,
 * return a base64 `data:` URL. Otherwise, return the original URL.
 *
 * @param options - resolver settings
 * @param options.inlineLimitBytes - max file size in bytes (default: 2MB)
 * @param options.allowMimeTypes - allowed MIME types for inlining
 * @param options.targetPattern - URL patterns to match
 * @param options.onError - error handling mode (default: "throw")
 * @returns function to resolve a URL
 */
export function createImageDataUrlResolver(options: ImageDataUrlResolverOptions = {}): ResolveAssetFn<string> {
  const {
    inlineLimitBytes = DEFAULT_INLINE_LIMIT,
    allowMimeTypes = DEFAULT_ALLOW_MIME_TYPES,
    targetPattern = DEFAULT_TARGET_PATTERN,
    onError = DEFAULT_ON_ERROR,
  } = options;

  const patterns = Array.isArray(targetPattern) ? targetPattern : [targetPattern];

  return async function resolve(url: string, options: RequestInit = {}): Promise<string> {
    if (url.trim().toLowerCase().startsWith('javascript:')) return url;
    if (!patterns.some(rx => rx.test(url))) return url;

    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${url} (status ${res.status})`);
      }
  
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > inlineLimitBytes) return url;
  
      const headerType = res.headers.get('content-type');
      const fallbackType = mime.getType(extname(url));
      const contentType = headerType || fallbackType;
  
      if (!contentType) {
        throw new Error(`Unable to determine MIME type for: ${url}`);
      }
  
      // ライブラリレベルの禁止 MIME
      if (DENY_ALWAYS_MIME_TYPES.some(rx => rx.test(contentType))) {
        return url;
      }
  
      // 利用者指定の許可 MIME
      if (allowMimeTypes && !allowMimeTypes.some(rx => rx.test(contentType))) {
        return url;
      }
  
      const base64 = buffer.toString('base64');
      console.log(`Inlined: ${url} (${buffer.length} bytes)`);
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      return onErrorHandler<string>(error, onError, url, '');
    }

  };
}

export const imageDataUrl = createImageDataUrlResolver;

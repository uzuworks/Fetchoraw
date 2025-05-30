import { urlSelectors } from './presets.js';

/**
 * Maximum size (in bytes) for inlining data URLs.
 * If exceeded, file will be saved instead.
 *
 * Default: 2MB (safe for most browsers like Chrome)
 */
export const DEFAULT_INLINE_LIMIT = 2 * 1024 * 1024;

/**
 * Pattern to match URLs considered for rewriting.
 *
 * Default: matches all `http://` and `https://` URLs with a domain.
 */
export const DEFAULT_TARGET_PATTERN = /^https?:\/\/[^\/]+\/?/;

/**
 * Pattern or string to strip when building relative save paths.
 *
 * Default: removes the origin (protocol + domain) from URL.
 */
export const DEFAULT_KEY_STRING = /^https?:\/\/[^\/]+\/?/;

/**
 * Default fallback behavior on asset processing error.
 *
 * Options: `'throw' | 'return-url' | 'return-empty'`
 * Default: `'throw'` (fail-fast)
 */
export const DEFAULT_ON_ERROR = 'throw';

/**
 * Default directory under which resolved files will be saved.
 *
 * Used by file-based resolvers.
 * Default: `dist/assets` (suitable for many build tools)
 */
export const DEFAULT_SAVE_ROOT = 'dist/assets';

/**
 * Default prefix to prepend to rewritten URLs in HTML or output.
 *
 * For example, `assets/foo.jpg` becomes `/assets/foo.jpg`.
 */
export const DEFAULT_PREPEND_PATH = 'assets';

/**
 * Environment variable name that determines the exec mode.
 *
 * Default: `PUBLIC_FETCHORAW_MODE`
 * This allows both SSR/build-time and runtime env control.
 */
export const DEFAULT_ENV_NAME = 'PUBLIC_FETCHORAW_MODE';

/**
 * Environment variable value to enable FETCH mode (network requests).
 *
 * Default: `'FETCH'`
 */
export const DEFAULT_ENABLE_FETCH_ENV_VALUE = 'FETCH';

/**
 * Environment variable value to enable CACHE mode (use cache file only).
 *
 * Default: `'CACHE'`
 */
export const DEFAULT_ENABLE_CACHE_ENV_VALUE = 'CACHE';

/**
 * Default cache file path for storing fetch results.
 *
 * Used only when CACHE mode is active.
 */
export const DEFAULT_CACHE_FILE_PATH = 'cache/fetchoraw_cache.json';

/**
 * Default selector + attribute pairs to rewrite in HTML.
 *
 * Based on common media use cases (img, source, video, etc.)
 */
export const DEFAULT_SELECTORS = [
  urlSelectors.ImgSrc,
  urlSelectors.ImgSrcset,
  urlSelectors.SourceSrc,
  urlSelectors.SourceSrcset,
  urlSelectors.VideoPoster,
];

/**
 * Default allowed MIME types for inlining
 */
export const DEFAULT_ALLOW_MIME_TYPES = [
  /^image\//,
  /^audio\//,
  /^video\//,
  /^application\/pdf$/,
];

/**
 * MIME types that are always denied for inlining
 */
export const DENY_ALWAYS_MIME_TYPES = [
  /^application\/octet-stream$/,
  /^application\/x-msdownload$/,
  /^application\/zip$/,
  /^text\/html$/,
  /^application\/javascript$/,
];

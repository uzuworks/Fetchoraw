import { urlSelectors } from './presets.js';

/**
 * Max size for inlining data URLs (default: 2MB)
 */
export const DEFAULT_INLINE_LIMIT = 2 * 1024 * 1024;

/**
 * Pattern to match URLs (default: all http/https)
 */
export const DEFAULT_TARGET_PATTERN = /^https?:\/\/[^\/]+\/?/;

/**
 * Key string pattern to strip from saved paths
 */
export const DEFAULT_KEY_STRING = /^https?:\/\/[^\/]+\/?/;

/**
 * Error handling mode (default: "throw")
 */
export const DEFAULT_ON_ERROR = 'throw';

/**
 * Default root directory for saved files
 */
export const DEFAULT_SAVE_ROOT = 'dist/assets';

/**
 * Path prefix for rewritten URLs
 */
export const DEFAULT_PREPEND_PATH = 'assets';

/**
 * Env var name to control rewriting (default: "FETCHORAW_MODE")
 */
export const DEFAULT_ENV_NAME = 'FETCHORAW_MODE';

/**
 * Env var value that enables rewriting (default: "FETCH")
 */
export const DEFAULT_ENABLE_ENV_VALUE = 'FETCH';

/**
 * Default target selectors (img[src], source[srcset], etc.)
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

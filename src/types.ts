/**
 * Unified result format for structured asset resolvers.
 *
 * - `path`: resolved output (e.g. saved file path or public URL)
 * - `data`: parsed or extracted content (e.g. JSON, text, metadata)
 */
export type ResolverResult = {
  path: string;
  data?: unknown;
};

/**
 * Signature for an asset resolver function.
 *
 * - Can return:
 *   - A `string`: direct result like data URL or file path
 *   - A `ResolverResult`: structured result with content
 *
 * @param url - Target URL to resolve
 * @param fetchOptions - Optional fetch options (e.g. headers)
 */
export type ResolveAssetFn<T = string | ResolverResult> = (
  url: string,
  fetchOptions?: RequestInit
) => Promise<T>;

/**
 * Error fallback strategy.
 *
 * - `'throw'`: propagate error
 * - `'return-url'`: return original URL
 * - `'return-empty'`: replace with `''`
 */
export type OnErrorHandle = 'throw' | 'return-url' | 'return-empty';

/**
 * Execution mode detected via environment variable.
 */
export type ExecMode = 'NONE' | 'FETCH' | 'CACHE';

/**
 * Options for controlling Fetchoraw's environment behavior.
 */
export interface FetchorawOptions {
  /**
   * Environment variable name to check for mode (default: "FETCHORAW_MODE")
   */
  envModeName?: string;

  /**
   * Value that enables FETCH mode (default: "FETCH")
   */
  enableFetchEnvValue?: string;

  /**
   * Value that enables CACHE mode (default: "CACHE")
   */
  enableCacheEnvValue?: string;

  /**
   * Absolute path to the cache file (for read/write)
   */
  cacheFilePath?: string;
}

/**
 * Selector rule for attribute rewriting.
 *
 * @example { selector: 'img[src]', attr: 'src' }
 */
export interface Selector {
  selector: string;
  attr: string;
}

/**
 * Base result shared between `.html()` and `.url()`.
 */
export interface FetchorawResultBase {
  /**
   * Original URL → resolved result mapping
   */
  map: Array<{
    url: string;
    fetchOptions?: RequestInit;
    resolvedPath: string;
  }>;
}

/**
 * Result from `.html()` call.
 */
export interface FetchorawHtmlResult extends FetchorawResultBase {
  /**
   * Final HTML with rewritten asset URLs
   */
  html: string;
}

/**
 * Result from `.url()` call.
 */
export interface FetchorawUrlResult extends FetchorawResultBase {
  /**
   * Final resolved path (e.g. data URL, local file path)
   */
  path: string;

  /**
   * Parsed or extracted content (e.g. JSON object)
   */
  data?: unknown;
}

/**
 * Common base options shared by all resolvers.
 */
export interface CommonResolverOptions {
  /**
   * Pattern(s) to match against target URLs.
   * Default: all `http`/`https`
   */
  targetPattern?: RegExp | RegExp[];

  /**
   * Fallback behavior on error.
   * Default: `'throw'`
   */
  onError?: OnErrorHandle;
}

/**
 * Options for data URL resolver.
 */
export interface ImageDataUrlResolverOptions extends CommonResolverOptions {
  /**
   * Max allowed size to inline (in bytes).
   * Default: 2MB
   */
  inlineLimitBytes?: number;

  /**
   * Allowed MIME types (e.g. images only)
   */
  allowMimeTypes?: RegExp[];
}

/**
 * Options for file-based resolver.
 */
export interface FileSaveResolverOptions extends CommonResolverOptions {
  /**
   * Root directory to save files into.
   * Default: `"public/media"`
   */
  saveRoot?: string;

  /**
   * Key (string or pattern) to strip when creating relative paths
   */
  keyString?: string | RegExp;

  /**
   * Path prefix to add to resolved public URLs
   */
  prependPath?: string;
}

/**
 * Options for smart resolver (combines data URL and file saving).
 */
export interface ImageSmartResolverOptions
  extends ImageDataUrlResolverOptions,
    FileSaveResolverOptions {
  /**
   * If URL matches these patterns, always save as file (even if small)
   */
  requireFilePatterns?: RegExp | RegExp[];
}

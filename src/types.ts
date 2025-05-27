/**
 * Standard result format for structured asset resolvers.
 *
 * - `path` is the resolved output path (e.g. local file path or public URL)
 * - `data` holds parsed or structured content (e.g. JSON, text, metadata)
 */
export type ResolverResult = { path: string, data?: unknown };

/**
 * Resolves a URL into a string or an object with a path and optional data.
 *
 * - Returns a string for simple assets (e.g. data URL or local path)
 * - Returns `{ path, data }` for structured assets (e.g. JSON)
 *
 * @param url - The target URL to resolve.
 * @param options - Optional fetch options.
 * @returns A resolved string or an object with `path` and optional `data`.
 */
export type ResolveAssetFn<T = string | ResolverResult> = (
  url: string,
  options?: RequestInit
) => Promise<T>;

/**
 * Error handling modes.
 * - 'throw': throw error
 * - 'return-url': keep original URL
 * - 'return-empty': replace with empty string
 */
export type OnErrorHandle = 'throw' | 'return-url' | 'return-empty';

/**
 * Options for Fetchoraw environment behavior.
 */
export interface FetchorawOptions {
  /** Env var name to check (default: "FETCHORAW_MODE") */
  envModeName?: string;
  /** Value that enables rewriting (default: "FETCH") */
  enableEnvValue?: string;
}

/**
 * Selector and attribute to rewrite.
 * Example: { selector: 'img[src]', attr: 'src' }
 */
export interface Selector {
  selector: string;
  attr: string;
}

/**
 * Result base.
 */
export interface FetchorawResultBase{
  /** Map of original -> resolved URLs */
  map: Map<string, string>;
}

/**
 * Result of html().
 */
export interface FetchorawHtmlResult extends FetchorawResultBase {
  /** Rewritten HTML string */
  html: string;
}

/**
 * Result of url().
 */
export interface FetchorawUrlResult extends FetchorawResultBase {
  /** Rewritten path string */
  path: string;
  /**
   * Optional parsed or resolved content.
   * e.g. JSON object, extracted text, metadata, etc.
   */
  data?: unknown;
}

/**
 * Common options for all resolvers.
 */
export interface CommonResolverOptions {
  /** Pattern to match target URLs (default: all http/https) */
  targetPattern?: RegExp | RegExp[];
  /** Error handling mode (default: "throw") */
  onError?: OnErrorHandle;
}

/**
 * Options for creating a data URL resolver.
 */
export interface ImageDataUrlResolverOptions extends CommonResolverOptions {
  /** Max size to inline (bytes) (default: 2MB) */
  inlineLimitBytes?: number;
  /** Allowed MIME types to inline */
  allowMimeTypes?: RegExp[];
}

/**
 * Options for creating a file-save resolver.
 */
export interface FileSaveResolverOptions extends CommonResolverOptions {
  /** Directory to save files (default: public/media) */
  saveRoot?: string;
  /** Pattern or string to build relative paths */
  keyString?: string | RegExp;
  /** Prefix path to add to saved URL */
  prependPath?: string;
}

/**
 * Options for smart resolver (data URL + file-save).
 */
export interface ImageSmartResolverOptions extends ImageDataUrlResolverOptions, FileSaveResolverOptions {
  /** Patterns that force file saving */
  requireFilePatterns?: RegExp | RegExp[];
}

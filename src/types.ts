/**
 * Function to transform a URL.
 * (e.g., make a data URL or a local file path)
 */
export type ResolveAssetFn = (url: string) => Promise<string>;

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
 * Result of exec().
 */
export interface ExecResult {
  /** Rewritten HTML string */
  html: string;
  /** Map of original -> resolved URLs */
  map: Map<string, string>;
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
export interface DataUrlResolverOptions extends CommonResolverOptions {
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
export interface SmartResolverOptions extends DataUrlResolverOptions, FileSaveResolverOptions {
  /** Patterns that force file saving */
  requireFilePatterns?: RegExp | RegExp[];
}

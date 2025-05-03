import * as cheerio from 'cheerio';
import type { ResolveAssetFn, FetchorawOptions, Selector } from './types';
import {
  DEFAULT_ENV_NAME,
  DEFAULT_ENABLE_ENV_VALUE,
  DEFAULT_ON_ERROR,
  DEFAULT_INLINE_LIMIT,
  DEFAULT_TARGET_PATTERN,
  DEFAULT_KEY_STRING,
  DEFAULT_PREPEND_PATH,
  DEFAULT_SAVE_ROOT,
  DEFAULT_SELECTORS
} from './defaults';
import { cmsUrls, urlSelectors } from './presets';
export { createDataUrlResolver } from './resolvers/basicDataUrlResolver';
export { createFileSaveResolver } from './resolvers/basicFileSaveResolver';
export { createSmartResolver } from './resolvers/smartResolver';

/**
 * Fetchoraw: rewrite asset URLs in HTML.
 *
 * Use your resolver to replace src, href, etc.
 *
 * @example
 * const fetchoraw = new Fetchoraw(resolver);
 * const result = await fetchoraw.exec('<img src="https://example.com/image.png">');
 * console.log(result.html); // rewritten HTML
 */
export class Fetchoraw {
  private resolver: ResolveAssetFn;
  private envModeName: string;
  private enableEnvValue: string;

  /**
   * Make a new Fetchoraw.
   *
   * @param resolver - function to transform URL (to local path, data URL, etc.)
   * @param options - optional settings
   * @param options.envModeName - env var name to control rewriting (default: "FETCHORAW_MODE")
   * @param options.enableEnvValue - value that enables rewriting (default: "FETCH")
   */
  constructor(resolver: ResolveAssetFn, options: FetchorawOptions = {}) {
    this.resolver = resolver;
    this.envModeName = options.envModeName ?? DEFAULT_ENV_NAME;
    this.enableEnvValue = options.enableEnvValue ?? DEFAULT_ENABLE_ENV_VALUE;
  }

  /**
   * Rewrite URLs in given HTML.
   *
   * @param html - HTML string
   * @param config - optional target selectors
   * @param config.selectors - list of { selector, attr } to target (default: DEFAULT_SELECTORS)
   * @returns { html, map }
   */
  async exec(html: string, config?: { selectors?: Selector[] }): Promise<{ html: string; map: Map<string, string> }> {
    const targets = config?.selectors ?? Fetchoraw.defaults.DEFAULT_SELECTORS;
    const $ = cheerio.load(html);
    const shouldFetch = this.envModeName.length === 0 || process.env[this.envModeName] === this.enableEnvValue;
    const map = new Map<string, string>();

    for (const { selector, attr } of targets) {
      const elements = $(selector).toArray();

      for (const el of elements) {
        const original = $(el).attr(attr);
        if (!original || map.has(original)) continue;

        try {
          const resolved = shouldFetch ? await this.resolver(original) : original;
          map.set(original, resolved);
          $(el).attr(attr, resolved);
        } catch (err) {
          throw err;
        }
      }
    }

    return { html: $.html(), map };
  }

  /**
   * Common selectors like img[src]
   */
  static SelectorPresets = urlSelectors;

  /**
   * CMS URL base presets
   */
  static CmsPresets = cmsUrls;

  /**
   * Default config values
   */
  static defaults = {
    DEFAULT_INLINE_LIMIT,
    DEFAULT_TARGET_PATTERN,
    DEFAULT_KEY_STRING,
    DEFAULT_ON_ERROR,
    DEFAULT_SAVE_ROOT,
    DEFAULT_PREPEND_PATH,
    DEFAULT_ENV_NAME,
    DEFAULT_ENABLE_ENV_VALUE,
    DEFAULT_SELECTORS,
  };
}

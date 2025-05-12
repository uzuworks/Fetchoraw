import * as cheerio from 'cheerio';
import type { ResolveAssetFn, FetchorawOptions, Selector } from './types.js';
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
} from './defaults.js';
import { cmsUrls, urlSelectors } from './presets.js';

/**
 * Fetchoraw: rewrite asset URLs in HTML.
 *
 * Use your resolver to replace src, href, etc.
 *
 * @example
 * const fetchoraw = new Fetchoraw(resolver);
 * const result = await fetchoraw.html('<img src="https://example.com/image.png">');
 * console.log(result.output); // rewritten HTML
 */
export class Fetchoraw {
  private resolver: ResolveAssetFn;
  private envModeName: string;
  private enableEnvValue: string;
  private urlMap: Map<string, string> = new Map();

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
   * @param inputHtml - HTML string
   * @param config - optional target selectors
   * @param config.selectors - list of { selector, attr } to target (default: DEFAULT_SELECTORS)
   * @returns { output, map }
   */
  async html(inputHtml: string, config?: { selectors?: Selector[] }): Promise<{ output: string; map: Map<string, string> }> {
    const map = new Map<string, string>();

    //@ts-ignore
    const envValue = process.env[this.envModeName] || import.meta.env[this.envModeName]
    const isResolveTarget = this.envModeName.length === 0 || envValue === this.enableEnvValue;
    console.log('Resolve?: ', isResolveTarget);
    if(!isResolveTarget){
      return { output: inputHtml, map };
    }

    const targetSelectors = config?.selectors ?? Fetchoraw.defaults.DEFAULT_SELECTORS;
    const $ = cheerio.load(inputHtml);

    for (const { selector, attr } of targetSelectors) {
      const elements = $(selector).toArray();
      for (const el of elements) {
        const original = $(el).attr(attr);
        if(!original) {
          continue
        }
        if(this.urlMap.has(original)){
          $(el).attr(attr, this.urlMap.get(original));
        }else{
          try {
            const resolved = await this.resolver(original);
            map.set(original, resolved);
            this.urlMap.set(original, resolved);

            $(el).attr(attr, resolved);
          } catch (error) {
            console.error(`${original} error: `, error);
            throw error;
          }
        }

      }
    }

    return { output: $.html(), map };
  }

  /**
   * Resolve a single URL, optionally relative to a base.
   *
   * @param inputUrl - The URL to resolve.
   * @param origin - Optional origin to resolve relative paths.
   * @returns { output, map } - Resolved URL and mapping.
   */
  async url(inputUrl: string, origin: string = ''): Promise<{ output: string; map: Map<string, string> }> {
    const map = new Map<string, string>();

    if(!inputUrl){
      return { output: inputUrl, map };
    }

    const isResolveTarget = this.envModeName.length === 0 || process.env[this.envModeName] === this.enableEnvValue;
    if(!isResolveTarget){
      return { output: inputUrl, map };
    }

    try {
      const modifiedInput = (() => {
        if(inputUrl.startsWith('http')){
          return inputUrl;
        }

        if(inputUrl.startsWith('//')){
          return `https:${inputUrl}`
        }

        return new URL(inputUrl, origin).href;
      })();
      


      const url = new URL(modifiedInput);
      if(this.urlMap.has(url.href)){
        return {
          output: this.urlMap.get(url.href)!,
          map
        }
      }

      const resolved = await this.resolver(url.href);
      map.set(url.href, resolved);
      this.urlMap.set(url.href, resolved);

      return {
        output: resolved,
        map
      }
    } catch (error) {
      console.error(`${inputUrl} error: `, error);
      throw error;
    }

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

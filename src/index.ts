import { mkdir, readFile, writeFile } from 'fs/promises'
import * as cheerio from 'cheerio';
import type { ResolveAssetFn, FetchorawOptions, Selector, FetchorawUrlResult, FetchorawHtmlResult, ResolverResult, ExecMode } from './types.js';
import {
  DEFAULT_ENV_NAME,
  DEFAULT_ENABLE_FETCH_ENV_VALUE,
  DEFAULT_ENABLE_CACHE_ENV_VALUE,
  DEFAULT_ON_ERROR,
  DEFAULT_INLINE_LIMIT,
  DEFAULT_TARGET_PATTERN,
  DEFAULT_KEY_STRING,
  DEFAULT_PREPEND_PATH,
  DEFAULT_SAVE_ROOT,
  DEFAULT_SELECTORS,
  DEFAULT_CACHE_FILE_PATH
} from './defaults.js';
import { cmsUrls, urlSelectors } from './presets.js';
import path, { dirname } from 'path';
import { pathExists } from './utils.js';

const PROJECT_ROOT = process.cwd()

/**
 * Fetchoraw: rewrite asset URLs in HTML.
 *
 * Use your resolver to replace src, href, etc.
 *
 * @example
 * const fetchoraw = new Fetchoraw(resolver);
 * const result = await fetchoraw.html('<img src="https://example.com/image.png">');
 * console.log(result.html); // rewritten HTML
 */
export class Fetchoraw {
  private resolver: ResolveAssetFn;
  private envModeName: string;
  private enableFetchValue: string;
  private enableCacheValue: string;
  private cacheFileFullPath: string;
  
  private urlMap: Map<string, ResolverResult> = new Map();
  private execMode: ExecMode = 'NONE';

  /**
   * Make a new Fetchoraw.
   *
   * @param resolver - function to transform URL (to local path, data URL, etc.)
   * @param options - optional settings
   * @param options.envModeName - env var name to control rewriting (default: "FETCHORAW_MODE")
   * @param options.enableFetchValue - value that enables rewriting (default: "FETCH")
   * @param options.enableCacheValue - value that enables caching (default: "CACHE")
   * @param options.cacheFilePath - path to save cache file (default: "fetchoraw_cache.json")
   */
  constructor(resolver: ResolveAssetFn, options: FetchorawOptions = {}) {
    this.resolver = resolver;
    this.envModeName = options.envModeName ?? DEFAULT_ENV_NAME;
    this.enableFetchValue = options.enableFetchEnvValue ?? DEFAULT_ENABLE_FETCH_ENV_VALUE;
    this.enableCacheValue = options.enableCacheEnvValue ?? DEFAULT_ENABLE_CACHE_ENV_VALUE;
    this.cacheFileFullPath = path.join(PROJECT_ROOT, options.cacheFilePath ?? DEFAULT_CACHE_FILE_PATH);

    if(this.envModeName.length !== 0){
      //@ts-ignore
      const envValue = process.env[this.envModeName] || import.meta.env[this.envModeName];
      if(envValue === this.enableFetchValue){
        this.execMode = 'FETCH';
      }else if(envValue === this.enableCacheValue && this.cacheFileFullPath.length !== 0){
        this.execMode = 'CACHE';
      }
    }
  }


  private generateMapKey(url: string, fetchOptions: RequestInit): string {
    if (Object.keys(fetchOptions).length === 0){
      return `${url}::{}`;
    }
    const optionsString = JSON.stringify(Object.fromEntries(Object.entries(fetchOptions).sort()));
    return `${url}::${optionsString}`;
  }
  private formatResultMap(map: Map<string, ResolverResult>) {
    const entries = [];

    for (const [key, value] of map.entries()) {
      const [url, optJson] = key.split('::');
      const fetchOptions = optJson ? JSON.parse(optJson) : {};
      entries.push({
        url,
        fetchOptions,
        resolvedPath: value.path,
      });
    }

    return entries;
  }
  private async loadFileMap(){
    if(this.execMode === 'CACHE' && !(await pathExists(this.cacheFileFullPath))){
      throw new Error(`Cache file path is not set or does not exist: ${this.cacheFileFullPath}`);
    }

    if(0 < this.cacheFileFullPath.length){
      try {
        if(!(await pathExists(this.cacheFileFullPath))){
          console.log(`Cache file ${this.cacheFileFullPath} does not exist.`);
          this.urlMap = new Map();
          return;
        }
        console.log(`Loading cache from ${this.cacheFileFullPath}`);
        const fileContent = await readFile(this.cacheFileFullPath, 'utf8');
        const fileMap = JSON.parse(fileContent);
        this.urlMap = new Map(fileMap);
      } catch (error) {
        console.error(`Failed to load cache from ${this.cacheFileFullPath}:`, error);
      }
    }else{
      this.urlMap = new Map<string, ResolverResult>();
    }
  }
  private async saveFileMap() {
    if(0 < this.cacheFileFullPath.length){
      try {
        if(!(await pathExists(dirname(this.cacheFileFullPath)))){
          await mkdir(dirname(this.cacheFileFullPath), { recursive: true });
        }
        await writeFile(this.cacheFileFullPath, JSON.stringify(Array.from(this.urlMap.entries()), null, 2), 'utf8');
        console.log(`Saved cache to ${this.cacheFileFullPath}`);
      } catch (error) {
        console.error(`Failed to save cache to ${this.cacheFileFullPath}:`, error);
      }
    }
  }

  /**
   * Rewrite URLs in given HTML.
   *
   * @param inputHtml - HTML string
   * @param config - optional target selectors
   * @param config.selectors - list of { selector, attr } to target (default: DEFAULT_SELECTORS)
   * @returns { html, map }
   */
  async html(inputHtml: string, config?: { selectors?: Selector[] }): Promise<FetchorawHtmlResult> {
    console.log('Exec mode: ', this.execMode);

    try{
      const localMap = new Map<string, ResolverResult>();
      if(this.execMode === 'NONE'){
        return { html: inputHtml, map: this.formatResultMap(localMap) };
      }

      await this.loadFileMap();

      const targetSelectors = config?.selectors ?? Fetchoraw.defaults.DEFAULT_SELECTORS;
      const $ = cheerio.load(inputHtml);

      for (const { selector, attr } of targetSelectors) {
        const elements = $(selector).toArray();
        for (const el of elements) {
          const original = $(el).attr(attr);
          if(!original) {
            continue
          }

          const hasCache = this.urlMap.has(this.generateMapKey(original, {}));

          if(this.execMode === 'CACHE'){
            if(hasCache){
              const resolvedData = this.urlMap.get(this.generateMapKey(original, {}))!;
              localMap.set(this.generateMapKey(original, {}), resolvedData);
              $(el).attr(attr, resolvedData.path);
            }else{
              console.warn(`Cache miss: ${original}`);
            }
            continue;
          }

          if(hasCache){
            $(el).attr(attr, this.urlMap.get(this.generateMapKey(original, {}))?.path);
          }else{
            console.log(`Rewriting: ${original}`);
            try {
              const resolved = await this.resolver(original);
              const resolvedData = typeof resolved === 'string' ? { path: resolved } : resolved;

              const mapKey = this.generateMapKey(original, {});
              localMap.set(mapKey, resolvedData);
              this.urlMap.set(mapKey, resolvedData);
              $(el).attr(attr, resolvedData.path);
            } catch (error) {
              console.error(`${original} error: `, error);
              throw error;
            }
          }

        }
      }

      await this.saveFileMap();

      return { html: $.html(), map: this.formatResultMap(localMap) };
    } catch (error) {
      throw error;
    }


  }

  /**
   * Resolve a single URL, optionally relative to a base.
   *
   * @param inputUrl - The URL to resolve.
   * @param origin - Optional origin to resolve relative paths.
   * @returns { path, map } - Resolved URL and mapping.
   */
  async url(inputUrl: string, origin: string = '', fetchOptions: RequestInit = {}): Promise<FetchorawUrlResult> {
    console.log('Exec mode: ', this.execMode);

    try {
      const localMap = new Map<string, ResolverResult>();
      if(this.execMode === 'NONE'){
        return { path: inputUrl, map: this.formatResultMap(localMap) };
      }

      await this.loadFileMap();

      if(!inputUrl){
        return { path: inputUrl, map: this.formatResultMap(localMap) };
      }

      const hasCache = this.urlMap.has(this.generateMapKey(inputUrl, fetchOptions));
      if(this.execMode === 'CACHE'){
        if(hasCache){
          const resolvedData = this.urlMap.get(this.generateMapKey(inputUrl, fetchOptions))!;
          localMap.set(this.generateMapKey(inputUrl, fetchOptions), resolvedData);
          return {
            ...resolvedData,
            map: this.formatResultMap(localMap),
          };
        }else{
          console.warn(`Cache miss: ${inputUrl}`);
          return { path: inputUrl, map: this.formatResultMap(localMap) };
        }
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
        if(hasCache){
          const resolvedData = this.urlMap.get(this.generateMapKey(url.href, fetchOptions))!;
          localMap.set(this.generateMapKey(url.href, fetchOptions), resolvedData);

          return {
            ...resolvedData,
            map: this.formatResultMap(localMap),
          }
        }

        const resolved = await this.resolver(url.href, fetchOptions);
        const resolvedData = typeof resolved === 'string' ? { path: resolved } : resolved;
        localMap.set(this.generateMapKey(url.href, fetchOptions), resolvedData);
        this.urlMap.set(this.generateMapKey(url.href, fetchOptions), resolvedData);
        await this.saveFileMap();

        return {
          ...resolvedData,
          map: this.formatResultMap(localMap),
        }
      } catch (error) {
        console.error(`${inputUrl} error: `, error);
        throw error;
      }

    } catch (error) {
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
    DEFAULT_ENABLE_FETCH_ENV_VALUE,
    DEFAULT_ENABLE_CACHE_ENV_VALUE,
    DEFAULT_CACHE_FILE_PATH,
    DEFAULT_SELECTORS,
  };
}

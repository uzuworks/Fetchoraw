/**
 * Preset base URL patterns for popular CMS services.
 */
export const cmsUrls = {
  /** Base URL pattern for microCMS assets */
  microcms: /^https?:\/\/images\.microcms-assets\.io\/assets\//,

  /** Base URL pattern for Newt assets */
  newt: /^https?:\/\/assets\.newt\.so\//,

  /** Base URL pattern for Contentful assets */
  contentful: /^https?:\/\/images\.ctfassets\.net\//,

  /** Base URL pattern for Storyblok assets */
  storyblok: /^https?:\/\/a\.storyblok\.com\//,
};

/**
 * Preset selectors and attributes to find asset URLs in HTML.
 */
export const urlSelectors = {
  /** img[src] tag */
  ImgSrc: { selector: 'img[src]', attr: 'src' },

  /** img[srcset] tag */
  ImgSrcset: { selector: 'img[srcset]', attr: 'srcset' },

  /** source[src] tag */
  SourceSrc: { selector: 'source[src]', attr: 'src' },

  /** source[srcset] tag */
  SourceSrcset: { selector: 'source[srcset]', attr: 'srcset' },

  /** video[poster] tag */
  VideoPoster: { selector: 'video[poster]', attr: 'poster' },

  /** video[src] tag */
  VideoSrc: { selector: 'video[src]', attr: 'src' },

  /** audio[src] tag */
  AudioSrc: { selector: 'audio[src]', attr: 'src' },

  /** a[href] tag */
  AHref: { selector: 'a[href]', attr: 'href' },

  /** link[href] tag */
  LinkHref: { selector: 'link[href]', attr: 'href' },

  /** script[src] tag */
  ScriptSrc: { selector: 'script[src]', attr: 'src' },

  /** object[data] tag */
  ObjectData: { selector: 'object[data]', attr: 'data' },

  /** meta[property="og:image"] tag */
  OgImage: { selector: 'meta[property="og:image"]', attr: 'content' },

  /** meta[name="twitter:image"] tag */
  TwitterImage: { selector: 'meta[name="twitter:image"]', attr: 'content' },
};

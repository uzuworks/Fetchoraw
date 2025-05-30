/**
 * Fetchoraw built-in resolvers.
 *
 * These functions create asset resolvers for various use cases:
 *
 * - `createImageDataUrlResolver`: Inline small images as Data URLs
 * - `createImageFileSaveResolver`: Save image files to disk
 * - `createImageSmartResolver`: Choose between inlining and saving based on rules
 * - `createJsonFileSaveResolver`: Save JSON files and return parsed data
 *
 * You can pass any of these to the `Fetchoraw` constructor.
 *
 * @example
 * ```ts
 * import { Fetchoraw } from 'fetchoraw';
 * import { createImageSmartResolver } from 'fetchoraw/resolvers';
 *
 * const fetchoraw = new Fetchoraw(createImageSmartResolver());
 * const result = await fetchoraw.html('<img src="...">');
 * ```
 */
export * from './imageDataUrlResolver.js';
export * from './imageFileSaveResolver.js';
export * from './imageSmartResolver.js';
export * from './jsonFileSaveResolver.js';

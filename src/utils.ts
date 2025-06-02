import { OnErrorHandle, ResolverResult } from "./types";
import { basename, dirname, extname, join, normalize } from 'path';
import { access, constants } from 'fs/promises';

export async function pathExists(path: string) {
  try {
    await access(path, constants.F_OK);
    console.log(`Path exists: ${path}`);
    return true;
  } catch {
    console.warn(`Path does not exist: ${path}`);
    return false;
  }
}

export function onErrorHandler<T = string | ResolverResult>(
  error: any,
  onError: OnErrorHandle,
  urlReturn: T,
  blankReturn: T
) {
  console.warn(`Error on process: ${String(urlReturn)}} (${String(error)})`);
  if (onError === 'return-url') return urlReturn;
  if (onError === 'return-empty') return blankReturn;
  throw error;
} 

export async function generateResolvedFilePaths(
  url: string,
  fetchOptions: RequestInit,
  useSearch: boolean,
  hashLength: number = 0,
  forceExt: string = '',
  saveRoot: string,
  keyString: string | RegExp,
  prependPath: string
){
  let crypto;
  try {
    crypto = await import('crypto');
    if((globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__){
      throw new Error('__FETCHORAW_FORCE_NODE_FALLBACK__');
    }
  } catch (error) {
    return {
      savePath: url,
      sitePath: url
    }
  }

  const urlObj = new URL(url);
  const replacedSearch = useSearch ? [...urlObj.searchParams.entries()]
    .map(([k, v]) => `-${k}${v}`)
    .join('') : '';
  const hash = (() => {
    if(hashLength === 0){
      return '';
    }

    const hashBase = JSON.stringify({ url, options: fetchOptions })
    return `-${crypto.createHash('sha256').update(hashBase).digest('hex').slice(0, hashLength)}`;
  })();
  
  const rawPathname = decodeURI(url.replace(keyString, '').replace(urlObj.search, ''));
  const untrustedPath = [
    `${dirname(rawPathname)}/`,
    basename(rawPathname).replace(extname(rawPathname), ''),
    replacedSearch,
    hash,
    forceExt ? forceExt : extname(rawPathname)
  ].filter(Boolean).join('');
  const normalizedPath = normalize(untrustedPath).replace(/^\.+[\\/]/, '');
  const savePath = join(saveRoot, normalizedPath.replace(/^\/+/g, ''));

  return {
    savePath,
    sitePath: '/' + join(prependPath, normalizedPath).replace(/^\/+/g, '')
  }
}

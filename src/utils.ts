import crypto from 'crypto';
import { OnErrorHandle, ResolverResult } from "./types";
import { basename, dirname, extname, join, normalize } from 'path';

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

export function generateResolvedFilePaths(
  url: string,
  fetchOptions: RequestInit,
  useSearch: boolean,
  hashLength: number = 0,
  forceExt: string = '',
  saveRoot: string,
  keyString: string | RegExp,
  prependPath: string
){
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

import { OnErrorHandle, ResolverResult } from "./types";

const imp_crypto = 'crypto';
const imp_fsp = 'fs/promises';
const imp_path = 'path';

export async function pathExists(path: string) {
  let fsp;
  try {
    fsp = await import(imp_fsp);
    if((globalThis as any).__FETCHORAW_FORCE_NODE_FALLBACK__){
      throw new Error('__FETCHORAW_FORCE_NODE_FALLBACK__');
    }
  }catch{
    return false
  }

  try {
    await fsp.access(path, fsp.constants.F_OK);
    console.log(`Path exists: ${path}`);
    return true;
  } catch {
    console.warn(`Path does not exist: ${path}`);
    return false;
  }
}

export function getProjectRoot() {
  if(typeof process !== 'undefined' && typeof process.cwd === 'function'){
    return process.cwd()
  }else{
    '/'
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
  let crypto, path;
  try {
    crypto = await import(imp_crypto);
    path = await import(imp_path);
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
    `${path.dirname(rawPathname)}/`,
    path.basename(rawPathname).replace(path.extname(rawPathname), ''),
    replacedSearch,
    hash,
    forceExt ? forceExt : path.extname(rawPathname)
  ].filter(Boolean).join('');
  const normalizedPath = path.normalize(untrustedPath).replace(/^\.+[\\/]/, '');
  const savePath = path.join(saveRoot, normalizedPath.replace(/^\/+/g, ''));

  return {
    savePath,
    sitePath: '/' + path.join(prependPath, normalizedPath).replace(/^\/+/g, '')
  }
}

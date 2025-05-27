import { OnErrorHandle, ResolverResult } from "./types";

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

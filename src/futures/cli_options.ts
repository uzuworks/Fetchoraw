export type ResolverType = 'file' | 'dataurl' | 'smart';
export type OnErrorHandle = 'throw' | 'return-url' | 'return-empty';

export interface FetchorawCliBaseOptions {
  input: string;            // input.html
  out?: string;             // output.html
  overwrite?: boolean;      // force overwrite output
  onError?: OnErrorHandle;   // error policy
  selector?: string[];       // target selectors (img[src], etc.)
}

export interface FileModeOptions {
  saveRoot?: string;
  keyString?: string;
  prependPath?: string;
}

export interface DataUrlModeOptions {
  inlineLimit?: number;
  allowMime?: string[];
}

export interface SmartModeOptions {
  requireFile?: string[];
  targetPattern?: string[];
}

export interface FetchorawCliOptions extends
  FetchorawCliBaseOptions,
  Partial<FileModeOptions>,
  Partial<DataUrlModeOptions>,
  Partial<SmartModeOptions> {
  resolver: ResolverType;
}

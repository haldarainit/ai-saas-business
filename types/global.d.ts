export {};

declare global {
  interface ImportMeta {
    hot?: {
      data: any;
      accept: (cb?: (mod: any) => void) => void;
      dispose: (cb: (data: any) => void) => void;
    };
    env: {
      SSR: boolean;
      [key: string]: any;
    };
  }
}

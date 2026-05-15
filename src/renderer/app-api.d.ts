import type { GooeyPiApi } from "@shared/app-api";

declare global {
  interface Window {
    gooeyPi?: GooeyPiApi;
  }
}

export {};

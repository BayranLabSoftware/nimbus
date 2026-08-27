/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set by the deploy environment (Cloudflare Pages) to activate the
   *  Plausible analytics snippet. Leave unset in dev and preview. */
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  /** Optional override for the Plausible script host, e.g. a
   *  self-hosted proxy. Defaults to `https://plausible.io`. */
  readonly VITE_PLAUSIBLE_API_HOST?: string;
  /** Chiave Stadia Maps con dominio registrato. Da localhost si puo'
   *  lasciare vuota; da un dominio pubblico senza chiave le tessere
   *  del globo non arrivano e la Terra resta nera. */
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

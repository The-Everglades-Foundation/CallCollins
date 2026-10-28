/// <reference types="@cloudflare/workers-types" />
/// <reference path="../worker-configuration.d.ts" />
/// <reference types="astro/client" />

declare module "cloudflare:workers" {
  export const env: Env;
}

/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly POCKETBASE_URL: string;
  readonly PUBLIC_POCKETBASE_URL: string;
  readonly GOOGLE_SHEETS_ID: string;
  readonly GOOGLE_SERVICE_ACCOUNT_JSON: string;
  readonly GMAIL_SENDER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

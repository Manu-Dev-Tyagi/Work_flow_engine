/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VESTA_BASE_URL: string
  readonly VITE_VESTA_WORKSPACE_ID: string
  readonly VITE_VESTA_ACCESS_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

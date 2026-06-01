interface ImportMeta {
  readonly env: {
    readonly VITE_BACKEND_URL?: string
    readonly [key: string]: string | undefined
  }
}

export function getVestaBaseUrl(): string {
  const raw =
    process.env.VESTA_BASE_URL?.trim() ||
    process.env.VITE_VESTA_BASE_URL?.trim() ||
    'https://dev.intellsys.ai'
  return raw.replace(/\/+$/, '')
}

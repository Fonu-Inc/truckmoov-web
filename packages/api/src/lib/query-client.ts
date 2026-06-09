import { QueryClient } from '@tanstack/react-query'

import type { ServerErrorResponse } from './types'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ServerErrorResponse
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000
    }
  }
})

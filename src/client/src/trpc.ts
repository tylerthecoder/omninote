import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../server/router'

const currentUrl = window.location.origin;
const apiUrl = import.meta.env.VITE_API_URL || `${currentUrl}/trpc`;

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: apiUrl,
    }),
  ],
})

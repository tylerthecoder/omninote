import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../server/router'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:2022', // Adjust this URL to match your server
    }),
  ],
})

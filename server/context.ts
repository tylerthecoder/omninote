import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { TylersThings } from 'tt-services';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const tylersThings = await TylersThings.make();

  console.log("Creating context");

  return {
    req,
    res,
    tylersThings
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
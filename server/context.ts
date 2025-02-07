import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { TylersThings } from 'tt-services';
import { DatabaseSingleton } from 'tt-services/src/connections/mongo.ts';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const db = await DatabaseSingleton.getInstance();
  const tylersThings = await TylersThings.make(db);

  return {
    req,
    res,
    tylersThings
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
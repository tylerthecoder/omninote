import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Database } from './db.ts';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const mongoDBService = await Database.getInstance();

  console.log("Creating context");

  return {
    req,
    res,
    mongoDBService
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
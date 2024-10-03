import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { mongoDBService } from './mongodb-service.ts';
import { Plan } from '../types/types.ts';

export const t = initTRPC.create();

export const appRouter = t.router({
	getToday: t.procedure.query(async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set time to midnight
		const plan = await mongoDBService.getPlanByDay(today);
		console.log("Got plan", plan);
		return plan;
	}),

	createToday: t.procedure
		.input(z.object({ text: z.string() }))
		.mutation(async ({ input }) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0); // Set time to midnight
			const newPlan: Omit<Plan, 'createdAt' | 'updatedAt' | 'id'> = {
				day: today,
				text: input.text,
			};
			const createdPlan = await mongoDBService.createPlan(newPlan);
			return createdPlan;
		}),

	updatePlan: t.procedure
		.input(z.object({ id: z.string(), text: z.string() }))
		.mutation(async ({ input }) => {
			const updatedPlan = await mongoDBService.updatePlan(input.id, { text: input.text });
			return updatedPlan;
		}),
});

// export type definition of API
export type AppRouter = typeof appRouter;
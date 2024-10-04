import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { mongoDBService } from './mongodb-service.ts';
import { Plan } from '../types/types.ts';

export const t = initTRPC.create();

export const appRouter = t.router({
	getToday: t.procedure.query(async () => {
		console.log("Getting plan for today");
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
				day: today.toISOString(),
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

	getAllDays: t.procedure.query(async () => {
		console.log("Getting all plans");
		const plans = await mongoDBService.getAllPlans();
		console.log("Got all plans", plans);
		return plans;
	}),

	getAllPastDays: t.procedure.query(async () => {
		console.log("Getting all past plans");
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set time to midnight
		const pastPlans = await mongoDBService.getAllPastPlans(today);
		console.log("Got past plans", pastPlans);
		return pastPlans;
	}),

	getAllTodos: t.procedure.query(async () => {
		console.log("Getting all todos");
		const todos = await mongoDBService.getAllTodos();
		console.log("Got todos", todos);
		return todos;
	}),

	createTodo: t.procedure
		.input(z.object({ text: z.string(), completed: z.boolean() }))
		.mutation(async ({ input }) => {
			const newTodo = await mongoDBService.createTodo(input);
			return newTodo;
		}),

	updateTodo: t.procedure
		.input(z.object({ id: z.string(), text: z.string().optional(), completed: z.boolean().optional() }))
		.mutation(async ({ input }) => {
			const { id, ...update } = input;
			const updatedTodo = await mongoDBService.updateTodo(id, update);
			return updatedTodo;
		}),

	deleteTodo: t.procedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const result = await mongoDBService.deleteTodo(input.id);
			return result;
		}),

	getAllBuyListItems: t.procedure.query(async () => {
		console.log("Getting all buy list items");
		const items = await mongoDBService.getAllBuyListItems();
		console.log("Got buy list items", items);
		return items;
	}),

	createBuyListItem: t.procedure
		.input(z.object({
			text: z.string(),
			completed: z.boolean(),
			url: z.string().optional(),
			notes: z.string().optional()
		}))
		.mutation(async ({ input }) => {
			const newItem = await mongoDBService.createBuyListItem(input);
			return newItem;
		}),

	updateBuyListItem: t.procedure
		.input(z.object({
			id: z.string(),
			text: z.string().optional(),
			completed: z.boolean().optional(),
			url: z.string().optional(),
			notes: z.string().optional()
		}))
		.mutation(async ({ input }) => {
			const { id, ...update } = input;
			const updatedItem = await mongoDBService.updateBuyListItem(id, update);
			return updatedItem;
		}),

	deleteBuyListItem: t.procedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const result = await mongoDBService.deleteBuyListItem(input.id);
			return result;
		}),
});

// export type definition of API
export type AppRouter = typeof appRouter;
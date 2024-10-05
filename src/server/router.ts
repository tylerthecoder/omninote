import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Plan } from '../types/types.ts';
import { Context } from './context.ts';
import { TalkNote } from '../types/types.ts';

export const t = initTRPC.context<Context>().create();

// Helper function to get the current day boundary
function getCurrentDayBoundary(): Date {
  const now = new Date();
  const pstOffset = -7 * 60; // PST offset in minutes
  now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + pstOffset);

  if (now.getHours() < 7) {
    now.setDate(now.getDate() - 1);
  }

  now.setHours(7, 0, 0, 0);
  return now;
}

export const appRouter = t.router({
	getToday: t.procedure.query(async ({ ctx }) => {
		console.log("Getting plan for today");
		const today = getCurrentDayBoundary();
		const plan = await ctx.mongoDBService.getPlanByDay(today);
		console.log("Got plan", plan);
		return plan;
	}),

	createToday: t.procedure
		.input(z.object({ text: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const today = getCurrentDayBoundary();
			const newPlan: Omit<Plan, 'createdAt' | 'updatedAt' | 'id'> = {
				day: today.toISOString(),
				text: input.text,
			};
			const createdPlan = await ctx.mongoDBService.createPlan(newPlan);
			return createdPlan;
		}),

	updatePlan: t.procedure
		.input(z.object({ id: z.string(), text: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const updatedPlan = await ctx.mongoDBService.updatePlan(input.id, { text: input.text });
			return updatedPlan;
		}),

	getAllDays: t.procedure.query(async ({ ctx }) => {
		console.log("Getting all plans");
		const plans = await ctx.mongoDBService.getAllPlans();
		console.log("Got all plans", plans);
		return plans;
	}),

	getAllPastDays: t.procedure.query(async ({ ctx }) => {
		console.log("Getting all past plans");
		const today = getCurrentDayBoundary();
		const pastPlans = await ctx.mongoDBService.getAllPastPlans(today);
		console.log("Got past plans", pastPlans);
		return pastPlans;
	}),

	getAllTodos: t.procedure.query(async ({ ctx }) => {
		console.log("Getting all todos");
		const todos = await ctx.mongoDBService.getAllTodos();
		console.log("Got todos", todos);
		return todos;
	}),

	createTodo: t.procedure
			.input(z.object({ text: z.string(), completed: z.boolean() }))
			.mutation(async ({ input, ctx }) => {
				const newTodo = await ctx.mongoDBService.createTodo(input);
				return newTodo;
			}),

	updateTodo: t.procedure
			.input(z.object({ id: z.string(), text: z.string().optional(), completed: z.boolean().optional() }))
			.mutation(async ({ input, ctx }) => {
				const { id, ...update } = input;
				const updatedTodo = await ctx.mongoDBService.updateTodo(id, update);
				return updatedTodo;
			}),

	deleteTodo: t.procedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input, ctx }) => {
				const result = await ctx.mongoDBService.deleteTodo(input.id);
				return result;
			}),

	getAllBuyListItems: t.procedure.query(async ({ ctx }) => {
		console.log("Getting all buy list items");
		const items = await ctx.mongoDBService.getAllBuyListItems();
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
			.mutation(async ({ input, ctx }) => {
				const newItem = await ctx.mongoDBService.createBuyListItem(input);
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
			.mutation(async ({ input, ctx }) => {
				const { id, ...update } = input;
				const updatedItem = await ctx.mongoDBService.updateBuyListItem(id, update);
				return updatedItem;
			}),

	deleteBuyListItem: t.procedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input, ctx }) => {
				const result = await ctx.mongoDBService.deleteBuyListItem(input.id);
				return result;
			}),

	getAllTalkNotes: t.procedure.query(async ({ ctx }) => {
		console.log("Getting all talk notes");
		const talkNotes = await ctx.mongoDBService.getAllTalkNotes();
		console.log("Got talk notes", talkNotes);
		return talkNotes;
	}),

	getTalkNote: t.procedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			console.log(`Getting talk note with id: ${input.id}`);
			const talkNote = await ctx.mongoDBService.getTalkNoteById(input.id);
			console.log("Got talk note", talkNote);
			return talkNote;
		}),

	createTalkNote: t.procedure
		.input(z.object({
			title: z.string(),
			content: z.string(),
			speaker: z.string(),
			date: z.string()
		}))
		.mutation(async ({ input, ctx }) => {
			console.log("Creating new talk note");
			const newTalkNote = await ctx.mongoDBService.createTalkNote(input);
			console.log("Created talk note", newTalkNote);
			return newTalkNote;
		}),

	updateTalkNote: t.procedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			content: z.string().optional(),
			speaker: z.string().optional(),
			date: z.string().optional()
		}))
		.mutation(async ({ input, ctx }) => {
			console.log(`Updating talk note with id: ${input.id}`);
			const { id, ...update } = input;
			const updatedTalkNote = await ctx.mongoDBService.updateTalkNote(id, update);
			console.log("Updated talk note", updatedTalkNote);
			return updatedTalkNote;
		}),

	deleteTalkNote: t.procedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input, ctx }) => {
			console.log(`Deleting talk note with id: ${input.id}`);
			const result = await ctx.mongoDBService.deleteTalkNote(input.id);
			console.log("Delete result", result);
			return result;
		}),

	// ... (existing routes)
});

// export type definition of API
export type AppRouter = typeof appRouter;
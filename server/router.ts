import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context.ts';

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
    return ctx.tylersThings.dailyPlans.getToday();
  }),

  createToday: t.procedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const today = getCurrentDayBoundary();
      return ctx.tylersThings.dailyPlans.createPlan({
        day: today.toISOString(),
        text: input.text,
      });
    }),

  updatePlan: t.procedure
    .input(z.object({ id: z.string(), text: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.dailyPlans.updatePlan(input.id, { text: input.text });
    }),

  getAllDays: t.procedure.query(async ({ ctx }) => {
    return ctx.tylersThings.dailyPlans.getAllPlans();
  }),

  getAllPastDays: t.procedure.query(async ({ ctx }) => {
    const today = getCurrentDayBoundary();
    return ctx.tylersThings.dailyPlans.getAllPastPlans(today);
  }),

  // Todo routes
  getAllTodos: t.procedure.query(async ({ ctx }) => {
    return ctx.tylersThings.todo.getAllTodos();
  }),

  createTodo: t.procedure
    .input(z.object({ text: z.string(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.todo.createTodo(input);
    }),

  updateTodo: t.procedure
    .input(z.object({
      id: z.string(),
      text: z.string().optional(),
      completed: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...update } = input;
      return ctx.tylersThings.todo.updateTodo(id, update);
    }),

  deleteTodo: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.todo.deleteTodo(input.id);
    }),

  // Buy List routes
  getAllBuyListItems: t.procedure.query(async ({ ctx }) => {
    return ctx.tylersThings.buyList.getAllItems();
  }),

  createBuyListItem: t.procedure
    .input(z.object({
      text: z.string(),
      completed: z.boolean(),
      url: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.buyList.createItem(input);
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
      return ctx.tylersThings.buyList.updateItem(id, update);
    }),

  deleteBuyListItem: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.buyList.deleteItem(input.id);
    }),

  // Talk Notes routes
  getAllTalkNotes: t.procedure.query(async ({ ctx }) => {
    return ctx.tylersThings.talkNotes.getAllNotes();
  }),

  getTalkNote: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.talkNotes.getNoteById(input.id);
    }),

  createTalkNote: t.procedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      speaker: z.string(),
      date: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.talkNotes.createNote(input);
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
      const { id, ...update } = input;
      return ctx.tylersThings.talkNotes.updateNote(id, update);
    }),

  deleteTalkNote: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.talkNotes.deleteNote(input.id);
    }),

  // Reading List routes
  getAllReadingListItems: t.procedure.query(async ({ ctx }) => {
    return ctx.tylersThings.readingList.getAllItems();
  }),

  getReadingListItem: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.readingList.getItemById(input.id);
    }),

  createReadingListItem: t.procedure
    .input(z.object({
      name: z.string(),
      url: z.string().optional(),
      type: z.enum(['article', 'book']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.readingList.createItem(input);
    }),

  updateReadingListItem: t.procedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      url: z.string().optional(),
      type: z.enum(['article', 'book']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...update } = input;
      return ctx.tylersThings.readingList.updateItem(id, update);
    }),

  deleteReadingListItem: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.readingList.deleteItem(input.id);
    }),

  // Additional Talk Notes routes
  getTalkNotesByDate: t.procedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.talkNotes.getNotesByDate(input.date);
    }),

  // Additional Reading List routes
  getReadingListItemsByType: t.procedure
    .input(z.object({ type: z.enum(['article', 'book']) }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.readingList.getItemsByType(input.type);
    }),
  // Additional Buy List routes
  getBuyListItemsByStatus: t.procedure
    .input(z.object({ completed: z.boolean() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.buyList.getItemsByStatus(input.completed);
    }),

  markBuyListItemAsComplete: t.procedure
    .input(z.object({ id: z.string(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.buyList.updateItem(input.id, { completed: input.completed });
    }),

  // Additional Todo routes
  getTodosByStatus: t.procedure
    .input(z.object({ completed: z.boolean() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.todo.getTodosByStatus(input.completed);
    }),

  markTodoAsComplete: t.procedure
    .input(z.object({ id: z.string(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.todo.updateTodo(input.id, { completed: input.completed });
    }),

  // Notes routes
  getAllNotes: t.procedure.query(async ({ ctx }) => {
    return ctx.tylersThings.notes.getAllNotes();
  }),

  getNote: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.getNoteById(input.id);
    }),

  createNote: t.procedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      date: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.createNote(input);
    }),

  updateNote: t.procedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      date: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...update } = input;
      return ctx.tylersThings.notes.updateNote(id, update);
    }),

  deleteNote: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.deleteNote(input.id);
    }),

  publishNote: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.publishNote(input.id);
    }),

  unpublishNote: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.unpublishNote(input.id);
    }),

  // Add these routes to the existing router
  getAllCreations: t.procedure
    .query(async ({ ctx }) => {
      return ctx.tylersThings.creations.getAllCreations();
    }),

  getCreation: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.creations.getCreationById(input.id);
    }),

  createCreation: t.procedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      link: z.string(),
      type: z.string(),
      img: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.creations.createCreation(input);
    }),

  updateCreation: t.procedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      link: z.string().optional(),
      type: z.string().optional(),
      img: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...update } = input;
      return ctx.tylersThings.creations.updateCreation(id, update);
    }),

  deleteCreation: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.creations.deleteCreation(input.id);
    }),

  // Add these routes to the existing creations routes
  publishCreation: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.creations.publishCreation(input.id);
    }),

  unpublishCreation: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.creations.unpublishCreation(input.id);
    }),

  getPublishedCreations: t.procedure
    .query(async ({ ctx }) => {
      return ctx.tylersThings.creations.getPublishedCreations();
    }),

  // Add these to the existing router
  getAllSparks: t.procedure
    .query(async ({ ctx }) => {
        return ctx.tylersThings.sparks.getAllSparks();
    }),

  getSpark: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
        return ctx.tylersThings.sparks.getSparkById(input.id);
    }),

  createSpark: t.procedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.sparks.createSpark(input);
    }),

  updateSpark: t.procedure
    .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        notes: z.string().optional(),
        completed: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
        const { id, ...update } = input;
        return ctx.tylersThings.sparks.updateSpark(id, update);
    }),

  deleteSpark: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.sparks.deleteSpark(input.id);
    }),

  // Add these to the existing router
  getAllMovies: t.procedure
    .query(async ({ ctx }) => {
        return ctx.tylersThings.movies.getAllMovies();
    }),

  getMovie: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
        return ctx.tylersThings.movies.getMovieById(input.id);
    }),

  createMovie: t.procedure
    .input(z.object({
        title: z.string(),
        notes: z.string(),
        genre: z.string().optional(),
        releaseYear: z.number().optional()
    }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.movies.createMovie(input);
    }),

  updateMovie: t.procedure
    .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        notes: z.string().optional(),
        genre: z.string().optional(),
        releaseYear: z.number().optional(),
        rating: z.number().optional(),
        watched: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
        const { id, ...update } = input;
        return ctx.tylersThings.movies.updateMovie(id, update);
    }),

  deleteMovie: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.movies.deleteMovie(input.id);
    }),

  // Add these to the existing router
  getAllWeekendProjects: t.procedure
    .query(async ({ ctx }) => {
        return ctx.tylersThings.weekendProjects.getAllWeekendProjects();
    }),

  getWeekendProject: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
        return ctx.tylersThings.weekendProjects.getWeekendProjectById(input.id);
    }),

  createWeekendProject: t.procedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.weekendProjects.createWeekendProject(input);
    }),

  updateWeekendProject: t.procedure
    .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
        const { id, ...update } = input;
        return ctx.tylersThings.weekendProjects.updateWeekendProject(id, update);
    }),

  deleteWeekendProject: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.weekendProjects.deleteWeekendProject(input.id);
    }),

  // Add these to the existing router
  getAllTechies: t.procedure
    .query(async ({ ctx }) => {
        return ctx.tylersThings.techies.getAllTechies();
    }),

  getTechie: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
        return ctx.tylersThings.techies.getTechieById(input.id);
    }),

  createTechie: t.procedure
    .input(z.object({
        title: z.string(),
        content: z.string(),
        url: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.techies.createTechie(input);
    }),

  updateTechie: t.procedure
    .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        url: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
        const { id, ...update } = input;
        return ctx.tylersThings.techies.updateTechie(id, update);
    }),

  deleteTechie: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
        return ctx.tylersThings.techies.deleteTechie(input.id);
    }),

  // Add these new routes for tag management
  addTag: t.procedure
    .input(z.object({
      id: z.string(),
      tag: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.addTag(input.id, input.tag);
    }),

  removeTag: t.procedure
    .input(z.object({
      id: z.string(),
      tag: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.removeTag(input.id, input.tag);
    }),

  getNotesByTag: t.procedure
    .input(z.object({
      tag: z.string()
    }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.notes.getNotesByTag(input.tag);
    }),

  // Google Notes routes
  getAllGoogleNotes: t.procedure
    .query(async ({ ctx }) => {
      return ctx.tylersThings.googleNotes.getAllGoogleNotes();
    }),

  getGoogleNoteById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.googleNotes.getGoogleNoteById(input.id);
    }),

  createGoogleNote: t.procedure
    .input(z.object({ googleDocId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.googleNotes.createGoogleNote(input.googleDocId);
    }),

  updateGoogleNote: t.procedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      date: z.string().optional(),
      googleDocId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...update } = input;
      return ctx.tylersThings.googleNotes.updateGoogleNote(id, update);
    }),

  deleteGoogleNote: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.tylersThings.googleNotes.deleteGoogleNote(input.id);
    }),

  getGoogleDocContent: t.procedure
    .input(z.object({ googleDocId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.tylersThings.googleNotes.getGoogleDocContent(input.googleDocId);
    }),
});

export type AppRouter = typeof appRouter;

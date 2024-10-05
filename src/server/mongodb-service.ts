import { MongoClient, Collection, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { Plan, Todo, BuyListItem, TalkNote } from '../types/types.ts';

dotenv.config();

type NoId<T> = Omit<T, 'id'>;

const MONGO_COLLECTION_NAME = 'notes';
const TODO_COLLECTION_NAME = 'todos';
const BUY_LIST_COLLECTION_NAME = 'buylist';
const TALK_NOTE_COLLECTION_NAME = 'talknotes';

class MongoDBService {
  private readonly client: MongoClient;
  private readonly db: string;
  private collection?: Collection<NoId<Plan>>;
  private todoCollection?: Collection<NoId<Todo>>;
  private buyListCollection?: Collection<NoId<BuyListItem>>;
  private talkNoteCollection?: Collection<NoId<TalkNote>>;

  constructor() {
    const uri = process.env.DB_URI;
    this.db = 'tylernote';

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
      const database = this.client.db(this.db);
      this.collection = database.collection<NoId<Plan>>(MONGO_COLLECTION_NAME);
      this.todoCollection = database.collection<NoId<Todo>>(TODO_COLLECTION_NAME);
      this.buyListCollection = database.collection<NoId<BuyListItem>>(BUY_LIST_COLLECTION_NAME);
      this.talkNoteCollection = database.collection<NoId<TalkNote>>(TALK_NOTE_COLLECTION_NAME);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  async createPlan(plan: Omit<Plan, 'createdAt' | 'updatedAt' | 'id'>): Promise<Plan> {
    const newPlan: NoId<Plan> = {
      ...plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.getCollection().insertOne(newPlan);
    return { ...newPlan, id: result.insertedId.toString() };
  }

  async getPlanByDay(day: Date): Promise<Plan | null> {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const result = await this.getCollection().findOne({
      day: {
        $gte: day.toISOString(),
        $lt: nextDay.toISOString()
      }
    });
    return result ? { ...result, id: result._id.toString() } : null;
  }

  async getAllPlans(): Promise<Plan[]> {
    const results = await this.getCollection().find().sort({ day: -1 }).toArray();
    return results.map(result => ({ ...result, id: result._id.toString() }));
  }

  async close(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  private getCollection(): Collection<NoId<Plan>> {
    if (!this.collection) {
      throw new Error('MongoDB collection is not initialized. Did you forget to call connect()?');
    }
    return this.collection;
  }

  async updatePlan(id: string, update: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Plan> {
    const collection = this.getCollection();
    const updateDoc = {
      $set: {
        ...update,
        updatedAt: new Date().toISOString(),
      },
    };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      { returnDocument: 'after' }
    );
    if (!result) {
      throw new Error(`Plan with id ${id} not found`);
    }
    return { ...result, id: result._id.toString() };
  }

  async getAllPastPlans(today: Date): Promise<Plan[]> {
    const results = await this.getCollection().find({ day: { $lt: today.toISOString() } }).sort({ day: -1 }).toArray();
    return results.map(result => ({ ...result, id: result._id.toString() }));
  }

  private getTodoCollection(): Collection<NoId<Todo>> {
    if (!this.todoCollection) {
      throw new Error('MongoDB todo collection is not initialized. Did you forget to call connect()?');
    }
    return this.todoCollection;
  }

  async createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const newTodo: NoId<Todo> = {
      ...todo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.getTodoCollection().insertOne(newTodo);
    return { ...newTodo, id: result.insertedId.toString() };
  }

  async getAllTodos(): Promise<Todo[]> {
    const results = await this.getTodoCollection().find().toArray();
    return results.map(result => ({ ...result, id: result._id.toString() }));
  }

  async updateTodo(id: string, update: Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Todo> {
    const collection = this.getTodoCollection();
    const updateDoc = {
      $set: {
        ...update,
        updatedAt: new Date().toISOString(),
      },
    };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      { returnDocument: 'after' }
    );
    if (!result) {
      throw new Error(`Todo with id ${id} not found`);
    }
    return { ...result, id: result._id.toString() };
  }

  async deleteTodo(id: string): Promise<boolean> {
    const result = await this.getTodoCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  private getBuyListCollection(): Collection<NoId<BuyListItem>> {
    if (!this.buyListCollection) {
      throw new Error('MongoDB buy list collection is not initialized. Did you forget to call connect()?');
    }
    return this.buyListCollection;
  }

  async createBuyListItem(item: Omit<BuyListItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<BuyListItem> {
    const newItem: NoId<BuyListItem> = {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.getBuyListCollection().insertOne(newItem);
    return { ...newItem, id: result.insertedId.toString() };
  }

  async getAllBuyListItems(): Promise<BuyListItem[]> {
    const results = await this.getBuyListCollection().find().toArray();
    return results.map(result => ({ ...result, id: result._id.toString() }));
  }

  async updateBuyListItem(id: string, update: Partial<Omit<BuyListItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BuyListItem> {
    const collection = this.getBuyListCollection();
    const updateDoc = {
      $set: {
        ...update,
        updatedAt: new Date().toISOString(),
      },
    };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      { returnDocument: 'after' }
    );
    if (!result) {
      throw new Error(`Buy list item with id ${id} not found`);
    }
    return { ...result, id: result._id.toString() };
  }

  async deleteBuyListItem(id: string): Promise<boolean> {
    const result = await this.getBuyListCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  private getTalkNoteCollection(): Collection<NoId<TalkNote>> {
    if (!this.talkNoteCollection) {
      throw new Error('MongoDB talk note collection is not initialized. Did you forget to call connect()?');
    }
    return this.talkNoteCollection;
  }

  async createTalkNote(talkNote: Omit<TalkNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<TalkNote> {
    const newTalkNote: NoId<TalkNote> = {
      ...talkNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.getTalkNoteCollection().insertOne(newTalkNote);
    return { ...newTalkNote, id: result.insertedId.toString() };
  }

  async getAllTalkNotes(): Promise<TalkNote[]> {
    const results = await this.getTalkNoteCollection().find().sort({ date: -1 }).toArray();
    return results.map(result => ({ ...result, id: result._id.toString() }));
  }

  async getTalkNoteById(id: string): Promise<TalkNote | null> {
    const result = await this.getTalkNoteCollection().findOne({ _id: new ObjectId(id) });
    return result ? { ...result, id: result._id.toString() } : null;
  }

  async updateTalkNote(id: string, update: Partial<Omit<TalkNote, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TalkNote> {
    const collection = this.getTalkNoteCollection();
    const updateDoc = {
      $set: {
        ...update,
        updatedAt: new Date().toISOString(),
      },
    };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      { returnDocument: 'after' }
    );
    if (!result) {
      throw new Error(`Talk note with id ${id} not found`);
    }
    return { ...result, id: result._id.toString() };
  }

  async deleteTalkNote(id: string): Promise<boolean> {
    const result = await this.getTalkNoteCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}

export { MongoDBService };
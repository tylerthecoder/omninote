import { MongoClient, Collection, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { Plan } from '../types/types.ts';

dotenv.config();

type NoId<T> = Omit<T, 'id'>;


const MONGO_COLLECTION_NAME = 'notes';

class MongoDBService {
  private readonly client: MongoClient;
  private readonly db: string;
  private collection?: Collection<NoId<Plan>>;

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
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  async createPlan(plan: Omit<Plan, 'createdAt' | 'updatedAt' | 'id'>): Promise<Plan> {
    const newPlan: NoId<Plan> = {
      ...plan,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.getCollection().insertOne(newPlan);
    return { ...newPlan, id: result.insertedId.toString() };
  }

  async getPlanByDay(day: Date): Promise<Plan | null> {
    const result = await this.getCollection().findOne({ day: day });
    return result ? { ...result, id: result._id.toString() } : null;
  }

  async getAllPlans(): Promise<Plan[]> {
    const results = await this.getCollection().find().toArray();
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
        updatedAt: new Date(),
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
}

export const mongoDBService = new MongoDBService();

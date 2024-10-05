import { MongoDBService } from './mongodb-service.ts';

class Database {
  private static instance: MongoDBService | null = null;

  private constructor() {}

  public static async getInstance(): Promise<MongoDBService> {
    if (!Database.instance) {
      Database.instance = new MongoDBService();
      await Database.instance.connect();
    }
    return Database.instance;
  }
}

export { Database };
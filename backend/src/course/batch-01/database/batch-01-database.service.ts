// backend/src/course/batch-01/database/batch-01-database.service.ts

import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  Db,
  MongoClient,
} from 'mongodb';

@Injectable()
export class Batch01DatabaseService
  implements OnModuleInit, OnModuleDestroy
{
  private client!: MongoClient;
  private database!: Db;

    private connecting?: Promise<void>;

  // Other Batch-01 services call this first, because Nest runs
  // onModuleInit hooks of one module in parallel (no fixed order).
  // Safe to call many times: it connects only once.
  ready(): Promise<void> {
    if (!this.connecting) {
      this.connecting = this.connect();
    }

    return this.connecting;
  }

  async onModuleInit(): Promise<void> {
    await this.ready();
  }

  private async connect(): Promise<void> {
    const uri = process.env.COURSE_MONGODB_URI;

    if (!uri) {
      throw new Error('COURSE_MONGODB_URI is missing');
    }

    this.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    await this.client.connect();

    this.database = this.client.db(
      process.env.COURSE_MONGODB_DATABASE ||
        'research_ustad_courses',
    );

    // Confirm that the shared database connection is ready.
    await this.database.command({ ping: 1 });

    console.log(
      '[Batch-01] Shared MongoDB connection established',
    );
  }

  // Needed for MongoDB transactions (serial ID assignment).
  getClient(): MongoClient {
    if (!this.client) {
      throw new Error(
        'Batch-01 MongoDB connection is not initialized',
      );
    }

    return this.client;
  }

  

  getDb(): Db {
    if (!this.database) {
      throw new Error(
        'Batch-01 MongoDB connection is not initialized',
      );
    }

    return this.database;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log(
        '[Batch-01] Shared MongoDB connection closed',
      );
    }
  }
}
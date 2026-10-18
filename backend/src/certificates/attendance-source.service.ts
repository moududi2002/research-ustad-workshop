import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';

@Injectable()
export class AttendanceSourceService implements OnModuleDestroy {
  private readonly logger = new Logger(AttendanceSourceService.name);
  private client: MongoClient | null = null;
  private connecting: Promise<MongoClient> | null = null;

  constructor(private readonly config: ConfigService) {}

  private async collection() {
    const uri = this.config.get<string>('MONGODB_URI');
    if (!uri) throw new ServiceUnavailableException('MONGODB_URI is not configured');
    if (!this.client) {
      if (!this.connecting) {
        const next = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
        this.connecting = next.connect().then(client => {
          this.client = client;
          return client;
        }).catch(err => {
          this.logger.error('Could not connect to the attendance MongoDB', err);
          throw new ServiceUnavailableException('Attendance database is unavailable');
        }).finally(() => { this.connecting = null; });
      }
      await this.connecting;
    }
    const dbName = this.config.get<string>('MONGODB_DB', 'research_ustad_class');
    return this.client!.db(dbName).collection('attendances');
  }

  // MongoDB is only a source of attendance registration IDs.
  // It does NOT supply names, emails, phone numbers, departments or universities.
  async getAttendedRegistrationIds(): Promise<string[]> {
    const col = await this.collection();
    const ids = await col.distinct('registrationId', {
      attended: true,
      registrationId: { $type: 'string' },
    });
    return [...new Set(ids.map(v => v.trim()).filter(Boolean))].sort();
  }

  async isAttended(registrationId: string): Promise<boolean> {
    const col = await this.collection();
    return Boolean(await col.findOne({ registrationId, attended: true }, { projection: { _id: 1 } }));
  }

  async onModuleDestroy() {
    if (this.client) await this.client.close();
  }
}

// backend/src/seed/seed-admin.ts

/**
 * Seed script to create the first admin account.
 * Run: npx ts-node src/seed/seed-admin.ts
 *
 * Reads credentials from environment variables so no password
 * is hardcoded in source code.
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Admin } from '../../auth/admin.entity';

dotenv.config();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME || 'Research Ustad Admin';

  if (!email || !password) {
    console.error(
      '❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'research_ustad_workshop',
    entities: [Admin],
    synchronize: false,
  });

  await dataSource.initialize();

  const adminRepo = dataSource.getRepository(Admin);

  const existing = await adminRepo.findOne({ where: { email } });

  if (existing) {
    console.log(`ℹ️  Admin already exists: ${email}`);
    await dataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = adminRepo.create({
    email,
    fullName,
    passwordHash,
    role: 'superadmin',
    isActive: true,
  });

  await adminRepo.save(admin);

  console.log(`✅ Admin created successfully: ${email}`);
  await dataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
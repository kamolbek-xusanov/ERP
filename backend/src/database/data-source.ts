import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  uuidExtension: 'pgcrypto',
});

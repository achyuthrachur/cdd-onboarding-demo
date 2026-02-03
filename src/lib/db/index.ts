import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create the Neon connection
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export schema for convenience
export * from './schema';

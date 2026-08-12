import 'dotenv/config';

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};

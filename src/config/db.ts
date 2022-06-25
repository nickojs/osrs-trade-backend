import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/controllers/user/user.entity';

export default {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
  retryAttempts: 2,
  ssl: {
    rejectUnauthorized: false,
  },
} as TypeOrmModuleOptions;

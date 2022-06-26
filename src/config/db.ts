import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Inventory } from 'src/containers/items/entities/inventory.entity';
import { User } from 'src/containers/user/entities/user.entity';

export default {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Inventory],
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
  retryAttempts: 2,
  ssl: {
    rejectUnauthorized: false,
  },
} as TypeOrmModuleOptions;

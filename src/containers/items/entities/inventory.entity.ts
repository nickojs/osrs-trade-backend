import { User } from 'src/containers/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'OSRS_Inventory' })
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemId: number;

  @OneToOne(() => User)
  @JoinColumn()
  userId: string;
}

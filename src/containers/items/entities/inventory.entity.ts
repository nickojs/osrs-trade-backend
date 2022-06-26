import { User } from 'src/containers/user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'OSRS_Inventory' })
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemId: number;

  @Column()
  qtd: number;

  @ManyToOne(() => User, (user) => user.inventory)
  user: User;
}

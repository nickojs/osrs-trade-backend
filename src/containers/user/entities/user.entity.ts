import { Inventory } from 'src/containers/items/entities/inventory.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity({ name: 'OSRS_Users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    length: 12,
  })
  username: string;

  @Column()
  password: string;

  @Column()
  profilePicId: number;

  @OneToMany(() => Inventory, (inventory) => inventory.user)
  inventory: Inventory[];
}

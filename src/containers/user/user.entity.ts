import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}

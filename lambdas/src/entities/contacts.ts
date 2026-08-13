import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';
  
@Entity('contacts')
class Contacts {
  @PrimaryGeneratedColumn()
  id: number
  
  @Column({ type: 'varchar'})
  email: string

  @Column({ type: 'int'})
  account_id: number

  @Column({ type: 'json', name: 'metadata' })
  metadata: any

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date
}


export { Contacts };
  
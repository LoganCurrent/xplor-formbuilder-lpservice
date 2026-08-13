import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated
} from 'typeorm';
  
@Entity('contact_event')
class ContactEvent {
@PrimaryGeneratedColumn()
id: number
    
@Column('varchar', {length: 36,  name: 'uuid' })
@Generated('uuid')
uuid: string

@Column({ name: 'type' })
type: string

@Column({ name: 'contact_id' })
contactId: number

@Column({ type: 'json', name: 'metadata' })
metadata: any

@CreateDateColumn({ name: 'created_at', type: 'timestamp' })
createdAt: Date

@UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
updatedAt: Date

@Column({ name: 'deleted_at', type: 'timestamp', nullable:true })
deletedAt: Date

}


export { ContactEvent };

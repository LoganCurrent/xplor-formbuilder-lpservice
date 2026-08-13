import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated
} from 'typeorm';
    
enum sources {
  MANUAL = 'manual',
  AUTOMATIC ='automatic'
}

@Entity('contact_contacts_list')
class ContactContactsList {
  @PrimaryGeneratedColumn()
  id: number
      
  @Column('varchar', {length: 36,  name: 'uuid' })
  @Generated('uuid')
  uuid: string
  
  @Column({ name: 'contact_id' })
  contactId: number
  
  @Column({ name: 'contact_list_id' })
  contactListId: number

  @Column({ 
    type: 'enum',
    enum: sources,
    name: 'source' ,
    default:sources.MANUAL
  })
  source: sources
  
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date
  
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date
  
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date
  
}
  
  
export { ContactContactsList, sources };
  
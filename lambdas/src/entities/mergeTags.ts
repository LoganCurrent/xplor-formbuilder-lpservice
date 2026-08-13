
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    DeleteDateColumn,
    Generated
  } from 'typeorm';

  @Entity('merge_tags')
  class MergeTag {
    @PrimaryGeneratedColumn({ name: 'id', unsigned: true })
    id: number;
  
    @Column({ name: 'uuid', type: 'char', unique: true })
    @Generated('uuid')
    uuid: string;

    @Column({ type: 'int'})
    account_id: number

    @Column({ type: 'varchar'})
    identifier: string
  
    @Column({ type: 'varchar'}) 
    label: string
  
    @Column({ type: 'varchar'})
    value: string
  
    @Column({ type: 'boolean', name: 'franchise' })
    franchise: boolean

    @Column({ type: 'boolean', name: 'label_is_locked' })
    label_is_locked: boolean
  
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
    deletedAt: Date
  }
  
  
  export { MergeTag };
    
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  Generated,
  Index,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('checkoutflows')
class Checkoutflows {
  @PrimaryGeneratedColumn({ name: 'id', unsigned: true })
  id: number;

  @Column({ name: 'uuid', type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'account_id', type: 'int', unsigned: true })
  @Index('account_id')
  accountId: number;

  @Column({ name: 'contact_list_id', type: 'int', unsigned: true })
  @Index('contact_list_id')
  contactListId: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'settings', type: 'json', nullable: true })
  settings: any;

  @Column({ name: 'published', type: 'boolean', default: false })
  published: boolean;

  @Column({ name: 'access', type: 'enum', enum: ['READ_ONLY', 'STANDARD'], default: 'STANDARD' })
  access: 'READ_ONLY' | 'STANDARD';

  @Column({ name: 'parent_checkoutflow_id', type: 'int', unsigned: true, nullable: true })
  @Index('parent_checkoutflow_id')
  parentCheckoutFlowId: number | null;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date | null;
}


export { Checkoutflows };

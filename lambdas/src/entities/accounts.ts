import {
  Entity,
  PrimaryGeneratedColumn,
  Generated,
  Column,
  DeleteDateColumn,
  Index
} from 'typeorm';


@Entity({ name: 'accounts' })
@Index(['external_id', 'vendor'], { unique: true })
class Accounts {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index('uuid')
  @Column({ type: 'char', length: 36, name: 'uuid', unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ type: 'int', width: 10, unsigned: true, nullable: true })
  legacy_id: number;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  franchise: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  brand_restriction: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  intake_switch: boolean;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  external_id: string;

  @Column({ type: 'varchar', nullable: true })
  vendor: string;

  @Column({ type: 'varchar', nullable: true })
  address_1: string;

  @Column({ type: 'varchar', nullable: true })
  address_2: string;

  @Column({ type: 'varchar', nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zip_code: string;

  @Column({ type: 'varchar', nullable: true })
  city: string;

  @Column({ type: 'varchar', default: 'US', nullable: true })
  country: string;

  @Column({ type: 'varchar', default: 'America/New_York' })
  timezone: string;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    subdomain: string;
  };

  @Column({ type: 'longtext', nullable: true })
  liability_waiver: string;

  @Column({ type: 'varchar', nullable: true })
  sendgrid_subuser_username: string;

  @Column({ type: 'varchar', nullable: true })
  sendgrid_subuser_id: string;

  @Column({ type: 'varchar', nullable: true })
  sendgrid_subuser_password: string;

  @Column({ type: 'varchar', nullable: true })
  sendgrid_api_id: string;

  @Column({ type: 'varchar', nullable: true })
  sendgrid_api_key: string;

  @Column({ type: 'varchar', nullable: true })
  twilio_sid: string;

  @Column({ type: 'varchar', nullable: true })
  twilio_api_secret: string;

  @Column({ type: 'varchar', nullable: true })
  twilio_api_key: string;

  @Column({ type: 'varchar', nullable: true })
  facebook_api_key: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_id: string;

  @Column({ type: 'varchar', nullable: true })
  card_brand: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  card_last_four: string;

  @Column({ type: 'timestamp', nullable: true })
  trial_ends_at: Date;

  @Column({ type: 'varchar', length: 4, default: 'USD' })
  currency: string;

  @Column({ type: 'tinyint', width: 1, default: 0, nullable: true })
  is_uia_vendor: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0, nullable: true })
  is_developer_account: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    precision: 0,
    nullable: true,
  })
  deleted_at: Date;
}

export { Accounts };

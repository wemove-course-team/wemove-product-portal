import { Column, Entity, Index, PrimaryColumn } from 'typeorm'
@Entity({ name: 'dealer_application' })
export class DealerApplication {
  @PrimaryColumn({ length: 32 }) id!: string
  @Index() @Column({ name: 'user_id', type: 'bigint', nullable: true }) userId!: number | null
  @Column({ name: 'company_name', length: 128 }) companyName!: string
  @Column({ name: 'tax_id', length: 64 }) taxId!: string
  @Column({ name: 'business_type', length: 64 }) businessType!: string
  @Column({ length: 128 }) region!: string
  @Column({ name: 'contact_name', length: 64 }) contactName!: string
  @Column({ length: 32 }) phone!: string
  @Column({ length: 128 }) email!: string
  @Column({ name: 'annual_target', length: 64 }) annualTarget!: string
  @Column({ name: 'sales_channels', type: 'text', nullable: true }) salesChannels!: string | null
  @Column({ length: 32, default: 'PENDING' }) status!: 'PENDING' | 'APPROVED' | 'REJECTED'
  @Column({ name: 'tier_name', type: 'varchar', length: 64, nullable: true }) tierName!: string | null
  @Column({ name: 'discount_rate', type: 'decimal', precision: 4, scale: 2, nullable: true }) discountRate!: number | null
  @Column({ name: 'audit_note', type: 'varchar', length: 255, nullable: true }) auditNote!: string | null
  @Column({ name: 'audited_at', type: 'datetime', nullable: true }) auditedAt!: Date | null
  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }) createdAt!: Date
}

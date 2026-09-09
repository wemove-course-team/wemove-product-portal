import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** 已审核通过的经销商企业。 */
@Entity({ name: 'dealer_company' })
export class DealerCompany {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number

  @Column({ name: 'company_name', length: 128 })
  companyName!: string

  @Column({ name: 'tax_id', length: 64, unique: true })
  taxId!: string

  @Column({ name: 'business_type', length: 64 })
  businessType!: string

  @Column({ length: 128 })
  region!: string

  @Column({ name: 'tier_name', length: 64, default: '二级特约经销商' })
  tierName!: string

  @Column({ name: 'discount_rate', type: 'decimal', precision: 4, scale: 2, default: 0.75 })
  discountRate!: number

  @Column({ name: 'payment_terms', length: 128, default: '预付款' })
  paymentTerms!: string

  @Column({ length: 8, default: 'CNY' })
  currency!: string

  @Column({ name: 'account_manager', type: 'varchar', length: 64, nullable: true })
  accountManager!: string | null

  @Column({ name: 'contact_name', length: 64 })
  contactName!: string

  @Column({ name: 'contact_phone', length: 32 })
  contactPhone!: string

  @Column({ name: 'contact_email', length: 128 })
  contactEmail!: string

  @Column({ length: 32, default: 'ACTIVE' })
  status!: string
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'sys_user' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: number
  @Column({ length: 64, unique: true }) username!: string
  @Column({ name: 'password_hash', length: 255 }) passwordHash!: string
  @Column({ name: 'real_name', length: 64, nullable: true }) realName!: string | null
  @Column({ length: 128, unique: true }) email!: string
  @Column({ length: 32, nullable: true }) phone!: string | null
  @Column({ length: 32, default: 'USER' }) role!: string
  @Column({ name: 'company_id', type: 'bigint', nullable: true }) companyId!: number | null
  @Column({ type: 'tinyint', default: 1 }) status!: number
}

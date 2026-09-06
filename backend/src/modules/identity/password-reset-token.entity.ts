import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'password_reset_token' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: number

  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash!: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt!: Date | null

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt!: Date
}

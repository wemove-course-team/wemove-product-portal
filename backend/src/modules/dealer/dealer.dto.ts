import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'
export class CreateDealerApplicationDto {
  @IsString() @IsNotEmpty() @MaxLength(128) companyName!: string
  @IsString() @IsNotEmpty() @MaxLength(64) taxId!: string
  @IsString() @IsNotEmpty() @MaxLength(64) businessType!: string
  @IsString() @IsNotEmpty() @MaxLength(128) region!: string
  @IsString() @IsNotEmpty() @MaxLength(64) contactName!: string
  @IsString() @IsNotEmpty() @MaxLength(32) phone!: string
  @IsEmail() email!: string
  @IsString() @IsNotEmpty() @MaxLength(64) annualTarget!: string
  @IsOptional() @IsString() @MaxLength(5000) salesChannels?: string
}
export class ReviewDealerApplicationDto {
  @IsIn(['APPROVED', 'REJECTED']) action!: 'APPROVED' | 'REJECTED'
  @IsString() @IsNotEmpty() @MaxLength(255) auditNote!: string
  @IsOptional() @IsString() @MaxLength(64) tierName?: string
  @IsOptional() @IsNumber() discountRate?: number
}

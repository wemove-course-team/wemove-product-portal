import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

/** 提交经销商申请的参数。 */
export class CreateDealerApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  companyName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  taxId!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  businessType!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  region!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  contactName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string

  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  annualTarget!: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  salesChannels?: string
}

/** 管理员审核申请的参数。 */
export class ReviewDealerApplicationDto {
  @IsIn(['APPROVED', 'REJECTED'])
  action!: 'APPROVED' | 'REJECTED'

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  auditNote!: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tierName?: string

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1)
  discountRate?: number
}

/** 管理员申请列表筛选条件。 */
export class DealerApplicationQueryDto {
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'

  @IsOptional()
  page?: number

  @IsOptional()
  pageSize?: number
}

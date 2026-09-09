import { Type } from 'class-transformer'
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEmail, IsIn, IsInt,
  IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested
} from 'class-validator'

/** 报价和快捷采购共用的商品数量输入。 */
export class DealerLineItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  quantity!: number
}

export class CreateDealerQuoteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DealerLineItemDto)
  items!: DealerLineItemDto[]

  @IsDateString()
  requestedDeliveryDate!: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string
}

export class CreateDealerOrderDto extends CreateDealerQuoteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  addressId!: number

  @IsIn(['BANK_TRANSFER', 'PURCHASE_ORDER'])
  paymentMethod!: 'BANK_TRANSFER' | 'PURCHASE_ORDER'

  @ValidateIf((value: CreateDealerOrderDto) => value.paymentMethod === 'PURCHASE_ORDER')
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  poNumber?: string
}

export class CreateDealerAddressDto {
  @IsString() @IsNotEmpty() @MaxLength(64) label!: string
  @IsString() @IsNotEmpty() @MaxLength(64) recipientName!: string
  @IsString() @IsNotEmpty() @MaxLength(32) @Matches(/^[0-9+\-()\s]{6,32}$/, { message: '联系电话格式不正确' }) phone!: string
  @IsString() @IsNotEmpty() @MaxLength(64) province!: string
  @IsString() @IsNotEmpty() @MaxLength(64) city!: string
  @IsString() @IsNotEmpty() @MaxLength(64) district!: string
  @IsString() @IsNotEmpty() @MaxLength(255) detailAddress!: string
  @IsIn(['SHIPPING', 'BILLING', 'HEADQUARTERS']) addressType!: 'SHIPPING' | 'BILLING' | 'HEADQUARTERS'
  @IsOptional() @IsBoolean() isDefault?: boolean
}

export class UpdateDealerCompanyDto {
  @IsString() @IsNotEmpty() @MaxLength(64) contactName!: string
  @IsString() @IsNotEmpty() @MaxLength(32) @Matches(/^[0-9+\-()\s]{6,32}$/, { message: '联系电话格式不正确' }) contactPhone!: string
  @IsEmail() @MaxLength(128) contactEmail!: string
  @IsString() @IsNotEmpty() @MaxLength(64) businessType!: string
}

export class DealerWorkspaceQueryDto {
  @IsOptional() @IsString() @MaxLength(100) keyword?: string
  @IsOptional() @IsString() @MaxLength(32) status?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number
}

export class UpdateDealerCompanyStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED'
}

export class AdminQuoteDecisionDto {
  @IsIn(['QUOTED', 'REJECTED'])
  action!: 'QUOTED' | 'REJECTED'

  @ValidateIf((input: AdminQuoteDecisionDto) => input.action === 'QUOTED')
  @Type(() => Number)
  @IsInt({ message: '报价金额应以分为最小精度的有效数字' })
  @Min(1)
  totalAmountFen?: number

  @ValidateIf((input: AdminQuoteDecisionDto) => input.action === 'QUOTED')
  @IsDateString()
  validUntil?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  platformNote!: string
}

export class AdminOrderStatusDto {
  @IsIn(['CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'])
  status!: 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'

  @ValidateIf((input: AdminOrderStatusDto) => input.status === 'SHIPPED')
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  trackingNo?: string
}

export class AdminInvoiceStatusDto {
  @IsIn(['PAID', 'VOID'])
  status!: 'PAID' | 'VOID'
}

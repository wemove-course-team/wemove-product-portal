import {
    IsString,
    IsNotEmpty,
    IsEmail,
    MaxLength,
    IsOptional,
    IsEnum,
    IsInt,
    Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageStatus } from './support.entity';

// 1. 提交联系留言 DTO
export class CreateMessageDto {
    @IsString()
    @IsNotEmpty({ message: '姓名不能为空' })
    @MaxLength(50, { message: '姓名不能超过50个字符' })
    name: string;

    @IsEmail({}, { message: '请输入合法的邮箱地址' })
    @IsNotEmpty({ message: '邮箱不能为空' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: '留言内容不能为空' })
    @MaxLength(1000, { message: '留言内容不能超过1000个字符' })
    content: string;
}

// 2. 更新留言状态 DTO
export class UpdateMessageStatusDto {
    @IsEnum(MessageStatus, { message: '无效的状态值' })
    @IsNotEmpty()
    status: MessageStatus;
}

// 3. 创建 FAQ DTO
export class CreateFaqDto {
    @IsString()
    @IsNotEmpty({ message: '问题不能为空' })
    @MaxLength(200, { message: '问题不能超过200个字符' })
    question: string;

    @IsString()
    @IsNotEmpty({ message: '回答不能为空' })
    answer: string;

    @IsString()
    @IsNotEmpty({ message: '分类不能为空' })
    @MaxLength(50, { message: '分类名称不能超过50个字符' })
    category: string;
}

// 4. 更新 FAQ DTO
export class UpdateFaqDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    question?: string;

    @IsOptional()
    @IsString()
    answer?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    category?: string;
}

// 5. 留言查询参数 DTO
export class QueryMessageDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize?: number = 10;

    @IsOptional()
    @IsEnum(MessageStatus)
    status?: MessageStatus;
}

// 6. FAQ 查询参数 DTO
export class QueryFaqDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    keyword?: string;
}
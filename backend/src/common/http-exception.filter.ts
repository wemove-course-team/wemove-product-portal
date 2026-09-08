import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { Request, Response } from 'express'

/** HTTP 状态码对应的业务错误码。 */
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'VALIDATION_400',
  401: 'AUTH_401',
  403: 'FORBIDDEN_403',
  404: 'NOT_FOUND_404',
  409: 'CONFLICT_409'
}

interface ErrorBody {
  code: string
  message: string
  errors?: { field: string; message: string }[]
  requestId: string | null
}

/** 将异常转换为统一错误响应。 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const req = ctx.getRequest<Request & { requestId?: string }>()
    const res = ctx.getResponse<Response>()

    // 未处理异常写入日志，便于定位服务器错误。
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `unhandled exception on ${req.method} ${req.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception)
      )
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let body: ErrorBody = {
      code: 'SERVER_500',
      message: '服务暂时不可用，请稍后再试',
      requestId: req.requestId ?? null
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const response = exception.getResponse()
      const payload =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>)

      body = {
        code:
          (payload.code as string) ||
          STATUS_CODE_MAP[status] ||
          (status >= 500 ? 'SERVER_500' : 'VALIDATION_400'),
        message: (payload.message as string) || exception.message || '请求失败',
        requestId: req.requestId ?? null
      }

      const errors = payload.errors as ErrorBody['errors'] | undefined
      if (Array.isArray(errors) && errors.length > 0) {
        body.errors = errors
      }
    }

    res.status(status).json(body)
  }
}

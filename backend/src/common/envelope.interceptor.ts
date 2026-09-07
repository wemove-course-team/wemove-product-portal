import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/** 将成功响应包装为统一格式。 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const req = http.getRequest<Request & { requestId?: string }>()

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'ok',
        data: data ?? null,
        requestId: req.requestId ?? null
      }))
    )
  }
}

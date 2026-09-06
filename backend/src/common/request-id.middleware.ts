import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 * 请求追踪（#85 契约 v1）：每个请求分配 requestId，写入响应头 X-Request-Id，
 * 并挂到 req.requestId 供统一信封 / 错误体透出。
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id']
    const requestId =
      (typeof incoming === 'string' && incoming.length > 0 ? incoming : `req_${uuidv4()}`)
    ;(req as Request & { requestId: string }).requestId = requestId
    res.setHeader('X-Request-Id', requestId)
    next()
  }
}

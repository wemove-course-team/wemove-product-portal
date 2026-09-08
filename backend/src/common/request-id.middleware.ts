import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/** 为请求生成追踪 ID，并写入响应头和请求对象。 */
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

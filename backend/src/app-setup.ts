import { BadRequestException, ValidationPipe } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import type { NextFunction, Request, Response } from 'express'
import { RequestIdMiddleware } from './common/request-id.middleware'
import { EnvelopeInterceptor } from './common/envelope.interceptor'
import { HttpExceptionFilter } from './common/http-exception.filter'
import { CsrfGuard } from './common/csrf.guard'

/**
 * 应用装配（main 与 e2e 共用）：HTTP 服务无论以何种方式启动，行为必须一致。
 *
 * - 端口 3001（决策 D1：vite dev(3000) proxy /api → 3001，生产 nginx 同源转发，不开 CORS）
 * - 全局前缀 /api/v1，统一信封/错误体（决策 D2/D3），CSRF 双提交（决策 D4）
 * - 校验管道：whitelist 剔除未声明字段，错误按契约 errors:[{field, message}] 输出
 */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api/v1')
  app.use(cookieParser())
  const requestIdMiddleware = new RequestIdMiddleware()
  app.use((req: Request, res: Response, next: NextFunction) => requestIdMiddleware.use(req, res, next))
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        const detail = errors.map((err) => ({
          field: err.property,
          message: Object.values(err.constraints ?? {})[0] ?? '字段校验失败'
        }))
        return new BadRequestException({
          code: 'VALIDATION_400',
          message: '请检查输入内容',
          errors: detail
        })
      }
    })
  )
  app.useGlobalGuards(app.get(CsrfGuard))
  app.useGlobalInterceptors(new EnvelopeInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
}

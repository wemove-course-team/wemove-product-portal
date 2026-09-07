import 'reflect-metadata'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { RequestIdMiddleware } from './common/request-id.middleware'
import { EnvelopeInterceptor } from './common/envelope.interceptor'
import { HttpExceptionFilter } from './common/http-exception.filter'
import { CsrfGuard } from './common/csrf.guard'
import cookieParser from 'cookie-parser'
import type { NextFunction, Request, Response } from 'express'

/** 创建应用并注册全局校验、CSRF、响应和异常处理。 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

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

  const port = Number(process.env.PORT || 3001)
  await app.listen(port)
  console.log(`[wemove-backend] listening on http://localhost:${port}/api/v1`)
}

bootstrap()

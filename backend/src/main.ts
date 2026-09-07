import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureApp } from './app-setup'

/** 生产入口：装配细节见 app-setup.ts（与 e2e 测试共用，保证行为一致） */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  configureApp(app)

  const port = Number(process.env.PORT || 3001)
  await app.listen(port)
  console.log(`[wemove-backend] listening on http://localhost:${port}/api/v1`)
}

bootstrap()

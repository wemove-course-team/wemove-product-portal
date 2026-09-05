import { Controller, Get } from '@nestjs/common'
import { ok } from './common/api-envelope'

@Controller('health')
export class HealthController {
  @Get()
  check() { return ok({ status: 'ok' }) }
}

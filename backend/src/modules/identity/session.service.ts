import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { User } from './user.entity'

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, User>()
  create(user: User) { const token = randomBytes(32).toString('hex'); this.sessions.set(token, user); return token }
  get(token?: string) { return token ? this.sessions.get(token) : undefined }
  remove(token?: string) { if (token) this.sessions.delete(token) }
  refreshUser(userId: number, changes: Partial<User>) {
    for (const user of this.sessions.values()) {
      if (Number(user.id) === Number(userId)) Object.assign(user, changes)
    }
  }
}

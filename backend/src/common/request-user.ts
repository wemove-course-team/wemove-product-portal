/** 会话守卫解析出的用户摘要。 */
export interface RequestUser {
  id: string
  username: string
  email: string
  role: 'GUEST' | 'USER' | 'DEALER' | 'ADMIN'
  companyId: string | null
}

declare module 'express' {
  interface Request {
    user?: RequestUser
    requestId?: string
  }
}

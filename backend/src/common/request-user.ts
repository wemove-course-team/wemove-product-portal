/** 会话用户摘要（由 SessionGuard 从会话解析并挂到 req.user） */
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

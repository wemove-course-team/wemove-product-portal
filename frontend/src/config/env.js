/**
 * 全局运行配置（唯一读取 import.meta.env 的入口）
 *
 * VITE_API_MODE：
 * - real（默认）：所有请求走真实后端 /api/v1；任何失败都作为错误状态呈现，
 *   绝不回退到 localStorage 假数据。课程验收使用该模式。
 * - mock：显式开发/演示开关，界面会显示“Mock 演示模式”标识（见 ModeIndicator）。
 *   仅用于后端未就绪时的界面演示，不代表已实现的功能。
 */
export const API_MODE = import.meta.env.VITE_API_MODE === 'mock' ? 'mock' : 'real'

/** API 前缀（#85 契约 v1） */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** 单请求超时（毫秒） */
export const HTTP_TIMEOUT_MS = Number(import.meta.env.VITE_HTTP_TIMEOUT_MS || 15000)

/** 会话预检（GET /auth/me）专用超时（毫秒）：路由守卫等待期间不能让用户干等太久 */
export const SESSION_TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS || 6000)

/** 是否为开发构建（Vite 注入，生产构建恒为 false） */
export const IS_DEV = import.meta.env.DEV

# WEMOVE 后端镜像（多阶段：构建 → 精简运行时）
# 构建：docker build -t ghcr.io/wemove-course-team/wemove-backend:latest ./backend
# 基于 Debian slim：sqlite3 有 glibc 预编译二进制，免去 musl 下的本地编译
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# 非 root 运行
RUN groupadd --system wemove && useradd --system --gid wemove wemove
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
USER wemove
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/v1/categories').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" || exit 1
CMD ["node", "dist/main.js"]

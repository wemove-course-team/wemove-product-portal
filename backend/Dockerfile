# WEMOVE 后端镜像（多阶段：构建 → 精简运行时）
# 构建：docker build -t ghcr.io/wemove-course-team/wemove-backend:latest ./backend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# 非 root 运行
RUN addgroup -S wemove && adduser -S wemove -G wemove
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
USER wemove
EXPOSE 3001
CMD ["node", "dist/main.js"]

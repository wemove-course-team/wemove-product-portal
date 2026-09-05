# ADR 0002 使用Docker Compose部署到Linux

状态：用户已明确部署方式；具体容器配置待实现。日期：2026-09-05。

## 决策

课程采用单机Linux服务器和Docker Compose，运行Nginx/Vue、NestJS、MySQL三个常驻容器，数据库增量迁移使用同版本后端镜像的一次性任务。数据与上传文件保存到持久卷，只将Web入口对外映射。

本地npm运行保留为开发便利，最终验收必须通过Linux镜像构建、Compose启动、服务健康和数据恢复。Node、Nginx、MySQL由镜像提供，服务器不单独部署应用运行时。

## 影响

chenyi-c负责部署整合，Q04估算由2小时改为4小时；cy0207kaw负责后端镜像、健康检查及迁移入口，Snowed-night负责数据卷与恢复。lizhikeer保留前端基础和最终UI主责。

沿用原31个Issue，修改已有任务的交付路径和验收，不新增框架、微服务或Kubernetes。完整约定见 [部署基线](../planning/deployment.md)。

## 待实施条件

服务器地址、发行版/架构、SSH访问方式、端口和域名由B00登记。没有后端应用及服务器连接证据前，不声称已经部署。GitHub当前账号403阻碍远程同步，先保留本地基线和待同步清单。

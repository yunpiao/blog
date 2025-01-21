---
title: 经验-docker 相关使用实践
tags:
  - 编程经验
  - 后端
  - docker
date: 2025-01-06T14:25:44+08:00
draft: false
toc: true
slug: 20250106142544
categories:
---

#### 一、Harbor 仓库 SSL 证书问题解决(依赖加证书文件实在解决不了的情况下)
```bash
# 添加自签名证书到系统信任链
echo "-----BEGIN CERTIFICATE-----
MIID... (证书内容) ...
-----END CERTIFICATE-----" | sudo tee -a /etc/ssl/certs/harbor.crt > /dev/null

# CentOS/RHEL 更新证书信任库
sudo update-ca-trust force-enable
sudo update-ca-trust extract

# Ubuntu/Debian 更新证书
sudo update-ca-certificates
```

**验证方法**：
```bash
curl -v https://your-harbor-domain
```

#### 二、镜像优化分析工具
使用 Dive 进行镜像层分析：
```bash
# 安装 Dive
wget https://github.com/wagoodman/dive/releases/download/v0.11.0/dive_0.11.0_linux_amd64.deb
sudo dpkg -i dive*.deb

# 分析镜像
dive your-image:tag
```

**关键功能**：
- 可视化每层文件变化
- 计算浪费的空间（重复/删除的文件）

#### 三、Dockerfile 最佳实践

1. **基础规范**
   ```dockerfile
   FROM bitnami/python:3.7.17-debian-11-r0 AS builder
   WORKDIR /app
   COPY . .
   ```

2. **健康检查配置**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
     CMD curl -f http://localhost:8080/health || exit 1
   ```

3. **安全增强**
   ```dockerfile
   RUN groupadd -r appuser && useradd -r -g appuser appuser
   USER appuser
   ```

4. **构建优化**
   ```dockerfile
   # 使用 BuildKit 缓存加速
   RUN --mount=type=cache,target=/go/pkg/mod \
       go mod download
   ```
5. 编写 .dockerignore 文件, 将不相关的文件忽略, 不发送到 docker 环境
6. 一个容器运行一个应用
7. 镜像不要在生产环境中不要使用  latest 标签
8. 优先使用 copy 而不是 add
9. 设置默认的环境变量
10. 使用 label 设置镜像元数据
#### 四、多架构镜像构建
```bash
# 创建构建器实例
docker buildx create --use --name multiarch-builder

# 构建并推送多平台镜像
docker buildx build --platform linux/arm64,linux/amd64 \
  -t your-registry/image:tag --push .

# 创建统一 manifest
docker manifest create your-registry/image:tag \
  your-registry/image:tag-arm64 \
  your-registry/image:tag-amd64
```

#### 五、网络与安全管控

1. **动态防火墙管理**
   ```bash
   # 监控 Docker 端口并更新 iptables 规则
   */5 * * * * root /path/to/monitor_docker_ports.sh(一个检查 docker 开发了哪些端口的工具)
   ```

2. **安全端口暴露策略**
   ```bash
   # 仅允许指定 IP 段访问
   iptables -A DOCKER-USER -p tcp --dport 8080 \
     -s 10.0.0.0/8 -j ACCEPT
   iptables -A DOCKER-USER -p tcp --dport 8080 -j DROP
   ```

#### 六、CI/CD 集成

1. **GitLab Runner 配置**
   ```bash
   gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
   gitlab-runner register --url https://gitlab.com --registration-token $REG_TOKEN
   ```

2. **高效缓存配置**
   ```yaml
   variables:
     DOCKER_BUILDKIT: 1
   build:
     script:
       - docker build --cache-from=your-image:cache --tag=your-image:latest .
       - docker push your-image:latest
   ```

#### 七、**高级技巧**

1. **Root 权限进入容器**
   ```bash
   docker exec -it --user root <container> /bin/bash
   ```

2. **代理网络配置
   ```bash
   # 创建代理配置文件
   cat <<EOF | sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf
   [Service]
   Environment="HTTP_PROXY=http://proxy.example.com:8080"
   Environment="NO_PROXY=localhost,.internal"
   EOF

   systemctl daemon-reload
   systemctl restart docker
```

3. **镜像压缩优化**
   ```bash
   # 多线程压缩加速
   docker save your-image | pigz -9 > image.tar.gz
   ```

4. **多阶段构建**
   ```dockerfile
   FROM golang:1.19 AS build
   COPY . .
   RUN go build -o /app

   FROM alpine:3.15
   COPY --from=build /app /app
   CMD ["/app"]
   ```

5. **标签管理策略**
   - 使用语义化版本标签（v1.2.3）
   - 为最新稳定版本维护 latest 标签
   - 包含构建元数据（commit hash + 日期）

6. **日志管理, 防止磁盘撑爆**
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

7. **资源限制**
   ```bash
   docker run -it --cpus=2 --memory=512m --blkio-weight=500 your-image
   ```


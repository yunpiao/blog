---
title: 杂-为 cloudflared 增加中间代理, 优化透传服务
tags: []
date: 2025-10-27T18:37:10+08:00
draft: false
toc: true
slug: 20251027183710
categories:
---
## 1. 背景

作为一个需要频繁使用内网穿透服务的开发者，我一直在使用 Cloudflare Tunnel (cloudflared) 来暴露本地服务到公网。这个工具本身非常优秀，但在国内使用时有一个让人抓狂的痛点：

**经常断联，连接不稳定，严重影响使用体验。**

具体表现：
- 🔴 隧道连接时断时续，频繁掉线
- 🔴 重连速度慢，影响服务可用性  
- 🔴 某些地区或网络环境下根本无法建立连接
- 🔴 没有任何办法绕过网络限制

这种情况下，即使服务本身完全正常，用户体验也会非常糟糕。作为一个有洁癖的程序员，这种"时好时坏"的状态是绝对无法接受的。

## 2. 问题分析

### 为什么会断联？

Cloudflared 直连 Cloudflare 边缘节点的时候，流量路径大致是：

```
本地 cloudflared → 国内运营商网络 → 国际出口 → Cloudflare Edge
```

问题出在中间环节：
1. **国际出口不稳定** - 众所周知的原因
2. **UDP 流量容易被限制** - QUIC 协议使用 UDP，某些网络会限制或丢弃 UDP 包
3. **连接被主动断开** - 某些情况下长连接会被中断
4. **DNS 污染** - 边缘节点地址解析可能出问题

### 理想的解决方案

如果能让 cloudflared 通过一个**稳定的代理服务器**出去，问题就迎刃而解了：
```
本地 cloudflared → SOCKS5 代理 → 稳定线路 → Cloudflare Edge
```

优势：
- ✅ 使用优质线路，连接稳定
- ✅ 可以绕过网络限制
- ✅ 代理失败时自动降级，不影响可用性
- ✅ 灵活配置，按需使用

**但问题是：原版 cloudflared 不支持代理！**

## 3. 解决方案：为 Cloudflared 添加 SOCKS5 代理支持

既然官方不支持，那就自己动手，丰衣足食。我 fork 了 cloudflared 项目，添加了完整的 SOCKS5 代理支持。

### 核心功能

#### 3.1 标准 SOCKS5 协议支持

```bash
# 基础用法 - 通过本地代理
cloudflared tunnel run --edge-proxy-url socks5://127.0.0.1:1080 mytunnel

# 带认证的代理
cloudflared tunnel run --edge-proxy-url socks5://user:pass@proxy.example.com:1080 mytunnel

# 使用配置文件
cat > config.yml <<EOF
tunnel: mytunnel
credentials-file: /path/to/credentials.json
edge-proxy-url: socks5://127.0.0.1:1080

ingress:
  - hostname: example.com
    service: http://localhost:8080
  - service: http_status:404
EOF

cloudflared tunnel run mytunnel
```

#### 3.2 智能降级机制
```
尝试代理连接
    ├─ 成功 → 使用代理连接（稳定线路）✅
    └─ 失败 → 自动降级到直连 ✅
```

这意味着：
- 代理可用时，走稳定线路
- 代理挂了，自动切换直连，服务不中断
- 完全不用担心代理故障

#### 3.3 灵活的配置方式

支持三种配置方式，随你喜欢：

**方式 1: 命令行参数**
```bash
cloudflared tunnel run --edge-proxy-url socks5://proxy:1080 mytunnel
```

**方式 2: 环境变量**
```bash
export TUNNEL_EDGE_PROXY_URL="socks5://proxy:1080"
cloudflared tunnel run mytunnel
```

**方式 3: 配置文件**
```yaml
edge-proxy-url: socks5://proxy:1080
```

### 坑 1: QUIC 协议问题

QUIC 使用 UDP，标准 SOCKS5 主要是为 TCP 设计的。

**解决：** 
- 可以强制使用 HTTP/2: `--protocol http2`
- 或者等待后续支持 UDP 转发的代理协议

### 坑 2: 代理认证信息安全

命令行中的密码会出现在进程列表中：

```bash
# ❌ 不安全
cloudflared tunnel run --edge-proxy-url socks5://user:password@proxy:1080 mytunnel
```

**解决：** 使用配置文件并设置权限：

```bash
cat > config.yml <<EOF
edge-proxy-url: socks5://user:password@proxy:1080
EOF

chmod 600 config.yml
cloudflared tunnel run mytunnel
```

**完整文档：**
- [SOCKS5_PROXY_GUIDE.md](https://github.com/yunpiao/cloudflared/blob/master/SOCKS5_PROXY_GUIDE.md) - 完整使用指南
- [TEST_PROXY.md](https://github.com/yunpiao/cloudflared/blob/master/TEST_PROXY.md) - 功能测试报告

## 4. 编译安装

### 从源码编译

```bash
# 克隆仓库
git clone https://github.com/yunpiao/cloudflared.git
cd cloudflared

# 编译（需要 go >= 1.24）
make cloudflared

# 编译结果
./cloudflared --version
```

## 5. 未来计划

这只是第一个版本，后续可能会继续优化：

- [ ] 支持更多代理协议（HTTP CONNECT、Shadowsocks 等）
- [ ] 支持 QUIC over SOCKS5 UDP 转发
- [ ] 添加代理健康检查和自动切换
- [ ] 代理连接的详细指标和监控
- [ ] 支持代理链（多级代理）

## 6. 总结


**关键要点：**
1. ✅ 通过代理使用稳定线路，连接不再断联
2. ✅ 智能降级机制，代理故障不影响服务
3. ✅ 配置灵活，支持命令行、环境变量、配置文件
4. ✅ 完全向后兼容，不影响原有功能
5. ✅ 代码简洁，详细的中文注释

如果你也遇到了类似的问题，欢迎试用这个增强版本。代码已开源，欢迎 Star 和贡献！

## 参考链接

- 项目仓库：https://github.com/yunpiao/cloudflared
- 上游项目：https://github.com/cloudflare/cloudflared
- Cloudflare Tunnel 文档：https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- SOCKS5 协议规范 (RFC 1928)：https://www.rfc-editor.org/rfc/rfc1928
- SOCKS5 认证 (RFC 1929)：https://www.rfc-editor.org/rfc/rfc1929


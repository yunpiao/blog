---
title: 网络知识-macOS 网络：当代理应用 Loon 遇上虚拟内网 Tailscale
tags:
  - 网络
  - 运维经验
date: 2025-10-22T11:08:29+08:00
draft: false
toc: true
slug: 20251022110829
categories:
---

> 折腾了好久，终于搞定了 Loon 和 Tailscale 在 macOS 上的共存问题。怎么网络工具之间的冲突也这么复杂！😧

### 一、现象：诡异的网络不通

为了同时使用 Loon 强大的网络调试、代理能力和 Tailscale 便捷的虚拟内网功能，我尝试在我的 Mac 上同时运行它们。很快，一个诡异的现象出现了：

1.  **底层网络是通的**：我可以 `ping` 通 Tailscale 网络中的任何一台设备，例如 `ping 100.64.0.1`，延迟极低，一切正常。
2.  **应用层访问失败**：但任何基于 TCP 的应用层访问都宣告失败。例如，使用 `curl` 访问内网服务 `curl https://100.64.0.1:20443`，命令会一直卡住，没有任何响应，最终超时。

`ping` 通 `curl` 不通，这通常意味着问题出在代理、防火墙或者路由上。一场漫长的排查就此开始。

### 二、排查

#### 第一阶段：怀疑代理规则

我的第一反应是 Loon 的分流规则出了问题。Loon 作为系统代理，很可能错误地将发往 `100.64.0.1` 这个内网地址的请求，发送到了公网的代理服务器上。代理服务器不认识这个地址，自然无法连接。

**验证**：
我查看了 Loon 的请求日志，发现 `curl` 请求确实被 Loon 捕获了。于是，我在 Loon 中添加了一条**本地规则**，强制所有发往 Tailscale 网段 `100.64.0.0/10` 的流量都执行 `DIRECT`（直连）策略。

![image.png](https://img.yunpiao.site/2025/10/55ac1814d8b370b24fc5d4c6faf4a361.png)

然而，添加规则后，问题依旧。`curl` 请求虽然在日志中显示为 `DIRECT`，但依然是卡死超时。这说明，问题比想象中更深层。

#### 第二阶段：怀疑服务器与 SNI

既然代理规则没问题，那会不会是服务器端的问题？`curl` 卡在 TLS 握手阶段，有时与 SNI（服务器名称指示）有关。即服务器要求客户端在握手时提供域名，而我用的是 IP 访问。

**验证**：
我使用了 `curl` 的 `--resolve` 参数，模拟了基于域名的访问：

```bash
curl -kvv --resolve v.yunpiao.site:20443:100.64.0.1 https://v.yunpiao.site:20443
```

结果，依然是石沉大海，卡死。这基本排除了 SNI 的问题，证明问题根源就在我这台 Mac 的网络层。

#### 第三阶段：回归本源，定位路由冲突 💡

此时，我回到了最基础的网络问题上：**路由**。数据包到底是从哪个网卡发出去的？

我使用 `netstat -nr` 查看系统路由表，真相瞬间大白：

```bash
➜  ~ netstat -nr | grep "^100"
100.64/10          192.168.10.1       UGSc                  en0
100.64.0.149       100.64.0.149       UH                  utun8
```

**这就是问题的根源！**

*   第一条路由（`100.64/10 ... en0`）的优先级更高，它错误地告诉系统：“所有发往 Tailscale 网络（`100.64/10`）的数据包，都应该从 `en0` 网卡（我的 Wi-Fi）发给 `192.168.10.1`（我的家用路由器）”。数据包就这样被发向了茫茫公网，自然有去无回。
*   而正确的路由，本应是让这些数据包都通过 Tailscale 的虚拟网卡 `utun8` 发出去。

### 三、原因：致命的路由抢占

根本原因在于 **Loon 和 `tailscaled` 之间的路由控制权抢占**。

`tailscaled`（Tailscale 的命令行守护进程）在启动时，会向系统路由表里添加一条规则，将 `100.64.0.0/10` 的流量指向它创建的 `utun` 虚拟网卡。

然而，Loon 为了实现全局代理，特别是其“TUN 模式”，也会强势接管系统的路由表，添加自己的规则。不幸的是，Loon 添加的全局规则覆盖了 Tailscale 的特定规则，导致了这场冲突。

### 四、解决办法

#### 临时解决：手动修正路由

最直接的方法就是通过命令行，手动删除错误路由，并添加正确路由。

1.  **删除错误路由**
    ```bash
    sudo route delete -net 100.64.0.0/10 192.168.10.1
    ```
2.  **添加正确路由**
    ```bash
    # 注意: utun8 需要根据你的实际情况确定
    sudo route add -net 100.64.0.0/10 -interface utun8
    ```
执行后，`curl` 立刻恢复正常。但这只是临时的，一旦网络环境变化或应用重启，路由可能再次被污染。

#### 最终解决：自动化修复脚本 ✅

为了实现一劳永逸，我编写了一个 Shell 脚本，可以随时执行来检测并修复路由问题。记得配置到 cron 里面

```bash
#!/bin/bash

# 定义命令的绝对路径，防止 command not found
NETSTAT_CMD="/usr/sbin/netstat"
ROUTE_CMD="/sbin/route"
TAILSCALE_CMD="/usr/local/bin/tailscale"
IFCONFIG_CMD="/sbin/ifconfig"

# 错误网关和目标网络
BAD_GATEWAY="192.168.10.1"
TARGET_NET_FULL="100.64.0.0/10" # 如果你要用我的脚本, 你要修改成自己的内网
TARGET_SUBNET_GREP="^100\.64/10"

echo "Starting Tailscale route fix script..."

# 1. 检查 tailscaled 是否在运行
if ! pgrep -q tailscaled; then
    echo "Error: tailscaled is not running. Please start Tailscale first."
    exit 1
fi

# 2. 动态获取 Tailscale 的 IP 和 utun 接口
MY_TAILSCALE_IP=$($TAILSCALE_CMD ip -4)
if [ -z "$MY_TAILSCALE_IP" ]; then
    echo "Error: Could not get Tailscale IP address."
    exit 1
fi
echo "Found my Tailscale IP: $MY_TAILSCALE_IP"

GOOD_INTERFACE=$($IFCONFIG_CMD | grep -B1 "$MY_TAILSCALE_IP" | grep -o 'utun[0-9]*')
if [ -z "$GOOD_INTERFACE" ]; then
    echo "Error: Could not find a utun interface for IP $MY_TAILSCALE_IP."
    exit 1
fi
echo "Found correct Tailscale interface: $GOOD_INTERFACE"

# 3. 检查并删除错误路由
if $NETSTAT_CMD -nr | grep -q "${TARGET_SUBNET_GREP}.*${BAD_GATEWAY}"; then
    echo "Found and deleting incorrect route via $BAD_GATEWAY..."
    sudo $ROUTE_CMD delete -net $TARGET_NET_FULL $BAD_GATEWAY
fi

# 4. 检查并添加正确路由
if ! $NETSTAT_CMD -nr | grep -q "${TARGET_SUBNET_GREP}.*${GOOD_INTERFACE}"; then
    echo "Correct route is missing. Adding it now via $GOOD_INTERFACE..."
    sudo $ROUTE_CMD add -net $TARGET_NET_FULL -interface $GOOD_INTERFACE
else
    echo "Correct route already exists."
fi

echo "Route fix script finished."
```
这个脚本实现了自动化检测和修复，它会自动找到正确的 `utun` 接口，并确保路由指向它。现在，每当网络出问题时，只需运行一下这个脚本，一切就都恢复了。

### 五、总结

1.  **`netstat -nr` 是网络排查的神器**：当遇到底层通（`ping`）而上层不通（`curl`）的问题时，第一时间检查路由表，往往能发现线索。
2.  **警惕网络工具的路由控制权**：多个 VPN 或代理类应用共存时，极易发生路由冲突。理解它们的工作模式（系统代理 vs TUN/虚拟网卡）至关重要。
3.  **将解决方案脚本化**：对于需要重复操作的修复步骤，编写一个脚本可以极大地提高效率和准确性，是每个工程师都应具备的好习惯。


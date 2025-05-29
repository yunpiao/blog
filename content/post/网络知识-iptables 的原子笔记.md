---
title: 网络知识-iptables 的原子笔记
tags: []
date: 2025-05-29T11:51:59+08:00
draft: false
toc: true
slug: 20250529115159
categories:
---
## **Netfilter 与 iptables：

- **Netfilter**：Linux 内核中的包过滤框架，提供 5 个关键的“**hook 点**”（流量检查点），允许在数据包传输路径中进行干预。
    - `NF_IP_PRE_ROUTING`：数据包刚进入系统，路由前。
    - `NF_IP_LOCAL_IN`：数据包目的地是本机。
    - `NF_IP_FORWARD`：数据包需要转发。
    - `NF_IP_LOCAL_OUT`：本机生成的数据包。
    - `NF_IP_POST_ROUTING`：数据包离开系统前。
- **iptables**：用户空间的工具，用于配置 Netfilter 规则。它将规则组织成**表 (tables)** 和**链 (chains)**。

---

## **iptables 的五大（Tables）**

iptables 将规则按功能分类到不同的“表”中：

- **`filter` 表**：最常用，用于**过滤**（ACCEPT/DROP）数据包，实现防火墙功能。
- **`nat` 表**：用于**网络地址转换 (NAT)**，如修改源/目的 IP/端口。
- **`mangle` 表**：用于**修改 IP 头**，如 TTL 值，或给数据包打**内部标记 (mark)**。
- **`raw` 表**：用于**绕过连接跟踪 (conntrack)**，通常在数据包进入连接跟踪系统前处理。
- **`security` 表**：用于集成 **SELinux** 安全策略，给数据包打 SELinux 标记。

---

## **链 (Chains)：数据包的“流水线”**

每个表内部包含一个或多个“链”，这些链与 Netfilter 的 Hook 点对应。数据包流经不同的链，规则按序匹配：

- `PREROUTING`：对应 `NF_IP_PRE_ROUTING`。
- `INPUT`：对应 `NF_IP_LOCAL_IN`。
- `FORWARD`：对应 `NF_IP_FORWARD`。
- `OUTPUT`：对应 `NF_IP_LOCAL_OUT`。
- `POSTROUTING`：对应 `NF_IP_POST_ROUTING`。

**不同表在同一 Hook 点的优先级：** 数据包触发某个 Hook 点时，多个表的链可能会被调用。调用顺序遵循特定优先级（例如，`raw` > `mangle` > `nat` > `filter` > `security`）。

---

## **iptables 规则：匹配与动作**

每条规则由两部分组成：

- **匹配 (Matching)**：定义数据包必须满足的条件（如协议、IP/端口、接口、连接状态等）。
- **目标 (Target)**：数据包匹配成功后执行的动作。
    - **终止目标**：执行后停止当前链的匹配（如 `ACCEPT`, `DROP`, `DNAT`, `REDIRECT`）。
    - **非终止目标**：执行后继续当前链的匹配（如 `LOG`）。
    - **跳转目标 (Jump Target)**：一种特殊的非终止目标，可跳转到**用户自定义链**，实现规则的模块化管理。

---

## **连接跟踪 (Conntrack)：有状态的防火墙**

- **功能**：Netfilter 上的一个子系统，使得 iptables 能将数据包视为**连接或会话的一部分**，而非独立个体。
- **连接状态**：
    - `NEW`：新连接的第一个合法包。
    - `ESTABLISHED`：已建立的连接。
    - `RELATED`：与已有连接相关的包（如 FTP 数据连接）。
    - `INVALID`：非法或无法识别的包。
    - `UNTRACKED`：被 `raw` 表标记为不跟踪的包。
    - `SNAT`/`DNAT`：NAT 转换后的虚拟状态。

---

## **透明代理：客户端无感知的流量重定向**

透明代理的核心在于在**客户端无需配置**的情况下，将流量重定向到代理服务器。

### **1. 基于 DNAT 的透明代理**

- **原理**：利用 `nat` 表的 `PREROUTING` 链，将数据包的**目的 IP 和端口**修改为代理服务器的本地 IP 和端口。
- **客户端感知**：无感知。
- **代理服务器感知**：收到数据包的目的地是自身，需要通过 `SO_ORIGINAL_DST` 等方式获取原始目的地。
- **优点**：实现相对简单。
- **缺点**：修改了数据包目的地，代理程序需要额外处理。

### **2. 基于 TPROXY 的透明代理**

- **原理**：利用 `mangle` 表的 `PREROUTING` 链给数据包打上**标记 (mark)**，并结合 **策略路由 (Policy Routing)** 将数据包重路由到本地代理程序，**不修改数据包的原始目的 IP 和端口**。
    - **iptables TPROXY 目标**：在 `mangle` 表中将符合条件的数据包打上 `fwmark` 标记，并指定 `on-port` (代理监听端口)。
    - **策略路由**：
        - `ip rule add fwmark <mark_value> lookup <table_id>`：告诉内核，带有指定 `fwmark` 的数据包应查询特定的路由表。
        - `ip route add local 0.0.0.0/0 dev lo table <table_id>`：在指定路由表中，将所有流量路由到本地回环接口 (`lo`)，从而被本地代理程序捕获。
- **客户端感知**：无感知。
- **代理服务器感知**：收到数据包的目的 IP 和端口就是客户端最初想要访问的真实 IP 和端口，简化代理逻辑。
- **优点**：保留原始目的地址，对代理程序更透明，支持 TCP 和 UDP 等多种协议。
- **缺点**：配置相对复杂，需要内核支持 TPROXY 功能，代理程序也需支持 TPROXY 模式。

---

### **透明代理的共性要求**

- **IP 转发**：`net.ipv4.ip_forward` 必须开启。
- **代理程序支持**：代理程序需要支持透明代理模式，并能正确处理重定向的流量。
- **安全性**：作为流量枢纽，需确保代理服务器自身的安全。
- **HTTPS 流量**：对于 HTTPS，透明代理通常涉及 SSL/TLS 解密（MITM），需额外配置证书。
<!--more-->
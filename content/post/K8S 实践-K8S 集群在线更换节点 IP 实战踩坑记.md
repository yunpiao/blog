---
title: K8S 实践-K8S 集群在线更换节点 IP 实战踩坑记
tags: []
date: 2026-01-23T11:47:12+08:00
draft: false
toc: true
isTop: true
slug: 20260123114712
categories:
  - Kubernetes
---
> 😵 VM 迁移后改个 IP 而已，怎么就这么多坑呢

## 1. 背景

周三下午，运维甩过来一句话："客户那边做了下 VM 迁移，IP 段变了，K8S 集群起不来了，你看看？"

我心想，改个 IP 能有多难？不就是改改配置文件重启一下嘛。

然后我就开始了长达 30 分钟的踩坑之旅。

<!--more-->

**环境说明**

| 项目 | 值 |
|------|-----|
| K8S 部署工具 | kubeasz |
| 集群规模 | 1 master + 2 worker |
| 网络插件 | Flannel |
| 存储 | NFS |

**IP 变更映射**

| 节点 | 旧 IP | 新 IP |
|------|-------|-------|
| master-node | 192.168.100.112 | 192.168.100.115 |
| worker-node1 | 192.168.100.113 | 192.168.100.116 |
| worker-node2 | 192.168.100.114 | 192.168.100.117 |

## 2. 现象

SSH 到新 IP 后，发现 kubelet 起不来，apiserver 也连不上，etcd 更是一片红。

```
kubectl get nodes
The connection to the server 192.168.100.115:6443 was refused
```

好家伙，全挂了。

## 3. 逐步排查

### 第一反应：改配置文件

起初我想的很简单，K8S 的配置文件里肯定写死了旧 IP，改掉就行了。

于是开始了 sed 大法：

```bash
# kubeasz hosts 文件
sed -i 's/192.168.100.112/192.168.100.115/g' /etc/kubeasz/clusters/itdr/hosts

# etcd 配置
sed -i 's/192.168.100.112/192.168.100.115/g' /etc/etcd/etcd.conf

# apiserver 服务
sed -i 's/192.168.100.112/192.168.100.115/g' /etc/systemd/system/kube-apiserver.service

# kubeconfig 文件
sed -i 's/192.168.100.112/192.168.100.115/g' /etc/kubernetes/*.kubeconfig
```

改完重启，etcd 起来了，apiserver 也起来了。

```bash
kubectl get cs
# controller-manager   Healthy
# scheduler            Healthy
# etcd-0               Healthy
```

我心想，这不挺简单的嘛。

### 然后问题来了

kubelet 死活连不上 apiserver：

```
E0122 19:45:23.456789 kubelet.go:2183] "Failed to connect to apiserver" err="connection refused"
```

兄弟们，这就奇怪了。apiserver 明明在 6443 端口监听着，为啥 kubelet 连不上？

### 发现第一个隐藏 Boss：kube-lb


```bash
cat /etc/kubernetes/kubelet.kubeconfig | grep server
# server: https://127.0.0.1:6443
```

等等，127.0.0.1？这是什么操作？

翻了下 kubeasz 的文档，原来它用了一个叫 `kube-lb` 的本地负载均衡器（基于 nginx），kubelet 连接本地的 kube-lb，kube-lb 再转发到真正的 apiserver。

检查 kube-lb 配置：

```bash
cat /etc/kube-lb/conf/kube-lb.conf
# upstream kube_apiserver {
#     server 192.168.100.112:6443;  # 还是旧 IP！
# }
```

真见鬼了，这个配置文件藏得够深的，官方文档压根没提。

```bash
# 修改 kube-lb 配置
sed -i 's/192.168.100.112/192.168.100.115/g' /etc/kube-lb/conf/kube-lb.conf

# 重启 kube-lb
pkill -f kube-lb
nohup /etc/kube-lb/sbin/kube-lb -c /etc/kube-lb/conf/kube-lb.conf &
```

重启 kubelet，这次能连上 apiserver 了。

### 第二个坑：节点 IP 不更新

```bash
kubectl get nodes -o wide
# NAME           STATUS   INTERNAL-IP
# master-node    Ready    192.168.100.112  # 还是旧 IP？？
```

我人傻了，kubelet 都重启了，为啥节点 IP 还是旧的？

原来 K8S 的节点信息是存在 etcd 里的，IP 变了它不会自动更新。得手动删掉旧节点，让 kubelet 重新注册。

```bash
# 删除旧节点
kubectl delete node master-node

# 重启 kubelet
systemctl restart kubelet

# 重新打标签
kubectl label node master-node node-role.kubernetes.io/master=''
```

这下节点 IP 终于对了。

### 第三个坑：Pod 拉不到镜像

三个节点都 Ready 了，但是 Pod 起不来：

```
Failed to pull image "easzlab.io.local:5000/itdr/apisix:with-auth-r2":
dial tcp 192.168.100.112:5000: connect: no route to host
```

又是旧 IP！这次是镜像仓库的域名解析问题。

```bash
cat /etc/hosts | grep easzlab
# 192.168.100.112 easzlab.io.local  # 还是旧的
```

每个节点都要改：

```bash
sed -i 's/192.168.100.112.*easzlab/192.168.100.115 easzlab/g' /etc/hosts
```

### 第四个坑：kubectl logs 不能用

Pod 终于起来了，但是 `kubectl logs` 报错：

```
Error from server: Get "https://worker-node2:10250/containerLogs/...":
dial tcp 192.168.100.114:10250: connect: no route to host
```

注意看，它用的是 hostname `worker-node2`，但解析出来的 IP 是旧的 `192.168.100.114`。

又是 `/etc/hosts` 的锅，这次是节点 hostname 的映射：

```bash
cat /etc/hosts | grep worker
# 192.168.100.113    worker-node1
# 192.168.100.114    worker-node2
```

在 master 节点改掉：

```bash
sed -i 's/192.168.100.112.*master-node/192.168.100.115    master-node/g' /etc/hosts
sed -i 's/192.168.100.113.*worker-node1/192.168.100.116    worker-node1/g' /etc/hosts
sed -i 's/192.168.100.114.*worker-node2/192.168.100.117    worker-node2/g' /etc/hosts
```

### 第五个坑：NFS 挂载超时

有几个 Pod 卡在 ContainerCreating：

```
Warning  FailedMount  Unable to attach or mount volumes:
mount.nfs: Connection timed out
```

NFS 也有旧 IP，而且有两个地方：

**1. /etc/exports 客户端白名单**

```bash
cat /etc/exports
# /data/nfs 192.168.100.112/24(rw,sync,no_root_squash)
```

改掉并重新导出：

```bash
sed -i 's/192.168.100.112/192.168.100.115/g' /etc/exports
exportfs -ra
```

**2. PV 里的 NFS server 地址**

```bash
kubectl get pv -o yaml | grep server
# server: 192.168.100.112
```

PV 不能直接改，得删了重建：

```bash
kubectl get pv pv-nfs -o yaml > /tmp/nfs-pv.yaml
sed -i 's/server: 192.168.100.112/server: 192.168.100.115/g' /tmp/nfs-pv.yaml
kubectl delete pv pv-nfs --force --grace-period=0
kubectl apply -f /tmp/nfs-pv.yaml
```

### 第六个坑：PVC 变成 Lost 状态

PV 重建后，PVC 状态变成了 Lost，Pod 还是挂载不上。

```bash
kubectl get pvc -n itdr
# NAME      STATUS   VOLUME
# pvc-nfs   Lost     pv-nfs
```

PV 删了重建，原来的绑定关系就断了。得把 PVC 也删了重建：

```bash
# 强制删除
kubectl delete pvc -n itdr pvc-nfs --force --grace-period=0

# 如果卡住，清理 finalizers
kubectl patch pvc -n itdr pvc-nfs -p '{"metadata":{"finalizers":null}}'

# 重新创建
kubectl apply -f pvc.yaml
```

数据不会丢，因为 PV 是 Retain 策略。

## 4. 定位原因

回过头来看，K8S 集群改 IP 为什么这么麻烦？

**根本原因**：K8S 的 IP 地址被硬编码在太多地方了：

1. **TLS 证书的 SAN**：证书里写死了 IP，换了 IP 就 TLS 握手失败
2. **etcd 成员配置**：etcd 集群成员的 peer URL 写死了 IP
3. **各种 kubeconfig**：kubelet、kube-proxy、controller-manager 都有
4. **systemd 服务文件**：apiserver、etcd 的启动参数
5. **kube-lb 配置**：kubeasz 特有的本地负载均衡器
6. **/etc/hosts**：镜像仓库域名 + 节点 hostname 映射
7. **NFS 配置**：/etc/exports + PV 资源

这些配置分散在不同的地方，官方文档也没有完整列出来，只能一个一个踩坑。

## 5. 完整配置修改清单

踩完所有坑后，整理出来的完整清单：

| 配置文件                   | 路径                                           | 说明                  |
| ---------------------- | -------------------------------------------- | ------------------- |
| 网卡配置                   | `/etc/sysconfig/network-scripts/ifcfg-*`     | 节点自身 IP             |
| kubeasz hosts          | `/etc/kubeasz/clusters/<cluster>/hosts`      | 所有节点 IP             |
| etcd.conf              | `/etc/etcd/etcd.conf`                        | etcd 节点 IP          |
| etcd.service           | `/etc/systemd/system/etcd.service`           | etcd 服务配置           |
| kube-apiserver.service | `/etc/systemd/system/kube-apiserver.service` | master IP           |
| **kube-lb.conf**       | `/etc/kube-lb/conf/kube-lb.conf`             | **关键！**             |
| kubelet.kubeconfig     | `/etc/kubernetes/kubelet.kubeconfig`         | master IP           |
| kube-proxy.kubeconfig  | `/etc/kubernetes/kube-proxy.kubeconfig`      | master IP           |
| **/etc/hosts**         | `/etc/hosts`                                 | **镜像仓库 + hostname** |
| /etc/exports           | `/etc/exports`                               | NFS 客户端 IP          |
| NFS PV                 | `kubectl get pv`                             | NFS server 地址       |

## 6. 解决方法总结

最终的操作顺序：

1. **备份**：etcd 数据、证书、配置文件
2. **改网卡**：修改 ifcfg 文件，重启节点
3. **改 kubeasz hosts**：进 kubeasz 容器改
4. **改 etcd 配置**：etcd.conf + etcd.service
5. **改 kube-lb**：每个节点都要改（关键！）
6. **改 kubeconfig**：kubelet、kube-proxy 等
7. **重启服务**：先 etcd，再 apiserver，最后 kubelet
8. **删旧节点**：让 kubelet 重新注册
9. **改 /etc/hosts**：镜像仓库 + 节点 hostname
10. **改 NFS**：/etc/exports + PV + PVC

总耗时：约 30 分钟

## 7. 经验教训

1. **节点 IP 不会自动更新**，必须删旧节点让 kubelet 重新注册
2. **/etc/hosts 有两类映射**，镜像仓库域名和节点 hostname 都要改
3. **NFS 要改两个地方**，/etc/exports 和 PV 资源，PVC 可能变 Lost 要重建
4. **操作前一定要备份**，etcd 数据、证书、配置文件，万一搞砸了还能回滚

---

改个 IP 而已，踩了 6 个坑，我是不是 bug 体质啊 😅


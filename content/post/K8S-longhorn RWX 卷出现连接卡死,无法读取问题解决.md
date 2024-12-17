---
title: K8S-longhorn RWX 卷出现连接卡死,无法读取问题解决
tags:
  - k8s
  - longhorn
date: 2024-12-11T17:19:37+08:00
draft: false
toc: true
slug: 20241211171937
categories:
---
## 背景
公司产品私有化部署原本是用 nfs-provisioner  RWX 卷, 用于多个 pod 间的数据同步, 但是由于 `nfs` 也部署在产品内部, 还是有单点问题, 所以增加了使用 longhorn 作为分布式存储组件, 在兼容适配后, 在交付第一次给用户部署的时候, 遇到了一个奇怪的问题


## 现象
1. 刚安装完毕后数据, 系统一切正常, 后来过段时间发现当 ls 挂载的 RWX 卷的时候, 程序会卡死在这个 ls 命令下
2. share-manager-pvc pod 负载不断升高, 日志不断打印客户端建立 session 和 断开 session
3. ganesha.nfsd cpu 不断升高, 一直上升到 100%

![image.png](https://img.yunpiao.site/2024/12/23b722085cd31e1206866b3a233b56c3.png)




## 尝试解决

### 1. 定位是哪里出现了问题
```sh
[root@centos7-node-1 itdr-base]# kubectl get pod -n longhorn-system 
NAME                                                     READY   STATUS    RESTARTS       AGE
csi-attacher-6c46cf9fb4-2tnvn                            1/1     Running   0              5d5h
csi-attacher-6c46cf9fb4-7r4b5                            1/1     Running   0              5d3h
csi-attacher-6c46cf9fb4-pg92t                            1/1     Running   0              5d5h
csi-provisioner-569985c57c-295sc                         1/1     Running   1 (9h ago)     5d3h
csi-provisioner-569985c57c-m2rmq                         1/1     Running   1 (30h ago)    5d5h
csi-provisioner-569985c57c-w6srv                         1/1     Running   2 (11h ago)    5d5h
csi-resizer-7597448bf6-2gvqw                             1/1     Running   2 (5d3h ago)   5d5h
csi-resizer-7597448bf6-gj8pf                             1/1     Running   0              5d5h
csi-resizer-7597448bf6-kvl7z                             1/1     Running   2 (8h ago)     5d5h
csi-snapshotter-549bbf4ffb-b4pqv                         1/1     Running   1 (8h ago)     5d5h
csi-snapshotter-549bbf4ffb-drwfg                         1/1     Running   2 (5d3h ago)   5d5h
csi-snapshotter-549bbf4ffb-h2r45                         1/1     Running   0              5d5h
engine-image-ei-6c7d6635-cxpm9                           1/1     Running   0              5d5h
engine-image-ei-6c7d6635-hmv4s                           1/1     Running   0              5d5h
engine-image-ei-6c7d6635-n9sd7                           1/1     Running   0              5d5h
engine-image-ei-6c7d6635-r7t2w                           1/1     Running   1 (5d1h ago)   5d5h
engine-image-ei-6c7d6635-rd8s7                           1/1     Running   0              5d5h
engine-image-ei-6c7d6635-v7svn                           1/1     Running   0              5d5h
instance-manager-14bf79e1fe244326ec6b6f5072c3b245        1/1     Running   0              5d5h
instance-manager-394ba9e4c3dac77955f37f65a0782ac8        1/1     Running   0              5d5h
instance-manager-7b604f3d0af1d43d33a1106ad3c58252        1/1     Running   0              5d5h
instance-manager-cee2e92722813c9b0a6659f3ae7aecac        1/1     Running   0              5d5h
instance-manager-d0e16589d6085f69d9b92962ed07e74f        1/1     Running   0              5d5h
instance-manager-dd8c32539c1d24364789b50b2ea7d9ec        1/1     Running   0              5d1h
longhorn-csi-plugin-4zwwv                                3/3     Running   3 (5d1h ago)   5d5h
longhorn-csi-plugin-5xl2w                                3/3     Running   0              5d5h
longhorn-csi-plugin-csmsj                                3/3     Running   0              5d5h
longhorn-csi-plugin-hqgj6                                3/3     Running   0              5d5h
longhorn-csi-plugin-t2x77                                3/3     Running   0              5d5h
longhorn-csi-plugin-wg69z                                3/3     Running   0              5d5h
longhorn-driver-deployer-7f95dbdb75-s7w7s                1/1     Running   0              5d3h
longhorn-manager-4hs2b                                   2/2     Running   0              5d5h
longhorn-manager-9mmg2                                   2/2     Running   0              5d5h
longhorn-manager-lr49l                                   2/2     Running   0              5d5h
longhorn-manager-lr9zd                                   2/2     Running   0              5d5h
longhorn-manager-rlvtp                                   2/2     Running   0              5d5h
longhorn-manager-vdh24                                   2/2     Running   2 (5d1h ago)   5d5h
longhorn-ui-7b7dcc9589-mnjks                             1/1     Running   0              5d5h
share-manager-pvc-824e52b5-1390-4b73-886a-248e65c445ed   1/1     Running   0              5d3h
share-manager-pvc-b0a20829-e360-4562-9c56-0693bc6ae6cd   1/1     Running   0              5d5h
```
1. nfs 卡死, 那就一层一层往上找
2. 检查发现 longhorn 是使用 share manager pvc 这一 pod 提供 nfs 服务的
3. 直接通过这个 pvc 上层的 svc 进行手动挂载 
	1. `mount -vvv -t nfs4 -o vers=4.2 -o nolock -o noresvport -o hard -o timeo=1 100.96.37.116:/pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f /mnt/longhorn-nfs`
4. 检查现象一样, 同样无法挂载
5. 重复创建一个 pvc, 发现刚开始可以, 过段时间现象依旧, 还是卡死
6. 登录到 pod, 查看挂载的文件目录是否正常(文件目录通过 open-iscsi 提供目录挂载, 之后使用 nfs 将这一目录进行共享)

至此, 可以确定是 `share-manager-pvc` 这个 pod 内的问题

### 2. 分析这个 `share-manager-pvc`  pod 是怎么工作的

```
Longhorn Volume (存储卷)
       |
       v
Share-Manager Pod
(NFS Server 容器运行中)
       |
       v
Kubernetes Worker Node
(NFS Client 挂载 RWX 卷)
       |
       v
多个应用 Pod
(访问共享数据)

```
检查发现这个 pod 运行一个 `# nfs-ganesha` 服务, 该程序是一个 **NFS Server** 容器，用于将存储卷的内容通过 NFS 协议共享出去

### 3. 首先尝试 strace 查看是不是因为一些系统调用卡死, 导致无法处理请求

```sh
[root@localhost ~]# strace -p  2502828
strace: Process 2502828 attached
futex(0x7ffa45ffb990, FUTEX_WAIT_BITSET|FUTEX_CLOCK_REALTIME, 46, NULL, FUTEX_BITSET_MATCH_ANY
```
检查发现卡在了一个 轻量级的锁下面, 通过 google 发现并没有什么关于这个的 bug, 或者解决方法

### 4. 退回到最原始的解决方法, 通过查看日志来排查(完全依赖代码开发者的编程素养)
查看日志如下
```bash
11/12/2024 02:01:51 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.2.0 clientid=Epoch=0x6758f134 Counter=0x000008e2 -------------------
11/12/2024 02:01:51 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.2.0 clientid=Epoch=0x6758f134 Counter=0x000008e7 -------------------
11/12/2024 02:01:51 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa28000d80 name=(19:Linux NFSv4.2 bogon) refcount=3 cr_confirmed_rec=0x7ffa2001dfc0 cr_unconfirmed_rec=0x7ffa2001b440
11/12/2024 02:01:51 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] longhorn_rm_clid :CLIENT ID :EVENT :Remove client '19%3ALinux%20NFSv4.2%20bogon' from recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f (19%3ALinux%20NFSv4.2%20bogon)
11/12/2024 02:01:51 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] longhorn_add_clid :CLIENT ID :EVENT :Add client '19:Linux NFSv4.2 bogon' to recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_32] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.4.0 clientid=Epoch=0x6758f134 Counter=0x000008e3 -------------------
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_32] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.4.0 clientid=Epoch=0x6758f134 Counter=0x000008e8 -------------------
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_32] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa28000d80 name=(19:Linux NFSv4.2 bogon) refcount=3 cr_confirmed_rec=0x7ffa2001b440 cr_unconfirmed_rec=0x7ffa3001a8c0
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_32] longhorn_rm_clid :CLIENT ID :EVENT :Remove client '19%3ALinux%20NFSv4.2%20bogon' from recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f (19%3ALinux%20NFSv4.2%20bogon)
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_32] longhorn_add_clid :CLIENT ID :EVENT :Add client '19:Linux NFSv4.2 bogon' to recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.5.0 clientid=Epoch=0x6758f134 Counter=0x000008e4 -------------------
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.5.0 clientid=Epoch=0x6758f134 Counter=0x000008e9 -------------------
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa28000d80 name=(19:Linux NFSv4.2 bogon) refcount=3 cr_confirmed_rec=0x7ffa3001a8c0 cr_unconfirmed_rec=0x7ffa2001dfc0
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] longhorn_rm_clid :CLIENT ID :EVENT :Remove client '19%3ALinux%20NFSv4.2%20bogon' from recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f (19%3ALinux%20NFSv4.2%20bogon)
11/12/2024 02:01:53 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_33] longhorn_add_clid :CLIENT ID :EVENT :Add client '19:Linux NFSv4.2 bogon' to recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.0.0 clientid=Epoch=0x6758f134 Counter=0x000008df -------------------
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.0.0 clientid=Epoch=0x6758f134 Counter=0x000008ea -------------------
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa34004420 name=(23:Linux NFSv4.2 localhost) refcount=3 cr_confirmed_rec=0x7ffa3c01db30 cr_unconfirmed_rec=0x7ffa2001b440
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] longhorn_rm_clid :CLIENT ID :EVENT :Remove client '23%3ALinux%20NFSv4.2%20localhost' from recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f (23%3ALinux%20NFSv4.2%20localhost)
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] longhorn_add_clid :CLIENT ID :EVENT :Add client '23:Linux NFSv4.2 localhost' to recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_28] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.3.1 clientid=Epoch=0x6758f134 Counter=0x000008e5 -------------------
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.3.1 clientid=Epoch=0x6758f134 Counter=0x000008eb -------------------
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa34004420 name=(23:Linux NFSv4.2 localhost) refcount=3 cr_confirmed_rec=0x7ffa2001b440 cr_unconfirmed_rec=0x7ffa0c015b50
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] longhorn_rm_clid :CLIENT ID :EVENT :Remove client '23%3ALinux%20NFSv4.2%20localhost' from recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f (23%3ALinux%20NFSv4.2%20localhost)
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] longhorn_add_clid :CLIENT ID :EVENT :Add client '23:Linux NFSv4.2 localhost' to recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.1.0 clientid=Epoch=0x6758f134 Counter=0x000008e6 -------------------
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.1.0 clientid=Epoch=0x6758f134 Counter=0x000008ec -------------------
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa28000d80 name=(19:Linux NFSv4.2 bogon) refcount=3 cr_confirmed_rec=0x7ffa2001dfc0 cr_unconfirmed_rec=0x7ffa0c021c50
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] longhorn_rm_clid :CLIENT ID :EVENT :Remove client '19%3ALinux%20NFSv4.2%20bogon' from recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f (19%3ALinux%20NFSv4.2%20bogon)
11/12/2024 02:01:54 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_24] longhorn_add_clid :CLIENT ID :EVENT :Add client '19:Linux NFSv4.2 bogon' to recovery backend share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f
11/12/2024 02:01:56 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_28] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.0.0 clientid=Epoch=0x6758f134 Counter=0x000008ea -------------------
11/12/2024 02:01:56 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_28] nfs4_op_create_session :CLIENT ID :INFO :CREATE_SESSION client addr=::ffff:100.97.0.0 clientid=Epoch=0x6758f134 Counter=0x000008ed -------------------
11/12/2024 02:01:56 : epoch 6758f134 : share-manager-pvc-d14f1a3a-7dfe-4684-b650-6736cdd7623f : nfs-ganesha-33[svc_28] nfs4_op_create_session :CLIENT ID :INFO :Client Record 0x7ffa34004420 name=(23:Linux NFSv4.2 localhost) refcount=3 cr_confirmed_rec=0x7ffa0c015b50 cr_unconfirmed_rec=0x7ffa3c01dec0

```

发现不对劲, 十分有十二分的不对劲, 日志中显示, 程序似乎陷入到了 `longhorn_rm_clid` 和 `longhorn_add_clid` 的循环中, 十分频繁,而正常环境是每个主机加入后, 之后就不再重建. 检查发现不通的 `client addr` 却拥有这相同的 `clientid`, 怀疑是不是因为 `localhost`  这个的问题(hostname 的问题)

### 5. google 关键词 `nfs-ganesha hostname`
发现有一个 [讨论](https://lists.nfs-ganesha.org/archives/list/devel@lists.nfs-ganesha.org/thread/4H2JRMKNA7P2GCJ6UC5HISOEEBJXSYLP/) , 这个 nfs 服务器在` Multi-client Same Hostname ` 有 `issue`, 所以到这里几乎就可以判断出来了, 因为 `k8s node `的 `hostname` 相同导致的, 登录到节点上查看发现果然是的, 所有的 `hostname` 都是 `localhost`

## 最终解决方法 (一般看似很稀奇的问题, 背后都是一个很沙雕的原因导致的)
根据 https://github.com/nfs-ganesha/nfs-ganesha/issues/676 描述, 前置条件是需要每一个主机有唯一的 hostname, 解决方法 
```yaml
- hosts: kube_node
  name: 设置主机名为 inventory_hostname
  tasks:
    - name: 设置主机名
      command: hostnamectl set-hostname {{ k8s_nodename }}
      become: true

    - name: 确认主机名设置
      command: hostname
      register: hostname_output

    - name: 输出主机名设置结果
      debug:
        msg: "{{ hostname_output.stdout }}"
```

## 反思
### 在 longhorn 安装前进行了 env check 的检查, 但是一切正常, 为什么没有检查出来主机名不唯一(env check 中有关于主机名的检查)
`env check `中使用 `kubectl get node` 中的 `name` 获取 `hostname` 查看是否唯一, 但实际上的 hostname 并不是 k8s 中记录的

kubeasz 中创建 kubelet 服务文件的时候使用了一个小 `tricks`, 重写了 `hostname`
```bash
ExecStart={{ bin_dir }}/kubelet \
  --config=/var/lib/kubelet/config.yaml \
  --container-runtime-endpoint=unix:///run/containerd/containerd.sock \
  --hostname-override={{ K8S_NODENAME }} \
  --kubeconfig=/etc/kubernetes/kubelet.kubeconfig \
  --root-dir={{ KUBELET_ROOT_DIR }} \
  --v=2
```




<!--more-->
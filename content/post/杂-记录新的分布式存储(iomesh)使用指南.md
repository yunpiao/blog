---
title: 杂-记录新的分布式存储(iomesh)使用指南
tags: 
date: 2025-01-23T11:30:47+08:00
draft: false
toc: true
slug: 20250123113047
categories:
---
>  最近公司产品部署到客户公司使用的一款小众些的分布式存储-iomesh, 做下流水账记录
## **一、环境准备**
1. **硬件要求**
   - 每个节点至少需：
     - 1块缓存盘（Cache Disk，推荐SSD）
     - 1块数据盘（Partition Disk）
   - 网络分离（建议存储网络独立，如10.234.1.0/24）

2. **系统配置**
   ```bash
   # 所有节点安装 open-iscsi
   apt install open-iscsi -y

   # 修改iSCSI配置
   sudo sed -i 's/^node.startup = automatic$/node.startup = manual/' /etc/iscsi/iscsid.conf
   sudo modprobe iscsi_tcp
   echo "iscsi_tcp" | sudo tee /etc/modprobe.d/iscsi-tcp.conf
   systemctl enable --now iscsid
   ```

---

## **二、Kubernetes集群部署**
1. **要求**
   - Kubernetes 1.24+
   - Containerd作为容器运行时

2. **节点准备**
   ```bash
   # Master节点参与调度（如需）
   kubectl taint nodes --all node-role.kubernetes.io/control-plane- node-role.kubernetes.io/master-
   ```

---

## **三、IOMesh离线安装**
1. **安装包准备**
   ```bash
   tar -xvf iomesh-offline-v0.11.1.tgz
   cd iomesh-offline
   ctr --namespace k8s.io image import ./images/iomesh-offline-images.tar
   ```

2. **生成配置文件**
   ```bash
   ./helm show values charts/iomesh > iomesh.yaml
   ```

3. **关键配置项**
   ```yaml
   iomesh:
     chunk:
       dataCIDR: "10.234.1.0/24"  # 存储专用网络
     diskDeploymentMode: "hybridFlash"  # 或 "allFlash"
     deviceMap:
       cacheWithJournal:   # Hybrid模式配置
         selector:
           matchLabels:
             iomesh.com/bd-driverType: SSD
       dataStoreWithJournal:  # All-Flash模式配置
         selector:
           matchLabels:
             iomesh.com/bd-driverType: SSD
   ```

4. **安装IOMesh**
   ```bash
   ./helm install iomesh ./charts/iomesh \
     --create-namespace \
     --namespace iomesh-system \
     --values iomesh.yaml \
     --wait
   ```

---

## **四、磁盘管理**
1. **查看磁盘状态**
   ```bash
   kubectl -n iomesh-system get blockdevice
   ```

2. **标记磁盘类型**
   ```bash
   # 标记缓存盘
   kubectl label blockdevice <blockdevice-name> iomesh-system/disk=SSD -n iomesh-system

   # 标记数据盘
   kubectl label blockdevice <blockdevice-name> iomesh-system/disk=HDD -n iomesh-system
   ```

3. **申领磁盘**
   ```bash
   ./helm -n iomesh-system upgrade iomesh charts/iomesh -f iomesh.yaml
   ```

---

## **五、存储配置**
1. **StorageClass示例**
   ```yaml
   apiVersion: storage.k8s.io/v1
   kind: StorageClass
   metadata:
     name: iomesh-sc
   provisioner: com.iomesh.csi-driver
   reclaimPolicy: Retain
   parameters:
     replicaFactor: "2"
     thinProvision: "true"
   ```

2. **创建PVC**
   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: demo-pvc
   spec:
     storageClassName: iomesh-sc
     accessModes: [ReadWriteOnce]
     resources:
       requests:
         storage: 100Gi
   ```

---

## **六、运维监控**
1. **查看集群状态**
   ```bash
   kubectl get iomeshclusters.iomesh.com -n iomesh-system -o yaml
   ```

2. **关键指标**
   ```yaml
   status:
     summary:
       clusterSummary:
         spaceInfo:
           totalDataCapacity: 24.66Ti  # 总存储容量
           usedDataSpace: 11.50Gi      # 已用空间
       metaSummary:
         leader: 10.211.5.11:10100     # Meta服务Leader节点
   ```

---

## **七、故障排查**
1. **Pod挂载PVC失败**
   ```log
   Error: Failed to load module tcp
   ```
   **解决方案**：
   ```bash
   # 确认iscsi_tcp模块加载
   lsmod | grep iscsi_tcp
   modprobe iscsi_tcp

   # 检查iscsid服务状态
   systemctl status iscsid
   ```

2. **磁盘未Claimed**
   - 检查`iomesh.yaml`设备选择器配置
   - 确认磁盘标签是否正确

---

## **八、卸载IOMesh**
```bash
./helm uninstall -n iomesh-system iomesh
# 清理残留资源（谨慎操作！）
kubectl delete ns iomesh-system
```

---
## 九、 参考

- **官方文档**：[IOMesh Documentation](https://docs.iomesh.com/)


## 十、 和 longhorn 的对比

| **维度**   | **IOMesh 优势** | **Longhorn 优势**   |
| -------- | ------------- | ----------------- |
| **性能**   | 高 IOPS、低延迟    | 轻量级，适合中等负载        |
| **集成性**  | 企业级功能丰富       | 与 Kubernetes 深度集成 |
| **成本**   | 高（商业授权+硬件）    | 低（开源免费）           |
| **易用性**  | 复杂，需专业运维      | 简单，适合云原生新手        |
| **适用场景** | 核心生产系统        | 实验环境、边缘计算         |



**稳定性与性能优先选 IOMesh，灵活性与成本优先选 Longhorn**。
<!--more-->
---
title: "k8s 使用"
date: 2024-04-12T10:39:46+08:00
draft: true
---


![](https://yunpiao-images.oss-cn-beijing.aliyuncs.com/ob/202401030949870.png)
## nginx-ingrass 更新

```bash
helm upgrade --install --timeout 1200s nginx-ingress -f /data/itdrasz/itdr/charts_value/nginx-ingress-controller.yaml -n  nginx-system  /data/itdrasz/itdr/charts/nginx-ingress-controller-9.7.2.tgz --create-namespace
```

## 创建 token
```bash

cat<<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cby
EOF

 cat<<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
type: kubernetes.io/service-account-token
metadata:
  name: cby
  annotations:
    kubernetes.io/service-account.name: "cby"
EOF

kubectl create clusterrolebinding zxl-test-cluster-admin-binding --clusterrole=cluster-admin --user=system:serviceaccount:itdr:cby

 kubectl describe secrets cby
```
## grafana 排查

```
登录地址 
/ItdrInnerManager/grafana/

账号密码 
itdrManager

itdrManager netstar@2023@)@#

grafana 登录密码
admin
zawx@2023

```


## 更新 cm
kubectl delete cm apisix-cm && kubectl create configmap apisix-cm --from-file=./apisix.yaml && kubectl rollout restart deploy apisix

## 更新副本数

```bash
$ kubectl scale --replicas=3 rs/demo-replicaset
```

## 使用 debug 容器进行调试
```bash
kubectl debug -n kube-system  -it coredns-6994896589-28qks  --image=easzlab.io.local:5000/flannel/flannel-cni-plugin:v1.1.2  --share-processes --copy-to=nginx-app-debug --container=nginx-container-debug
```

## 临时启动一个 pod

```bash
 kubectl run test1 -i --tty --image=harbor.in.netstar.cn/openebs/linux-utils:3.4.0 sh
```

## 设置 pod 亲和性
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: NotIn
          values:
          - master


## 有两个默认存储问题
`kubectl patch storageclass <your-class-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'`
## Service account 和 secret 的关系

Service Account它并不是给kubernetes集群的用户使用的，而是给pod里面的进程使用的，它为pod提供必要的身份认证
每个sa下面都会拥有的一个加密的token


## External ip 和  node Port 

两者都是外部 client 访问 service 服务 时候的解决方案
1. cluster ip 
在 service 指定 cluster ip type 的时候， 设置 external Ip 字段， 会在 iptables 中增加 rule， 判断是不是外部请求，是外部请求的话，请求转发到 server 的 cluster ip 上

```
  externalIPs:
  - 192.168.96.10
```
注1、 匹配的时候 会经过 KUBE-MASK-MASQ 设置地址伪装， 用于 NAT、地址转换。 负责 client 请求行接收到的包中的 源地址不是方式发送的 目的地址， 则会丢弃该包
注2、会判断是不是从 pod 来的， 也不是本机来的。 不然不会匹配

2. NodePort
配置 service type 为 NodePorts 、此时端口会进行映射，原有的 80 会随机映射对应的 30000 以上的任意端口。
注1、NodePorts 是在 cluster Ip 上的，
注2、NodePorts 不会阻止从集群内部或者本机的 Ip 访问
```bash
 kubectl get services -o wide
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE   SELECTOR
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        24d   <none>
test-svc     NodePort    10.107.169.79   <none>        80:30454/TCP   47h   app=lab-web
```


ipbtales 和 ipvs 实现的 kube-proxy 方式是不同的。 
iptables 通过增加规则实现转发
ipvs 通过 ipvsamin 设置转发




---
title: mac air 体验 k3s
date: 2023-04-12T10:39:46+08:00
draft: false
toc: true
tags:
  - 运维
categories:
  - 杂技浅尝
---
<!--more-->
```bash
multipass launch -n master -c 1 -m 1G -d 10G
multipass launch -n node1 -c 1 -m 1G -d 10G
```

`multipass shell master`

`curl -sfL https://rancher-mirror.oss-cn-beijing.aliyuncs.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -`


`sudo cat /var/lib/rancher/k3s/server/node-token`


`multipass shell node1`


安装k3s，将master的ip和token替换到下面
`curl -sfL https://rancher-mirror.oss-cn-beijing.aliyuncs.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=https://【master的ip】:6443 K3S_TOKEN=【master的token】 sh -`

连接master虚拟机，确认节点
连接master的shell终端
`multipass shell master`

查看k3s节点
`sudo kubectl get nodes`
至此安装完成

部署nginx测试
连接master终端
创建一个deployment，名字是demo1，80端口，2个pod
sudo kubectl create deployment demo1 --image=nginx --port=80 --replicas=2

给demo1创建一个负载均衡的service
sudo kubectl expose deployment demo1 --type=LoadBalancer --port=80

查看所有service
sudo kubectl get svc

c1581c4030.zicp.fun

这里的端口号是31886
在master中，执行 curl http://master:31886，输出html字符代表nginx访问成功。

或者在本地电脑执行 multipass list 查看master虚拟机ip，浏览器访问http://虚拟机ip:31886。


加拉取仓库

```bash
cat > /etc/rancher/k3s/registries.yaml <<EOF
mirrors:
  docker.io:
    endpoint:
      - "http://hub-mirror.c.163.com"
      - "https://docker.mirrors.ustc.edu.cn"
      - "https://registry.docker-cn.com"
EOF

systemctl restart k3s
```
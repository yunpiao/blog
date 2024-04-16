---
title: 常见 LInux 命令记录
tags:
  - linux
  - 运维
  - 杂
date: 2024-04-16T15:57:42+08:00
draft: false
hideInList: false
isTop: false
toc: true
cover:
  image: https://cdn.sspai.com/2021/07/10/4924403d889cd827d6637a5efb6c5ce2.png?imageMogr2/auto-orient/quality/95/thumbnail/!1420x708r/gravity/Center/crop/1420x708/interlace/1
slug: 20240416155742
feature:
---

<!--more-->
### 网站下载 命令
防止网站博客下线, 直接下载整站
```bash
wget --no-check-certificate  -r -np -nc -k -c https://xxx.github.io/notebook/
```

### iptables
```bash

查看服务器目前开放端口
netstat -tnl


开放指定的端口      #12414133
iptables -A INPUT -s 127.0.0.1 -d 127.0.0.1 -j ACCEPT               #允许本地回环接口(即运行本机访问本机)

iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT    #允许已建立的或相关连的通行

iptables -A OUTPUT -j ACCEPT         #允许所有本机向外的访问
iptables -A INPUT -p tcp --dport 22 -j ACCEPT    #允许访问22端口

iptables -I INPUT -s 123.0.0.0/8 -j DROP      #封整个段即从123.0.0.1到123.255.255.254的命令

保存设置（通过iptables命令设置，如果不保存服务器重启后会丢失）
service iptables save


将所有iptables以序号标记显示，执行：iptables -L -n --line-numbers
比如要删除INPUT里序号为8的规则，执行：iptables -D INPUT 8
```


### docker
**「Docker」使用 Docker run 覆盖 ENTRYPOINT**
`sudo docker run -it --entrypoint /bin/bash [docker_image]`

**docker 权限**
`docker run -u`

**build 使用代理**
```bash
docker build --build-arg "HTTP_PROXY=http://192.168.50.30:7890" --build-arg "HTTPS_PROXY=http://192.168.50.30:7890" 
```

**docker 里面 执行 docker**
```bash
挂载 socket                "/var/run/docker.sock:/var/run/docker.sock"
```

**pull 加速**
```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo touch /etc/systemd/system/docker.service.d/proxy.conf

echo `[Service]
Environment="HTTP_PROXY=http://192.168.50.30:7890"
Environment="HTTPS_PROXY=http://192.168.50.30:7890"
Environment="NO_PROXY=localhost,127.0.0.1,.example.com,192.168.0.1"
` > /etc/systemd/system/docker.service.d/proxy.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
```
**docker 创建网桥**
```bash
docker network create --driver=bridge --subnet=192.168.0.0/16 br0
docker network create –subnet=172.16.1.0/24 docker_front
```
**docker compose**
```bash
curl -k -L https://get.daocloud.io/docker/compose/releases/download/1.25.1/docker-compose-`uname -s`-`uname -m` -o docker-compose
sudo chmod +x docker-compose
./docker-compose --version
docker rm -f nginx
```

### git 永久保存密码
在项目根目录执行
`git config --global credential.helper store`
然后你会在你本地生成一个文本，上边记录你的账号和密码。当然这些你可以不用关心。
然后你使用上述的命令配置好之后，再操作一次git pull，然后它会提示你输入账号密码，这一次之后就不需要再次输入密码了。

### nc搭建代理

```bash
apt-get install netcat
搭建代理 ncat --sh-exec "ncat 10.232.189.20 8000" -l 82  --keep-open
搭建代理 ncat --sh-exec "ncat 10.232.189.20 8000" -l 82  --keep-open
```

### SSL 查看证书
ssl 证书查看

```bash
openssl x509 -noout -modulus -in shim-cert_server.crt | openssl md5
openssl rsa -noout -modulus -in shim-cert_server.key | openssl md5
openssl req -noout -modulus -in CSR.csr | openssl md5
openssl rsa -noout -modulus -in shim-cert_server.key | openssl md5 
openssl x509 -noout -modulus -in shim-cert_server.crt | openssl md5
```

### crontab 恢复
```bash
sudo cat /var/log/cron* | grep CMD | awk -F'CMD' '{print $2}' | awk -F'[(|)]' '{print $2}' | sort -u
```

### 排查系统调用

`strace cat /dev/null`

### 内外网冲突添加路由

```bash
route delete 0.0.0.0
route add 0.0.0.0 mask 0.0.0.0 192.168.87.93
route add 192.0.0.0 mask 255.0.0.0 192.168.2.1 
```

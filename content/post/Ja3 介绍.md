---
title: Ja3 介绍
tags:
  - linux
  - 运维
  - 杂
date: 2024-04-16T15:57:42+08:00
draft: false
hideInList: false
isTop: false
toc: true
slug: 20240416155744
---
### TLS/SSL 指纹

客户端和 server 端进行三次握手后,会进行 TLS 握手阶段, 同时恶意流量也会通过这种方式绕过检测




### ja3

我们知道，不仅"良性的"应用程序会使用TLS及其前身SSL对其流量进行加密，而且恶意软件也常常这样做；前者这样做的目的是确保数据安全，而后者这样做的目的则是将其流量隐藏在噪声中。为了启动TLS会话，客户端将在`TCP 3次握手`后发送TLS客户端的`Hello数据包`。这个数据包及其生成方式取决于构建客户端应用程序时所使用的软件包和方法。如果接受TLS连接，服务器将使用基于服务器端库和配置以及Client Hello消息中的详细信息创建的`TLS Server Hello数据包`进行响应。由于`TLS协商是以明文的方式传输`的，所以，我们可以使用TLS Client Hello数据包中的详细信息对`客户端应用程序进行指纹识别`。

[https://xz.aliyun.com/t/3889](https://xz.aliyun.com/t/3889)

JA3和JA3S是一种基于TLS指纹的安全分析方法。JA3指纹能够指示客户端应用程序通过TLS通信的方式，而JA3S指纹能够指示服务器响应。如果两者结合起来，实质上就生成了客户端和服务器之间的加密协商的指纹。虽然基于TLS的检测方法不一定是灵丹妙药，也不一定能保证映射到客户端应用程序，但它们始终是安全分析的轴心所在。

[http://www.ruanyifeng.com/blog/2014/09/illustration-ssl.html](http://www.ruanyifeng.com/blog/2014/09/illustration-ssl.html)

ssl 函数 clienthello[https://manpages.debian.org/experimental/libssl-doc/SSL_client_hello_get0_ext.3ssl.en.html](https://manpages.debian.org/experimental/libssl-doc/SSL_client_hello_get0_ext.3ssl.en.html)

ja3 算法[https://xz.aliyun.com/t/3889](https://xz.aliyun.com/t/3889)

增强 ja3[http://www.jsjkx.com/CN/article/openArticlePDF.jsp?id=18951](http://www.jsjkx.com/CN/article/openArticlePDF.jsp?id=18951)

bfe 读取 clienthello

local ngx_lua_ffi_ssl_get_client_hello_extffi.cdef[[int ngx_http_lua_ffi_ssl_get_client_hello_ext1(ngx_http_request_t *r,unsigned int type, const unsigned char **out, size_t *outlen,char **err);]]

ngx_lua_ffi_ssl_get_client_hello_ext = C.ngx_http_lua_ffi_ssl_get_client_hello_ext1

nginx: log -> socketgoflume: socket -> tls_sink

## 3. 支持 https ja3 指纹识别和防护策略

[https://github.com/openresty/lua-resty-core/blob/master/lib/ngx/ssl/clienthello.md](https://github.com/openresty/lua-resty-core/blob/master/lib/ngx/ssl/clienthello.md)

[https://github.com/bfenetworks/bfe/blob/70ed4a0b11b6521ddef3e861cb854eacc5d89e16/bfe_tls/handshake_messages.go](https://github.com/bfenetworks/bfe/blob/70ed4a0b11b6521ddef3e861cb854eacc5d89e16/bfe_tls/handshake_messages.go)

[https://github.com/jbremer/ja3/blob/v1.0.1/parser.go](https://github.com/jbremer/ja3/blob/v1.0.1/parser.go)

[http://www.jsjkx.com/CN/article/openArticlePDF.jsp?id=18951](http://www.jsjkx.com/CN/article/openArticlePDF.jsp?id=18951)[https://github.com/fooinha/nginx-ssl-ja3](https://github.com/fooinha/nginx-ssl-ja3) nginx module ja3

[https://github.com/bfenetworks/bfe/blob/70ed4a0b11b6521ddef3e861cb854eacc5d89e16/bfe_tls/handshake_messages.go](https://github.com/bfenetworks/bfe/blob/70ed4a0b11b6521ddef3e861cb854eacc5d89e16/bfe_tls/handshake_messages.go)





### 引用

[https://www.ruanyifeng.com/blog/2014/02/ssl_tls.html](https://www.ruanyifeng.com/blog/2014/02/ssl_tls.html)

[https://www.guildhab.top/2021/04/%E9%80%9A%E8%BF%87-ja3s-%E5%AE%9E%E7%8E%B0-tls-%E6%8C%87%E7%BA%B9%E8%AF%86%E5%88%AB/](https://www.guildhab.top/2021/04/%E9%80%9A%E8%BF%87-ja3s-%E5%AE%9E%E7%8E%B0-tls-%E6%8C%87%E7%BA%B9%E8%AF%86%E5%88%AB/)


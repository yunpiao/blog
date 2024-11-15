---
title: epub书籍导入微信读书无法显示图片
tags:
  - 杂
  - 小说
  - blog
date: 2024-06-05T11:28:41+08:00
draft: false
toc: true
slug: 20240605112841
feature:
---

<!--more-->

## 太长不看
mac  可以执行下列脚本
```bash
# 指定文件夹路径
folder_path="./epub 书籍"

# 初始化 file 变量

# 遍历文件夹下的所有文件
for f in "$folder_path"/*; do
  # 检查是否是文件
  if [ -f "$f" ]; then
    # 获取文件名（不带路径）
    filename=$(basename "$f")
    # 去掉文件后缀
    file="${filename%.*}"
    # 将文件名添加到 file 变量中
    unzip -d ./$file ./$file.epub
    grep 'data-savepage-src=' -rl ./$file/* --include "*.html" | xargs sed -i '' 's|data-savepage-src="[^"]*"||g'
    cd ./$file
    zip -r ../format/$file.epub *
    cd ../
    rm -fr ./$file
  fi
done
```
## 删除 HTML 文件中的 'data-savepage-src' 属性
检查发现是因为图片具有 data-savepage-src 和 src 两个属性, 对于这两个属性, 只要删除 data-savepage-src 属性, 就可以导入微信读书后正常显示图片.
`grep 'data-savepage-src=' -rl "./$file" --include "*.html" | xargs sed -i '' 's|data-savepage-src="[^"]*"||g'`

##  总结
究其原因还是 html 是由 chrome 或者 其他插件导出的, epub 导入到微信读书后, 微信读书没有正确解析, 或者是优先解析 data-savepage-src. 导致失败. 属于是 微信读书的 bug

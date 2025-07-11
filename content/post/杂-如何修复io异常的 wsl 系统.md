---
title: 杂-如何修复io异常的 wsl 系统
tags: []
date: 2025-07-11T17:24:44+08:00
draft: false
toc: true
slug: 20250711172444
categories:
---
### **如何安全修复WSL2虚拟磁盘的文件系统错误**

当在WSL2的 `dmesg` 日志中发现 `EXT4-fs warning` 或 `Filesystem error` 等信息时，通常表明虚拟磁盘 (`ext4.vhdx`) 存在文件系统层面的问题。直接在运行中的WSL发行版内执行 `e2fsck` 会因磁盘正在使用而失败。

最安全、最专业的解决方法是：安装一个临时的“救援”发行版，将有问题的虚拟磁盘作为外部设备挂载到该环境中进行修复。

#### **核心原则**

文件系统检查工具 (`e2fsck`) 必须在**目标文件系统完全卸载（unmounted）**的状态下运行。

---

### **操作步骤**

#### **第1步：彻底关闭所有WSL实例**

此步骤至关重要，确保所有虚拟磁盘都已卸载且未被锁定。在Windows PowerShell或CMD中执行：

```powershell
wsl --shutdown
```

#### **第2步：定位目标虚拟磁盘文件 (`ext4.vhdx`)**

找到需要修复的WSL发行版（例如Ubuntu）的虚拟硬盘文件。其路径通常位于：

```
%localappdata%\Packages\
```

在该目录下，找到对应发行版的文件夹（如 `CanonicalGroupLimited.Ubuntu_...`），进入 `LocalState` 目录，即可找到 `ext4.vhdx` 文件。复制其完整路径以备后用。

**示例路径**: `C:\Users\YourUser\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu_79rhkp1fndgsc\LocalState\ext4.vhdx`

#### **第3步：安装一个轻量级“救援”发行版**

推荐使用Alpine，因为它安装迅速、占用空间小。

```powershell
wsl --install Alpine```

#### **第4步：将目标磁盘挂载到救援系统**

以裸盘（bare）模式将目标虚拟磁盘挂载到Alpine。这种模式只附加设备，不挂载文件系统。

**以管理员权限**打开PowerShell，执行以下命令，注意替换为自己的`ext4.vhdx`文件路径。

```powershell
# --vhd: 指明挂载的是VHD文件
# -d Alpine: 指定由Alpine发行版处理挂载
# --bare: 关键参数，只附加设备而不挂载文件系统
wsl --mount "C:\Path\To\Your\ext4.vhdx" --vhd -d Alpine --bare
```

#### **第5步：在救援系统中执行文件系统检查**

1.  启动并进入Alpine环境：
    ```powershell
    wsl -d Alpine
    ```

2.  进入Alpine后，使用 `lsblk` 命令查找新挂载的设备名称（如 `/dev/sdb`, `/dev/sdc` 等）。

3.  使用 `e2fsck` 对找到的设备进行检查和修复。
    *   使用 `sudo` 获取权限。
    *   使用 `-f` 参数强制进行检查。
    *   将 `/dev/sdX` 替换为上一步找到的真实设备名。

    ```bash
    # 在Alpine终端内执行
    sudo e2fsck -f /dev/sdX
    ```

    根据提示输入 `y` 同意修复所有发现的错误。

#### **第6步：清理并恢复**

1.  检查完成后，退出Alpine终端。
    ```bash
    exit
    ```
2.  回到Windows PowerShell，卸载之前挂载的虚拟磁盘。
    ```powershell
    wsl --unmount "C:\Path\To\Your\ext4.vhdx"
    ```

至此，原WSL发行版的虚拟磁盘已修复完毕，可以正常启动和使用。
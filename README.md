# 迷途未远

“迷途未远，今是昨非。”

这是一个使用 [Quartz v5](https://github.com/jackyzha0/quartz) 构建的个人数字花园，用于整理和发布笔记。

## 本地环境

- Node.js `v24.15.0`
- npm `11.12.1` 或更高版本

Windows PowerShell 首次运行：

```powershell
cd E:\Spark
npm.cmd install
npm.cmd run dev -- --port 8080
```

浏览器访问 <http://localhost:8080/>。如果 8080 端口被占用，可以改用其他端口，例如：

```powershell
npm.cmd run dev -- --port 8081
```

生产构建：

```powershell
npm.cmd run build
```

构建结果输出到 `public/`，该目录不会提交到版本库。

## 内容管理

站点文章位于 `content/`。文章可以使用英文文件名保持简洁链接，并在 YAML Front Matter 中通过 `title` 设置中文标题：

```yaml
---
title: 普通话
created: 2026-09-08
---
```

## 开源说明

本项目基于 Quartz v5 修改。Quartz 原始代码由 Jacky Zhao 及其贡献者开发，并依据 MIT License 发布。原始许可证及版权声明见 [LICENSE.txt](LICENSE.txt)。

本仓库中的文章内容及其他原创素材不因底层程序采用 MIT License 而自动获得相同授权；如需转载，请事先取得许可。

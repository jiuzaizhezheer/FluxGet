# FluxGet

FluxGet 是一个面向 yt-dlp 二次开发的 Web GUI 项目。目前已完成 React/Vite 前端、FastAPI 后端、Tailwind CSS 和运行环境探测的基础骨架。

## 环境

- Node.js 22.23.2（Node 22 LTS）
- pnpm 10.34.5
- Python 3.12.13
- FFmpeg 8.x（需要在系统 `PATH` 中可用）

依赖的具体版本见 `package.json` 和 `pyproject.toml`，安装结果分别锁定在 `pnpm-lock.yaml` 和 `uv.lock`。

## 启动

安装依赖：

```bash
npx pnpm@10.34.5 install
uv sync
```

分别启动两个开发进程：

```bash
npx pnpm@10.34.5 backend
npx pnpm@10.34.5 dev
```

如果系统已通过 Corepack 启用项目声明的 pnpm 10.34.5，上述命令可简写为 `pnpm install`、`pnpm backend` 和 `pnpm dev`。

打开 <http://localhost:5173>。后端 API 文档位于 <http://127.0.0.1:8000/docs>。

## 当前范围

当前版本支持链接解析、dry-run 预检和单媒体流式下载。每次下载必须先通过格式可访问性预检；后端随后通过 yt-dlp 获取媒体，并将输出直接中转给浏览器，不在项目目录保存视频。页面通过 SSE 显示传输进度。下载任务状态暂存在后端进程内，服务重启后不会保留。

请仅下载你有权访问和保存的内容，并遵守来源站点条款与当地法律。

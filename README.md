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

## 开发检查

首次安装依赖后启用提交钩子：

```bash
uv run pre-commit install --install-hooks
```

提交前会自动运行针对改动文件的格式与静态检查；推送前会额外运行前端类型检查和后端单元测试。也可以手动执行完整检查：

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm build
pnpm test:backend
```

GitHub CI 根据 PR 的全部改动（推送时为本次推送的改动）选择检查：

- 前端代码、Node 依赖或前端工具配置变更：运行 `Frontend`。
- 后端代码、Python 依赖或 FFmpeg Dockerfile 变更：运行 `Backend`。
- 两端同时变更、CI/共享配置或未分类文件变更：两端都运行。
- 仅修改根目录 README、AGENTS、CREATIVE_MODE_PROMPT 或 `docs/` 下 Markdown：跳过两端检查。

`CI Gate` 始终汇总结果；需要执行的检查失败、取消或意外跳过，以及改动检测失败，都会阻止通过。后续 `main` Ruleset 只需将 `CI Gate` 设置为必需状态检查，无需分别要求 `Frontend` 和 `Backend`。本地 Git 钩子仍沿用上述检查方式。

## 当前范围

当前版本支持链接解析、dry-run 预检和单媒体流式下载。输出容器可选择自动、MP4、MKV、WebM 或 MOV；系统始终保留来源站点可提供的最高质量音视频编码，所选容器不兼容时会在预检阶段直接提示，不会静默转码或降级。后端通过 yt-dlp 获取媒体并直接中转给浏览器，不在项目目录保存视频；下载进度由浏览器自身管理。下载任务状态暂存在后端进程内，服务重启后不会保留。

请仅下载你有权访问和保存的内容，并遵守来源站点条款与当地法律。

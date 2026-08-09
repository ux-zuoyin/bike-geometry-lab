# Bike Geometry Lab

Bike Geometry Lab 是一个面向桌面端的公路车几何、骑行设定与配件可视化工具。它以 Trek Domane 的官方车架几何为当前数据基线，将物理 Geometry、骑行设定和视觉配件保持为互相独立的状态，并通过可交互的侧视图展示尺寸、接触点与组件变化。

## 当前范围

- 车型：Trek Domane（Endurance）
- 尺码：44、49、52、54、56、58、61
- 核心 Geometry：Stack、Reach、Head Tube、Wheelbase、BB Drop、Chainstay 等
- 骑行设定：垫圈高度、把立长度、把立角度、坐垫高度、坐垫后移、曲柄长度
- 配件：前后轮、外胎、盘片、曲柄、飞轮、后拨
- 接触点：S（Saddle）、H（Hood）、P（Pedal）

当前产品聚焦一台经过校准的 Endurance 车型。All-Round 与 Aero 仅保留架构扩展位置，不属于当前可选产品范围。

## 主要能力

- 基于统一物理比例渲染 700C 公路车侧视图
- 使用 54 码作为唯一视觉基线，并按官方 Geometry 映射其他尺码
- 前后轮可独立选择，也可启用联动模式
- Fit Setup 与 Components 互不覆盖，切换车架尺码时保持设定
- 车轮、飞轮、盘片和曲柄使用 Registry 驱动的 SVG 资源
- 车轮与曲柄动画可在当前帧暂停和恢复
- Prism 工作区环境光、地面定位和字面镜像反射
- 三栏工程视图与可逆的舞台全屏模式
- Geometry Details 支持中文 / English 标签切换
- 官网几何图通过独立服务端 Parser 读取，并在 Review 中保留逐项校对能力

## 技术栈

- React 19
- Vite 6
- OGL（Prism WebGL 背景）
- Phosphor Icons
- 原生 SVG animation 与 Geometry transform
- Node.js 内置测试运行器

## 本地开发

要求 Node.js 18 或更高版本，并建议使用项目 lockfile 安装依赖。

```bash
npm ci
npm run dev
```

Vite 会输出本地访问地址。项目是桌面端工具，当前按最小 1024px 视口设计，不提供移动端布局。

## 可用脚本

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 生成生产构建，并准备 Sites 所需文件 |
| `npm run preview` | 本地预览生产构建 |
| `npm run test` | 运行 Geometry、State、渲染契约测试 |
| `npm run test:sites` | 验证 Sites worker 与构建产物 |

完整质量门槛：

```bash
npm run test
npm run build
npm run test:sites
```

## 项目结构

```text
src/
├── components/
│   ├── bike/templates/       # 当前 Endurance SVG 模板
│   ├── panels/               # Frame Geometry 与 Bike Setup
│   ├── ui/                   # 通用控件
│   └── visualizer/           # 舞台、标注、Prism 与视觉入口
├── config/                   # Fit Setup、组件 Registry、视觉 preset
├── data/                     # Trek Domane 官方 Geometry 数据
├── lib/
│   ├── geometry/             # 物理 Geometry 与接触点计算
│   └── bikeVisual/           # Figma anchor、动画和舞台定位
├── assets/                   # 当前 SVG 模板与组件资源
├── App.jsx
├── main.jsx
└── styles.css
```

## 状态与 Geometry 边界

项目维护三个独立的业务源：

- `frameState`：车型与尺码
- `fitSetup`：骑行设定
- `componentSetup`：视觉组件选择

Frame size 只重建产品 Geometry；Fit Setup 只移动骑行接触点和安装位置；Components 只替换视觉资源。任何一个域都不应反向修改另外两个域。

700C 外径是全局物理比例基准。车轴、BB、Stack、Reach、Wheelbase、Cockpit、Saddle 和 Crank 都从同一 Geometry 坐标系投影，视觉资源不得覆盖物理锚点。

## GitHub Pages

仓库名称为 `bike-geometry-lab`。在 GitHub Actions 中执行构建时，Vite 自动使用：

```text
/bike-geometry-lab/
```

作为 GitHub Pages base path。普通本地构建和 Sites 构建继续使用 `/`，避免破坏根路径静态托管。

典型 Pages workflow 应发布 `dist/client` 目录。构建后的 HTML 和静态资源链接会自动带上仓库子路径。

GitHub Pages 只提供静态前端，不会执行 Geometry Parser。真实图片识别部署为独立 Worker，前端通过公开的 `VITE_GEOMETRY_PARSER_ENDPOINT` 指向它；OpenAI API Key 只存在于 Worker Secret，不能放入任何 `VITE_*` 变量。

## Geometry Image Parser

Parser Endpoint：

```text
POST /api/geometry/parse
Content-Type: multipart/form-data
image: 当前用户选择的 PNG / JPG / JPEG 文件
```

独立 Worker 使用 `wrangler.geometry-parser.toml`，生产 Provider 默认为阿里云百炼 `qwen3-vl-flash`。部署前需将 `DASHSCOPE_COMPATIBLE_BASE_URL` 中的 Workspace ID 替换为华北 2（北京）业务空间 ID、设置生产域名白名单，并配置服务端 Secret：

```bash
npx wrangler secret put DASHSCOPE_API_KEY --config wrangler.geometry-parser.toml
```

`GEOMETRY_PARSER_PROVIDER` 只接受显式的 `qwen` 或 `openai`，Provider 失败不会自动切换。OpenAI Provider 仅作为未启用的备用实现保留；默认生产配置不会调用 OpenAI。

前端只配置 Worker 的公开地址：

```bash
VITE_GEOMETRY_PARSER_ENDPOINT=https://your-parser-worker.example.com/api/geometry/parse
```

生产分析没有 Mock fallback。Worker 或模型失败时，Import Flow 进入明确的 error 状态；测试通过依赖注入使用 `tests/fixtures`，不会请求真实 API。

Worker 收到 Structured Output 后会再次按 `detectedSizes` 对齐各车型列，并自行重算所有 `fieldColumnCounts`。重复尺码、无法对齐的尺码集合会直接拒绝；缺失单元格保留为 `null` 和 warning，不会删除整列或把相邻值错移到其他尺码。

## Sites 构建

`npm run build` 除了生成 Vite 客户端，还会保留并复制以下 Sites 集成文件：

- `.openai/hosting.json`
- `worker/index.js`
- `dist/server/index.js`
- `dist/.openai/hosting.json`

提交 Sites handoff 前应同时通过 `npm run build` 与 `npm run test:sites`。

## 开发约束

- 当前视觉源以拆分后的 Endurance SVG 和组件 Registry 为准。
- 54 码是唯一的零 delta 视觉基线。
- 不通过 magic offset 修改正式 Geometry。
- 不通过改变 wheel scale、axle 或 BB 来修正视觉位置。
- Prism、Reflection、Ground Alignment 和 S/H/P 属于当前正式能力。
- Debug 与 calibration UI 必须保持开发环境专用。

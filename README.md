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


# Endurance Bike Reference Notes

## 1. Reference Purpose

本目录用于 Bike Geometry Fit 项目中的：

**Endurance / 耐力型公路车标准模板**

当前参考车型为：

TREK Domane

注意：

TREK Domane 仅作为耐力型公路车的：

- 几何结构参考
- 车型比例参考
- 整车侧视形态参考
- 部件关系参考

最终产品不应该直接复刻 TREK Domane。

项目最终需要生成的是：

> 一个品牌无关、结构正确、外观自然、可被几何数据驱动的标准 Endurance Bike SVG 模板。

---

# 2. Reference Files

当前目录包含：

```text
references/endurance/
  trek-domane-geometry.png
  trek-domane-sideview.png
  notes.md
````

## trek-domane-geometry.png

用途：

* 几何字段定义参考
* 不同尺码 Geometry 数据参考
* 建立字段映射
* 验证车架关键节点关系
* 验证 Stack / Reach / Wheelbase 等尺寸关系

这张图片主要属于：

**Geometry Reference**

不要主要依赖它决定整车视觉风格。

---

## trek-domane-sideview.png

用途：

* 整车标准侧视比例参考
* 车架管型和轮廓参考
* 前叉参考
* 后三角参考
* 弯把与把立参考
* 座垫与座管参考
* 轮组比例参考
* 曲柄、牙盘、飞轮、后拨等基础结构参考

这张图片主要属于：

**Visual Shape Reference**

请将其理解为形态参考，而不是需要直接临摹的品牌产品。

---

# 3. Important Rule

这两张图片的作用不同：

```text
Geometry Image
↓
负责「数据正确」

Side View Image
↓
负责「车看起来正确」
```

最终 BikeVisualizer 应同时满足：

```text
正确几何
+
自然整车轮廓
+
标准化视觉
+
可用于车型对比
```

不要为了视觉效果破坏几何关系。

也不要为了几何计算把自行车画成简单的粗线骨架。

---

# 4. Geometry Units

TREK Domane Geometry 图中：

**除非特别说明，长度数据单位为 cm。**

项目内部所有长度必须统一转换为：

```text
millimeter / mm
```

例如：

```text
Reach 37.4 cm
→
374 mm

Stack 57.5 cm
→
575 mm

Wheelbase 101.0 cm
→
1010 mm
```

角度保持：

```text
degree / °
```

例如：

```text
73.3°
71.9°
```

不要把角度参与 cm → mm 换算。

---

# 5. Geometry Field Mapping

TREK 几何图中 A–N 字段映射如下。

## A — Seat Tube Length

中文：

座管长度

项目字段建议：

```ts
seatTubeLength
```

单位：

```text
mm
```

---

## B — Seat Tube Angle

中文：

座管角度

项目字段：

```ts
seatTubeAngle
```

单位：

```text
degree
```

---

## C — Head Tube Length

中文：

头管长度

项目字段：

```ts
headTubeLength
```

单位：

```text
mm
```

---

## D — Head Tube Angle

中文：

头管角 / 头管角度

项目字段：

```ts
headTubeAngle
```

单位：

```text
degree
```

---

## E — Effective Top Tube

中文：

有效上管长度

项目字段：

```ts
effectiveTopTube
```

单位：

```text
mm
```

---

## G — BB Drop

中文：

中轴下沉 / 五通下沉

项目字段：

```ts
bbDrop
```

单位：

```text
mm
```

---

## H — Chainstay

中文：

后下叉长度

项目字段：

```ts
chainstay
```

单位：

```text
mm
```

---

## I — Fork Rake / Fork Offset

中文：

前叉偏移

项目字段：

```ts
forkRake
```

单位：

```text
mm
```

---

## J — Trail

中文：

拖曳距

项目字段：

```ts
trail
```

单位：

```text
mm
```

当前版本可以保存数据，但不要求作为主要推荐指标。

---

## K — Wheelbase

中文：

轴距

项目字段：

```ts
wheelbase
```

单位：

```text
mm
```

---

## L — Standover

中文：

跨高

项目字段：

```ts
standover
```

单位：

```text
mm
```

---

## M — Reach

中文：

前伸量

项目字段：

```ts
reach
```

单位：

```text
mm
```

这是当前项目最重要的字段之一。

---

## N — Stack

中文：

堆高

项目字段：

```ts
stack
```

单位：

```text
mm
```

这是当前项目最重要的字段之一。

---

# 6. Geometry Priority

第一阶段不要认为所有 Geometry 字段同等重要。

## P0

必须优先支持：

```text
Stack
Reach
Head Tube Length
Head Tube Angle
Seat Tube Angle
Wheelbase
Chainstay
BB Drop
```

## P1

用于增强车架绘制：

```text
Effective Top Tube
Seat Tube Length
Fork Rake
Standover
```

## P2

可以保存，但第一阶段不需要进入核心推荐算法：

```text
Trail
其他品牌特有 Geometry 字段
```

---

# 7. Endurance Archetype Definition

Endurance 不等于单纯把 Stack 调高。

它应该是一套完整的车型特征。

标准 Endurance 模板应该表现为：

* 相对更高的前端
* 相对更高的 Stack
* 相对克制的 Reach
* 头管视觉上更高
* 更自然舒展的骑行姿态
* 后三角具有稳定感
* 轴距通常不会表现得极端紧凑
* 整体不追求非常低趴的视觉效果
* 车架看起来适合长距离和舒适骑行
* 仍然必须保持标准现代公路车的运动感

不要把 Endurance 做成：

* 城市自行车
* Gravel Bike
* Touring Bike
* 休闲车
* 山地车

它仍然应该明显是一辆：

**现代公路车。**

---

# 8. Visual Shape Reference

请从 trek-domane-sideview.png 中提炼以下特征。

## Frame

需要保留：

* 完整主三角
* 完整后三角
* 正确的上管 / 下管 / 座管关系
* 头管具有实体厚度
* 管材不是单纯 center line
* 管型应该有一定实体感

不要直接使用：

```text
line x1 y1 x2 y2
```

拼成一辆粗线自行车作为最终视觉。

Geometry 可以由 center line 计算。

但 Visual Layer 应根据这些 center line 生成具有宽度的 tube shape。

---

# 9. Frame Tube Visual Rules

推荐使用：

```text
SVG path
polygon
rounded polygon
```

表达车架管材。

不要完全依赖：

```text
stroke-width
```

来模拟所有管材。

原因：

不同管材需要体现不同的：

* 宽度
* 朝向
* 收窄
* 连接关系

例如：

Down Tube 应比：

Seat Stay

明显更粗。

---

# 10. Tube Hierarchy

视觉粗细大致按照：

```text
Down Tube
≈
Head Tube

>

Top Tube
≈
Seat Tube

>

Chainstay

>

Seatstay
```

这不是固定像素值。

应根据当前 SVG scale 自动调整。

---

# 11. Front Fork

前叉必须明显像现代碟刹公路车前叉。

需要：

* 从 Head Tube Bottom 延伸
* 连接 Front Axle
* 有合理 rake
* 有一定实体宽度
* 与车架视觉语言一致

不要画成一根普通直线。

Endurance 前叉风格：

```text
自然
稳定
不过度夸张
略有厚度
```

---

# 12. Wheels

前后轮：

* 尺寸必须一致
* 轮胎外径一致
* 前后轮处于相同地面基线
* 具有 Tire + Rim 两层关系
* 可以使用极轻量 spokes
* 不需要复杂花鼓结构
* 不需要品牌 Logo
* 不需要写实胎纹

整体应该接近官方侧视产品图中的视觉比例。

不要出现：

* 前轮明显大于后轮
* 轮胎过粗
* 轮组像城市车
* 轮圈比例失真

---

# 13. Cockpit

Cockpit 包括：

```text
Stem
Handlebar
Brake Hood
```

弯把必须明显像：

**现代公路车 Drop Bar**

不要使用简单：

```text
L-shaped hook
```

模拟弯把。

建议将 Handlebar 设计成独立 SVG Path。

基本结构：

```text
Stem
→
Handlebar Top
→
Hood
→
Drop
```

Brake Hood 应自然衔接在弯把前端。

---

# 14. Saddle System

包含：

```text
Seatpost
Saddle
```

Saddle 应具有标准公路车座垫轮廓：

* 扁平
* 前窄后宽
* 不需要真实品牌造型

Seatpost 应：

* 从 Seat Tube 延伸
* 与 Seat Tube Angle 保持一致
* 支持 Saddle Height 调整

Saddle Setback 改变时：

坐垫 Contact Point 发生水平变化。

---

# 15. Drivetrain

需要提供简化但完整的：

```text
Crankset
Chainring
Crank Arm
Rear Cassette
Rear Derailleur
```

不要求机械级精度。

目的只是让用户第一眼能识别：

> 这是一辆完整的现代公路车。

不要让传动系统成为视觉中心。

---

# 16. Brake

默认使用：

**Disc Brake**

需要简化展示：

```text
Front Rotor
Rear Rotor
```

Rotor 可以使用简单圆形结构。

不需要：

* 卡钳复杂机械结构
* 品牌 logo
* 真实螺丝

---

# 17. Geometry Layer

Geometry Layer 只负责数学和关键节点。

建议关键节点至少包含：

```ts
bottomBracket
rearAxle
frontAxle

seatTubeTop

headTubeTop
headTubeBottom

saddleAnchor
saddleContactPoint

stemAnchor
handlebarContactPoint

pedalContactPoint
```

Geometry Layer 不负责：

* 管材视觉粗细
* Logo
* 颜色
* 轮圈样式
* 座垫外形
* 弯把外形

---

# 18. Visual Layer

Visual Layer 根据 Geometry Layer 输出的关键节点绘制：

```text
Frame
Fork
Wheel
Cockpit
Seatpost
Saddle
Crankset
Drivetrain
Brake
```

Visual Layer 可以根据 archetype 调整：

```text
tube thickness
tube shape
fork shape
seatpost shape
visual aggressiveness
```

但是不能改变真实 Geometry 的关键节点。

---

# 19. Important Architecture Rule

始终保持：

```text
Geometry
≠
Visual Style
```

例如：

同样：

```text
Reach = 380 mm
Stack = 590 mm
```

可以用不同的 Visual Archetype 表达。

但 Head Tube Top 的数学坐标应该保持一致。

---

# 20. Contact Points

系统未来主要关注三个接触点：

## Saddle Contact Point

用户骨盆 / 坐垫接触区域。

---

## Handlebar Contact Point

建议第一阶段定义为：

Brake Hood 主要握持位置。

不是：

Handlebar center。

---

## Pedal Contact Point

基于：

```text
Bottom Bracket
+
Crank Length
```

推导。

---

这三个 Contact Point 后续用于：

```text
Reference Bike
vs
Candidate Bike
```

适配比较。

---

# 21. Endurance Visual Preset

建议建立：

```ts
type BikeArchetype =
  | "endurance"
  | "all-round"
  | "aero";
```

当前：

```ts
endurance
```

应作为第一个高质量 preset。

例如：

```ts
const endurancePreset = {
  tubeStyle: "balanced",
  cockpitStyle: "standard-road",
  forkStyle: "endurance",
  seatpostStyle: "standard",
  visualAggressiveness: 0.35
};
```

实际结构可以根据现有项目调整。

不要为了匹配这个示例而制造无意义字段。

---

# 22. Future Archetypes

后续项目还会增加：

## All-Round / Climbing

综合 / 爬坡架。

参考特征：

* 比例均衡
* 更轻快
* 车头高度中等
* 传统 Race Bike 感更强
* 后三角更紧凑

---

## Aero

破风架。

参考特征：

* 更低趴
* 更强前伸视觉
* 管型更宽、更扁
* 前叉更粗
* 更强 Aero Tube 感
* 座管和后轮关系更紧密
* 更激进

---

请确保 Endurance 的代码结构未来能扩展到：

```text
endurance
all-round
aero
```

而不是为 Domane 单独写一套无法复用的代码。

---

# 23. Brand Independence

非常重要：

最终产品不属于 TREK。

TREK Domane 只是参考车型。

因此最终 Endurance Template：

禁止包含：

* TREK Logo
* DOMANE 字样
* 官方贴花
* 官方配色
* 官方品牌字体
* 官方 frame artwork

可以参考：

* 几何
* 比例
* 部件位置
* 侧视轮廓规律
* Endurance Bike 车型语言

---

# 24. Do Not Trace the Official Bike Image

不要直接：

```text
把官方整车图转换为 SVG
```

或者：

```text
沿官方图片路径逐像素描边
```

最终车模应该由：

```text
Geometry data
+
Reusable SVG components
+
Bike archetype preset
```

生成。

这样才能支持不同：

* Size
* Stack
* Reach
* Wheelbase
* Head Tube
* Stem
* Spacer
* Saddle

实时变化。

---

# 25. Reference Bike vs Candidate Bike

这套视觉系统未来必须支持：

```text
Reference Bike
+
Candidate Bike
```

Overlay。

因此：

* SVG Path 不要过度复杂
* 次要细节不要抢视觉
* 主车架轮廓必须非常清晰
* Reference 与 Candidate 可以改变 opacity
* 可以切换 line / fill 表现
* 可以隐藏轮组或次要部件
* 关键节点必须稳定

---

# 26. Visual Priority

BikeVisualizer 的视觉层级应该是：

## Level 1

车架主体

---

## Level 2

Wheel / Fork / Cockpit / Saddle

---

## Level 3

Geometry Dimension

例如：

```text
Stack
Reach
Wheelbase
```

---

## Level 4

Drivetrain / Rotor / Spokes

这些应该弱化。

---

# 27. Geometry Labels

Endurance 模板应该支持直接在车架周围显示：

```text
STACK
586 mm

REACH
382 mm

WHEELBASE
1014 mm
```

以及：

```text
Seat Tube Angle
Head Tube Angle
```

尺寸辅助线应：

* 轻量
* 克制
* 不遮挡车架主体

---

# 28. Geometry Data Is Source of Truth

任何视觉变化都不能自行修改 Geometry。

例如：

如果：

```text
wheelbase = 1014
```

Visual Layer 不可以为了让车更好看：

把 Front Axle 随意向前移动。

如果视觉比例看起来不自然：

应该先检查：

```text
Geometry calculation
Coordinate normalization
SVG scale
ViewBox
```

而不是直接手动偏移关键节点。

---

# 29. Missing Geometry Data

当某些字段缺失时：

不要让页面崩溃。

应：

1. 优先使用已有 Geometry
2. 对非关键视觉位置进行合理近似
3. 明确标记为 estimated
4. 不要把估算值当官方 Geometry

例如：

缺少 Fork Rake：

可以绘制简化前叉。

但不要修改：

```text
Stack
Reach
Wheelbase
```

这些已有真实数据。

---

# 30. Reference Data Policy

如果把 Domane 几何数据加入项目 Demo：

必须明确标记：

```text
Reference Data
```

或者：

```text
Source: provided geometry reference image
```

不要在无法验证年份 / 版本时：

擅自声明它是某一具体年份的官方完整数据。

---

# 31. Endurance Template Success Criteria

本次 Endurance Template 完成后，应满足：

### Geometry

* Stack 正确
* Reach 正确
* Wheelbase 正确
* Head Tube 位置正确
* Seat Tube 方向正确
* Axle 位置正确

### Visual

* 明显是一辆现代公路车
* 明显具有 Endurance 特征
* 不是抽象粗线车
* 不像城市自行车
* 不像山地车
* 弯把自然
* 座垫自然
* 前叉自然
* 轮组比例自然
* 传动结构完整但克制

### Architecture

* Geometry 与 Visual 分离
* 支持未来换 Size
* 支持未来 Overlay
* 支持 future archetype
* 不绑定 TREK 品牌

---

# 32. Current Development Priority

当前优先级：

```text
P0
Geometry accuracy

P0
Endurance bike visual quality

P0
Bike proportions

P0
SVG reusable structure

P1
Cockpit adjustment

P1
Saddle adjustment

P1
Overlay

P2
Rider skeleton

P2
OCR

P2
AI recommendation
```

不要为了实现 P2 功能降低自行车主视觉质量。

---

# 33. Current Scope

本轮只把 Endurance 做好。

不要因为已经预留：

```text
all-round
aero
```

就自行生成大量未经参考验证的车型资产。

后续会继续提供：

* 综合爬坡架 Geometry Reference
* 综合爬坡架 Side View Reference
* Aero Geometry Reference
* Aero Side View Reference

收到这些资料后再分别优化。

---

# 34. Final Product Principle

Bike Geometry Fit 不是：

> 一个画自行车的网站。

它是：

> 一个使用正确几何数据驱动标准公路车模型，并通过可视化比较辅助用户进行车型和尺码购买决策的工具。

因此：

```text
Geometry accuracy
+
Visual readability
+
Bike realism
+
Comparison capability
```

四项同等重要。

---

# 35. Implementation Reminder for Codex

修改 Endurance Bike 模板时：

1. 先检查现有 Geometry 计算
2. 不要直接推翻已有正确的 Stack / Reach 逻辑
3. 将 Geometry 与 Visual Layer 分离
4. 使用提供的 Geometry Image 校验结构
5. 使用 Side View Image 校验轮廓
6. 不复制品牌资产
7. 完成后验证不同 Size 数据是否能正确驱动车架变化
8. 执行项目测试
9. 执行 production build
10. 最后说明哪些数据来自参考图、哪些仍为近似值


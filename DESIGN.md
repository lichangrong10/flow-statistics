# DESIGN.md · 单色社论设计系统

> 投流统计平台 · 用户端 + 管理端共用
> 版本 2.0（2026-11-23）
> 关键字：克制、社论、单色、发际线、无装饰

---

## 1 设计主张

1. **只用黑 / 灰 / 白**。所有文本、图标文字、标签文字都在中性斜坡上取值；语义色只作为 **8px 圆点、图标、图表线条、进度填充**，绝不用于文本。
2. **用层级代替装饰**。靠字号、字重、字距、留白和对齐建立秩序；不使用渐变、玻璃拟态、投影、胶囊。
3. **发际线系统**。所有分界用 `1px` 边框（暖灰），卡片、表格、分区、弹层统一；不靠阴影区分层级。
4. **方角**。圆角上限 `4px`，标签/按钮/输入统一 `2px`。
5. **编辑感**。大字号标题、宽字距小标签、等宽数字与 ID、克制的留白。

---

## 2 设计令牌

实现：`src/styles/tokens.css`，暗色覆盖 `[data-theme='dark']`。

### 2.1 中性斜坡（暖灰）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--ink-0` | `#FFFFFF` | `#171716` | 卡片表面 |
| `--ink-25` | `#FBFAF7` | `#121211` | 页面底色 |
| `--ink-50` | `#F7F6F3` | `#1D1C19` | 次级填充、表头 |
| `--ink-75` | `#F2F0EB` | `#232220` | 悬停、分隔弱背景 |
| `--ink-100` | `#E9E6DF` | `#2B2A27` | 发际线（浅） |
| `--ink-200` | `#DCD8CF` | `#383631` | 边框 |
| `--ink-300` | `#C9C4B9` | `#4D4A44` | 弱图标 |
| `--ink-400` | `#A8A298` | `#6E6A62` | 占位符 |
| `--ink-500` | `#858076` | `#8F8A80` | 三级文字（暗色） |
| `--ink-600` | `#67635B` | `#A8A298` | 三级文字（明色，AA） |
| `--ink-700` | `#4B4943` | `#C9C4B9` | 二级文字 |
| `--ink-800` | `#33312D` | `#E2DED6` | 强调面 |
| `--ink-900` | `#1F1E1B` | `#EFEDE8` | 主按钮悬停 |
| `--ink-950` | `#111110` | `#F5F4F1` | 主文字、主按钮 |

### 2.2 语义色（仅限点 / 图标 / 图表线 / 进度填充）

| Token | 值 | 用途 |
|---|---|---|
| `--signal-live` | `#C0392B` | 直播/进行中标识点 |
| `--signal-ok` | `#2F7D4F` | 正常、达成、在线点 |
| `--signal-warn` | `#B7791F` | 警告点、命中率 |
| `--signal-danger` | `#B42318` | 错误点、失败状态 |
| `--signal-info` | `#2F5D8A` | 信息点、对比序列 |

> 规则：**禁止**把以上颜色用于 `color:`；只能用于 `background`（圆点/进度）、SVG `stroke/fill`、ECharts `lineStyle/itemStyle`。

### 2.3 字体

| 级别 | Token | 字号 / 行高 | 用途 |
|---|---|---|---|
| Display | `--font-size-display` | 56 / 1.12 | 登录品牌主张 |
| Page title | `--font-size-page-title` | 28 / 34 | 页面标题 |
| Metric L | `--font-size-metric-lg` | 40 / 44 | 大数字（预留） |
| Metric | `--font-size-metric` | 28 / 36 | KPI 数值 |
| Section | `--font-size-section` | 20 / 28 | 区块标题 |
| Card | `--font-size-card` | 16 / 24 | 卡片标题 |
| Body | `--font-size-body` | 14 / 22 | 正文 |
| Aux | `--font-size-aux` | 12 / 18 | 辅助信息 |
| Micro | `--font-size-micro` | 11 / 16 | 标签、表头、脚注 |

- 中文：`Microsoft YaHei / PingFang SC / Hiragino Sans GB`。
- 等宽：`--font-mono`（`SFMono-Regular / JetBrains Mono / Consolas`），用于单号、ID、时间戳、流键、版本号。
- 数字统一 `font-variant-numeric: tabular-nums`。
- 小标签使用 `letter-spacing: 0.08em` + 大写字形（表头、KPI 标签）。

### 2.4 间距 / 圆角 / 边框 / 运动

| 项 | 值 |
|---|---|
| 间距基数 | 4px（4/8/12/16/24/32/40/56） |
| 页面边距 | 24px（≤1279px 时 16px） |
| 卡片内边距 | 20px |
| 表格行高 | 48px |
| 圆角 | `2px`（标签/输入/按钮）、`4px`（卡片/弹层），上限 4px；开关单独使用胶囊 + 圆形滑块 |
| 边框 | 1px 发际线：`--color-border` / `--color-border-light` |
| 阴影 | 全部 `none`（`--shadow-*` 置空） |
| 渐变 | 全部禁用（图表面积填充为纯色 8% 透明度） |
| 动效 | 120–160ms，`prefers-reduced-motion` 下关闭 |

---

## 3 壳体

| 区域 | 规格 |
|---|---|
| 侧边栏 | 248px；折叠 64px；`#111110` 纯色，1px 右边框；无渐变/阴影 |
| 顶栏 | 56px；白底（暗色 `#171716`）；1px 底边框；含面包屑、数据时间、主题切换、管理员账号 |
| 内容区 | 最大 1440px，居中；24px 边距；12 栅格（`.grid-12`，间距 16px） |
| 导航 | 40px 行高；激活项 2px 左侧白条；徽标为白底黑字方角 |
| 移动 | ≤900px 侧栏收为 64px 仅图标；项目选择与账号信息隐藏；KPI 单列/两列 |

**登录（唯一入口）**：

- `/admin/login`：管理员登录，左侧近黑品牌陈述（40px 主张），右侧 **480px** 登录面板；不使用方形 Logo，单色、无渐变、无阴影。
- `/login` 仅作为旧地址跳转到 `/admin/login`；不存在普通用户登录页。
- 未登录访问任意业务页或 `/admin` 自动跳 `/admin/login?redirect=...`；非管理员账号登录会被拒绝。
- ≤900px 隐藏品牌陈述，登录面板占满。
- 顶栏不再显示首字头像、项目选择和重复的连接状态；账号以文字 + 下拉箭头呈现。

**管理端**：`/admin` 挂在同一壳体下，四个页签共用 PageHeader / 表格 / 表单；只有管理员登录，侧栏可见「系统管理」。

---

## 4 组件库

实现：`src/components/` + `src/styles/global.css`（Element Plus 单色化）。

| 组件 | 规范 |
|---|---|
| Button | 主按钮黑底白字；次按钮透明+发际线；危险/警告也走中性，不使用彩色文字；圆角 2px。按钮组横向间距 12px、换行后行距 8px；表格行内文字按钮 14px；弹窗底部 12px |
| Input / Select / Textarea | 1px 内描边，2px 圆角；聚焦 1px 实线黑（暗色白），无光晕 |
| Checkbox / Radio / Switch | 选中用 `--ink-950`（暗色反转为浅色）；开关为胶囊 + 圆形滑块 |
| Tabs | 1px 指示条，激活黑/白粗体；`DimensionTabs` 为发际线分段控件 |
| Table | 表头 11px 大写宽字距、`--ink-50` 底、1px 下边框；行高 48；无斑马纹。计划表：单号并入计划名称、曝光量合并为「实际 / 计划」、排期单行、厂商显示数量+悬停名单、操作列独立发际线 |
| Pagination | 方角页码，选中黑底白字（暗色反转） |
| Tag / Badge | 全部单色发际线标签；状态用 `StatusTag`（8px 语义点 + 中性文字） |
| Tooltip / Dropdown / Modal / Drawer / Toast | 1px 边框、2px 圆角、无阴影；遮罩 `rgba(17,17,16,.4)` |
| Empty / Skeleton | 单色线稿；骨架为纯色脉冲（无渐变） |
| Steps / Progress | 步骤用中性；进度条纯黑填充（暗色白） |
| KpiCard | 11px 大写标签 + 28px 数字 + 8px 语义点环比；可点击卡片只改发际线深浅 |
| Charts | 轴/网格/图例中性；序列用语义色；面积填充纯色 8%；无渐变 |

**数据页状态**：每个数据页统一提供加载（骨架）、空（EmptyState）、错误（提示 + 重试入口）、网络异常（请求层提示）；暗色下自动继承。

---

## 5 暗色模式

- 入口：顶栏月亮/太阳按钮；首次跟随系统，手动切换后写入 `localStorage['adflow.theme']`。
- 机制：`html[data-theme]` + CSS 变量；Element Plus 变量同步覆盖。
- 图表：`chartColors()` 在运行时读取 CSS 变量，并通过 App Store 的 `theme` 形成响应式依赖，切换后自动重绘。
- 截图：见 `docs/theme-shots/*-dark.png`。

---

## 6 可达性

- 正文/次级文字对比度 ≥ 4.5:1（三级文字在明色下提升到 `--ink-600`）。
- 全局 `:focus-visible` 2px 实线焦点环 + 2px 偏移。
- 图标按钮带 `aria-label`（主题切换、折叠等）；表单使用显式标签。
- `prefers-reduced-motion` 下禁用动画与过渡。
- 颜色不作为唯一信息载体：状态同时有文字，语义点仅为辅助。

---

## 7 页面模板与截图

所有截图：`docs/theme-shots/`（1440×900 桌面、390×844 移动）。

| 页面 | 明色 | 暗色 |
|---|---|---|
| 管理员登录 | `admin-login-desktop-light.png` / `admin-login-mobile-light.png` | `admin-login-desktop-dark.png` / `admin-login-mobile-dark.png` |
| 工作台 | `dashboard-desktop-light.png` / `dashboard-mobile-light.png` | `dashboard-desktop-dark.png` / `dashboard-mobile-dark.png` |
| 投放计划 | `campaign-list-desktop-light.png` / `campaign-list-mobile-light.png` | `campaign-list-desktop-dark.png` / `campaign-list-mobile-dark.png` |
| 投放详情 | `campaign-detail-desktop-light.png` | `campaign-detail-desktop-dark.png` |
| 数据回收 | `stats-desktop-light.png` | `stats-desktop-dark.png` |
| 数据看板 | `board-desktop-light.png` | `board-desktop-dark.png` |
| 报表中心 | `report-desktop-light.png` | `report-desktop-dark.png` |
| 系统管理·管理员账号 | `admin-users-desktop-light.png` | `admin-users-desktop-dark.png` |

---

## 8 代码映射

| 内容 | 文件 |
|---|---|
| 令牌 | `src/styles/tokens.css` |
| 全局与 Element Plus 单色化 | `src/styles/global.css` |
| 壳体（侧栏/顶栏/主题切换） | `src/layouts/DefaultLayout.vue` |
| 主题状态 | `src/stores/app.ts`、`src/App.vue` |
| 图表主题与语义色 | `src/utils/chart.ts` |
| 通用组件 | `src/components/*.vue` |
| 管理端页签 | `src/views/admin/**`、`src/admin/**` |

---

## 9 与原始 brief 的差异

| brief 要求 | 本项目处理 |
|---|---|
| 直播平台页面（直播网格、频道播放器、RTMP 设置、边缘节点、转码模板、订单、审核、告警） | 本次只改现有投流平台页面，不新建直播业务页面（已确认范围） |
| 管理员登录独立 `/admin/login`、384px 面板 | 已实现独立布局；按反馈把右侧面板加大到 480px，无方形 Logo |
| 播放器外壳、频道卡片等组件 | 不适用，未实现 |
| 桌面 + 移动明暗截图 | 已提供 24 张（管理员登录、业务页面 7 个、管理端 2 页，桌面/移动、明/暗） |
| AA 对比度 | 文字对比度已按 AA 调整；极端小字（11px）建议仅在辅助信息使用 |


### 暗色下的 Element Plus 覆盖

除全局令牌外，以下组件在 `[data-theme='dark']` 下单独覆盖，避免出现「白底白字」：

- `el-switch`：轨道、圆点、内嵌启用/停用文字；
- `el-radio-button`：选中态背景、边框、文字（报表格式、每页条数）；
- `el-checkbox` / `el-radio`：选中勾与圆点；
- `el-pagination`：当前页数字、前后箭头与禁用态；
- `el-date-table`：选中/起止/今天/区间日期；
- `el-alert`、`el-popover`、`el-notification`、`el-loading-mask`：背景统一为暗色表面；
- 禁用按钮：不再使用整体透明度，改为中性底 + 三级文字。

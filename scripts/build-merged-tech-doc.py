import importlib.util
from pathlib import Path
from docx.shared import Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

BASE = Path(r"E:\投流统计平台")
OUT = BASE / "docs" / "交付材料"
OUT.mkdir(parents=True, exist_ok=True)

spec = importlib.util.spec_from_file_location(
    "docgen", BASE / "scripts" / "generate-delivery-docs.py"
)
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

doc = g.setup_document("技术方案", "投流统计平台")
g.add_cover(
    doc,
    "投流统计平台",
    "技术方案  ·  前后端一体化  ·  PC / 平板 / 移动三端",
    [
        ("项目名称", "投流统计平台"),
        ("文档类型", "技术方案"),
        ("文档版本", "V1.0"),
        ("编制日期", "2026-11-25"),
        ("编制单位", "投流统计平台项目组"),
        ("文档状态", "交付版"),
    ],
    "",
)

g.add_toc(doc, [
    "1  项目概述",
    "2  总体架构",
    "3  技术选型",
    "4  功能模块设计",
    "5  关键业务规则",
    "6  接口设计",
    "7  数据模型",
    "8  自动任务与运行配置",
    "9  设计系统与响应式适配",
    "10  安全、性能与稳定性",
    "11  部署与运维",
    "12  交付物",
])

# 1 项目概述
g.add_heading(doc, "1  项目概述", 1)
g.add_heading(doc, "1.1  建设背景", 2)
g.add_body(doc, "投流统计平台面向 2026 年太仓分公司全域融数智能投放服务，覆盖投放计划、项目预算、厂商与渠道、数据回收、经营看板、结案报表和系统管理。平台采用前后端一体化架构，为管理员提供统一的投放业务操作入口。")
g.add_heading(doc, "1.2  建设目标", 2)
for text in [
    "统一管理入口：管理员在同一系统内完成计划、项目、厂商、渠道、数据与报表工作。",
    "业务闭环：从计划创建、排期发布、数据回收到报表导出形成完整流程。",
    "状态可信：计划按开始日期进入排期或直接投放，到期由后端自动发布。",
    "数据一致：项目、计划、预算和报表使用统一口径，接口字段统一适配。",
    "多端可用：PC、平板、移动端保持一致的业务能力与操作体验。",
]:
    g.add_bullet(doc, text)
g.add_heading(doc, "1.3  系统范围", 2)
g.add_body(doc, "系统范围为投流统计平台管理端，包含 Web 前端、后端服务和关系型数据库。前端负责页面交互与数据展示，后端负责业务规则、状态流转、权限、接口和自动任务。")
g.add_data_table(doc, ["范围", "内容"], [
    ["前端", "管理员端页面、表单、表格、图表、响应式与主题"],
    ["后端", "Fastify 服务、接口、状态机、权限、自动任务、报表生成"],
    ["数据", "MySQL 业务数据、报表文件存储、审计日志"],
], [3.0, 13.1], 9)
g.add_heading(doc, "1.4  术语说明", 2)
g.add_data_table(doc, ["术语", "含义"], [
    ["项目管理", "管理项目名称、甲方、周期与总预算，并汇总已用、剩余预算"],
    ["投放计划", "一次广告投放任务，包含项目、渠道、人群、预算、排期和目标曝光量"],
    ["已排期", "计划已完成发布前配置，等待开始日期，尚未生成投放单号"],
    ["自动发布", "到达开始日期后由后台任务发布计划并生成投放单号"],
    ["审计日志", "记录计划状态变更、项目与厂商维护等关键操作"],
], [3.4, 12.7], 9)

# 2 总体架构
g.add_heading(doc, "2  总体架构", 1)
g.add_heading(doc, "2.1  系统架构", 2)
g.add_body(doc, "系统采用前后端分离架构。管理员通过浏览器访问 Vue 单页应用，页面经 Nginx 统一访问后端 API；后端使用 Fastify 提供 REST 接口，MySQL 保存业务数据，报表文件存放在服务端存储目录。")
arch = doc.add_table(rows=1, cols=1)
arch.style = "Table Grid"
g.set_table_borders(arch)
cell = arch.rows[0].cells[0]
g.shade_cell(cell, g.LIGHT)
cell.text = ""
lines = [
    "管理员浏览器（PC / 平板 / 移动）",
    "        │  HTTPS",
    "Vue 3 SPA（Router / Pinia / Views / Components）",
    "        │  /api/v1",
    "Nginx 反向代理",
    "        │",
    "Fastify 5 应用（鉴权 / 业务 / 报表 / 定时任务）",
    "        │",
    "MySQL 8  +  报表文件存储",
]
for i, line in enumerate(lines):
    p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
    g.fmt_para(p, before=0, after=2, line=1.25, align=WD_ALIGN_PARAGRAPH.LEFT)
    r = p.add_run(line)
    g.set_run_font(r, "Consolas", 8.8, False, g.INK)
doc.add_paragraph().paragraph_format.space_after = Cm(0.1)

g.add_heading(doc, "2.2  后端分层", 2)
g.add_body(doc, "后端按职责分层，接口层、业务层、数据访问层与领域规则相互独立，便于维护状态机、预算和权限等核心规则。")
g.add_data_table(doc, ["层次", "职责"], [
    ["routes", "参数校验、接口文档、权限校验"],
    ["services", "业务规则、事务、状态流转"],
    ["repositories", "SQL 查询与行映射"],
    ["domain", "状态机、指标口径、单号规则"],
    ["plugins", "鉴权、定时任务、错误处理、接口文档"],
], [3.4, 12.7], 9)

g.add_heading(doc, "2.3  前端结构", 2)
g.add_data_table(doc, ["目录", "职责"], [
    ["src/api", "请求封装、接口映射、业务 API"],
    ["src/components", "指标卡、状态标签、渠道图标、图表、数据表格等通用组件"],
    ["src/constants", "状态、渠道、目标、出价方式、报表类型等常量"],
    ["src/layouts", "侧边导航、顶栏、主题切换"],
    ["src/router", "路由表、管理员守卫"],
    ["src/stores", "登录用户、项目与字典、主题与侧栏状态"],
    ["src/styles", "设计令牌、全局样式、组件主题覆盖"],
    ["src/views", "工作台、计划、回收、看板、报表、系统管理"],
], [3.4, 12.7], 9)

g.add_heading(doc, "2.4  运行环境", 2)
g.add_data_table(doc, ["项目", "配置"], [
    ["前端", "Chrome / Edge 最新版本，支持 ES2020、CSS Grid"],
    ["后端", "Node.js 18 及以上，Fastify 5"],
    ["数据库", "MySQL 8，mysql2 连接池"],
    ["接口文档", "OpenAPI / Swagger UI，服务路径 /api-docs"],
    ["报表存储", "服务端 storage/reports 目录"],
    ["管理员账号", "admin / Admin123#"],
], [3.6, 12.5], 9)

# 3 技术选型
g.add_heading(doc, "3  技术选型", 1)
g.add_data_table(doc, ["层次", "技术", "用途"], [
    ["前端框架", "Vue 3.5 + TypeScript 5.4", "组合式 API、严格类型约束"],
    ["构建工具", "Vite 5.2", "开发服务、生产构建、代理"],
    ["路由与状态", "Vue Router 4.6 + Pinia 2.1", "页面路由、登录态、项目与字典状态"],
    ["UI 组件", "Element Plus 2.14", "表单、表格、弹窗、分页、消息"],
    ["图表", "ECharts 5.5", "工作台、看板、详情趋势"],
    ["后端框架", "Fastify 5", "REST 接口、插件、校验"],
    ["数据库", "MySQL 8 + mysql2", "业务数据与查询"],
    ["鉴权", "JWT（HS256）+ bcrypt", "登录、令牌校验、密码存储"],
    ["报表", "ExcelJS", "xlsx 报表生成"],
    ["接口文档", "OpenAPI / Swagger UI", "接口说明与联调"],
], [2.8, 5.6, 7.7], 9)

# 4 功能模块设计
g.add_heading(doc, "4  功能模块设计", 1)
g.add_heading(doc, "4.1  登录与鉴权", 2)
g.add_body(doc, "平台采用管理员单入口。登录接口返回 JWT，前端在请求中统一携带 Authorization: Bearer <token>；令牌过期前通过 refresh 续期，令牌失效或账号被停用时清理会话并返回登录页。")
g.add_data_table(doc, ["能力", "管理员", "说明"], [
    ["业务页面查看与操作", "✓", "计划、项目、数据、看板、报表"],
    ["系统管理", "✓", "管理员账号、项目、厂商、字典、日志"],
], [6.2, 2.2, 6.7], 9)

g.add_heading(doc, "4.2  工作台", 2)
g.add_body(doc, "工作台展示计划曝光量、实际曝光量、曝光完成率、曝光人数、点击率和在投计划六项指标，支持近 7/14/30 天切换，并提供曝光趋势、渠道占比和最近更新数据。")

g.add_heading(doc, "4.3  投放计划", 2)
g.add_body(doc, "投放计划列表聚合全部项目，支持按名称、投放单号、渠道和周期筛选，提供全部、草稿、已排期、投放中、已暂停、已结束、已结案分类，支持分页、批量导出和批量归档。")
g.add_body(doc, "新建计划采用四步向导：基础信息、人群定向、排期预算、确认发布。开始日期未到时进入已排期；开始日期已到或为当天时直接发布。已排期计划不提供手动发布入口，由后台任务在开始日期自动发布。")

g.add_heading(doc, "4.4  计划详情与数据回收", 2)
g.add_body(doc, "计划详情包含概览、分日数据、人群分布、素材和操作记录。数据回收支持按计划手工录入指标、按日期调整、Excel 导入和同步；未开始计划执行同步时返回明确提示。")
g.add_body(doc, "录入校验包括：日期在计划排期内、曝光人数不超过曝光量、点击人数不超过曝光人数、人群维度合计与当日曝光一致；数据调整需填写调整理由。")

g.add_heading(doc, "4.5  项目、厂商与渠道", 2)
g.add_body(doc, "项目管理维护项目名称、甲方、周期和总预算，并统计已用与剩余预算；厂商管理维护编码、名称、平台、联系人、状态与关联计划；渠道管理维护渠道编码、名称、状态及关联计划。停用厂商和渠道不可被新计划选择，被计划引用的厂商不可删除。")

g.add_heading(doc, "4.6  数据看板与报表", 2)
g.add_body(doc, "数据看板按日期与维度切换，提供省级地域分布、性别分布、年龄分布表格，展示曝光次数、曝光人数、点击人数和点击率，支持自定义列、xlsx 下载和总计展示；底部显示数据更新时间与记录数。报表中心支持日报、周报、结案报告和数据明细，统一生成 xlsx，支持批量选择和计划、项目过滤。")

g.add_heading(doc, "4.7  系统管理与审计", 2)
g.add_body(doc, "系统管理包含管理员账号、项目管理、厂商管理、字典配置、操作日志五个页签。操作日志记录对象类型、操作人、动作和时间；自动发布等系统动作的操作人显示为「系统」。")

# 5 规则
g.add_heading(doc, "5  关键业务规则", 1)
g.add_heading(doc, "5.1  计划状态机", 2)
g.add_data_table(doc, ["当前状态", "动作", "目标状态"], [
    ["draft", "发布（开始日期未到）", "scheduled"],
    ["draft", "发布（开始日期已到）", "running"],
    ["scheduled", "到达开始日期，自动发布", "running"],
    ["scheduled", "过期未执行", "finished"],
    ["running", "暂停", "paused"],
    ["paused", "恢复", "running"],
    ["running / paused", "结束", "finished"],
    ["finished", "结案", "closed"],
], [4.4, 7.2, 4.5], 9)
g.add_body(doc, "只有草稿可编辑、删除；计划开始日期未到时不会提前进入投放，也不生成单号；重复发布保持幂等，不重复生成单号；项目预算超出时不能发布。")

g.add_heading(doc, "5.2  排期自动发布", 2)
g.add_body(doc, "后台任务每 60 秒检查已排期计划：到达开始日期且预算满足时生成单号、转为投放中、写入发布时间并记录 auto_publish 审计；结束日期已过则转为已结束并记录 auto_finish_expired。任务使用数据库锁和单计划行锁，避免多实例重复发布。")
g.add_body(doc, "项目下未删除计划的预算合计超过项目总预算时，发布返回 2003，计划保持已排期；调整项目或计划预算后，下一轮任务可继续。")

g.add_heading(doc, "5.3  目标曝光量与预算", 2)
g.add_body(doc, "目标曝光量为整数，最低 1,000 次，最高 100,000,000 次；同时按总预算与千人曝光成本 12 元计算预算上限。项目总预算不得超过项目剩余可用金额，计划总预算不得小于日预算。")

g.add_heading(doc, "5.4  全部项目视图", 2)
g.add_body(doc, "管理员的工作台、计划、看板、报表默认覆盖全部项目；项目用于创建计划时选择。系统管理中的项目管理负责项目基础资料与预算维护。")

# 6 接口
g.add_heading(doc, "6  接口设计", 1)
g.add_heading(doc, "6.1  通用约定", 2)
g.add_body(doc, "接口统一使用 /api/v1 前缀，响应包含 code、message、data、traceId；分页参数 page、pageSize，pageSize 最大 200；日期格式 YYYY-MM-DD；ID 与金额按字符串返回，避免精度丢失。")
g.add_data_table(doc, ["错误码", "HTTP", "含义"], [
    ["0", "200", "成功"],
    ["1001", "400", "参数校验失败"],
    ["1002", "401", "未登录或令牌失效"],
    ["1003", "403", "无权限"],
    ["1004", "404", "资源不存在"],
    ["2001", "409", "状态不允许"],
    ["2002", "409", "名称或编码重复"],
    ["2003", "409", "项目预算超出"],
    ["2004", "409", "厂商被计划引用"],
    ["2005", "409", "厂商已停用"],
    ["3001", "400", "导入文件格式错误"],
    ["3002", "422", "导入数据校验失败"],
    ["3003", "422", "数据参数超出范围"],
    ["5000", "500", "服务内部错误"],
], [2.2, 2.2, 10.7], 8.8)

g.add_heading(doc, "6.2  主要接口", 2)
g.add_data_table(doc, ["模块", "方法与路径", "说明"], [
    ["登录", "POST /auth/login；GET /auth/profile；POST /auth/refresh；POST /auth/logout", "登录、当前账号、续期、退出"],
    ["看板", "GET /dashboard/summary；GET /dashboard/trend；GET /dashboard/dimensions；GET /dashboard/channels", "指标、趋势、人群、渠道"],
    ["项目", "GET/POST /projects；GET/PUT /projects/{id}", "项目列表、详情、新增、修改"],
    ["厂商", "GET/POST /vendors；GET/PUT/DELETE /vendors/{id}；GET /vendors/active", "厂商维护"],
    ["渠道", "GET/POST /channels；GET/PUT/DELETE /channels/{id}；GET /channels/active", "渠道维护"],
    ["计划", "GET/POST /campaigns；GET/PUT/DELETE /campaigns/{id}", "计划列表、创建、详情、修改、删除草稿"],
    ["状态", "POST /campaigns/{id}/publish|pause|resume|finish|close", "发布、暂停、恢复、结束、结案"],
    ["厂商关联", "GET/PUT /campaigns/{id}/vendors", "计划已选厂商"],
    ["数据", "GET/POST/PATCH/DELETE /campaigns/{id}/stats；GET /campaigns/{id}/dimensions；POST /campaigns/{id}/sync", "分日数据、维度、同步"],
    ["导入", "POST /stats/import；GET /stats/import/template", "Excel 导入与模板"],
    ["报表", "GET/POST /reports；GET /reports/{id}/download", "创建、列表、下载 xlsx"],
    ["字典", "GET /dicts", "渠道、年龄、兴趣、指标口径"],
    ["审计", "GET /logs；GET /sync-tasks", "审计日志、同步任务"],
], [2.4, 8.3, 5.4], 7.8)

g.add_heading(doc, "6.3  前端集成约定", 2)
for text in [
    "登录后保存 JWT，所有请求携带 Authorization: Bearer；",
    "401 时清理登录态并跳转登录页；",
    "列表分页使用 page / pageSize，单页最大 200；",
    "发布失败重点处理 2003（预算超出）与 409（状态不允许）；",
    "金额、ID 按字符串展示，避免精度丢失；",
    "报表下载按二进制响应处理。",
]:
    g.add_bullet(doc, text)

# 7 数据模型
g.add_heading(doc, "7  数据模型", 1)
g.add_heading(doc, "7.1  主要数据表", 2)
g.add_data_table(doc, ["表", "说明"], [
    ["sys_user", "用户与管理员、令牌版本"],
    ["project", "项目、周期与预算"],
    ["vendor", "厂商"],
    ["channel", "渠道"],
    ["campaign", "投放计划、状态、单号、预算"],
    ["campaign_vendor", "计划与厂商关联"],
    ["creative", "素材"],
    ["daily_stat", "分日指标"],
    ["dim_stat", "分日人群维度"],
    ["audit_log", "审计日志"],
    ["sync_task", "同步任务"],
    ["report_task", "报表任务"],
], [3.6, 12.5], 9)
g.add_heading(doc, "7.2  关键索引", 2)
for text in [
    "campaign.uk_code：投放单号唯一；",
    "campaign.idx_status_date：自动发布扫描；",
    "campaign.idx_project_status：项目筛选；",
    "daily_stat(campaign_id, stat_date)：分日数据幂等；",
    "dim_stat(campaign_id, stat_date, dim_type, dim_value)：维度查询。",
]:
    g.add_bullet(doc, text)
g.add_heading(doc, "7.3  字段约定", 2)
g.add_body(doc, "ID 与金额统一以字符串传输，日期统一为 YYYY-MM-DD；状态值使用固定枚举，前端通过适配层转换为页面状态与展示文案。")

# 8 自动任务
g.add_heading(doc, "8  自动任务与运行配置", 1)
g.add_heading(doc, "8.1  自动发布任务", 2)
g.add_body(doc, "后台任务默认每 60 秒执行一次，扫描已排期计划并按开始日期发布；已过期计划自动结束。任务记录审计日志，操作人为「系统」，并通过数据库锁保证幂等。")
g.add_heading(doc, "8.2  运行配置", 2)
g.add_data_table(doc, ["变量", "默认值", "说明"], [
    ["AUTO_PUBLISH_ENABLED", "true", "排期自动发布开关"],
    ["AUTO_PUBLISH_INTERVAL_MS", "60000", "自动发布检查间隔"],
    ["REPORT_DIR", "storage/reports", "报表文件目录"],
], [6.0, 4.0, 6.1], 9)
g.add_heading(doc, "8.3  健康检查", 2)
g.add_body(doc, "服务提供 /health 与 /api/v1/health 健康检查接口，用于检查服务进程与数据库连接状态，可接入部署平台的探活与告警。")

# 9 设计系统
g.add_heading(doc, "9  设计系统与响应式适配", 1)
g.add_heading(doc, "9.1  视觉规范", 2)
for text in [
    "单色社论风：1px 发际线、无阴影与渐变、小圆角；",
    "语义色仅用于状态点、进度和图线，渠道使用官方品牌色；",
    "表格内容居中，操作列不悬浮遮挡；暗色主题覆盖 Element Plus 组件；",
    "图例统一为圆点，数字使用等宽数字，长文本省略并提供 tooltip。",
]:
    g.add_bullet(doc, text)
g.add_heading(doc, "9.2  三端断点", 2)
g.add_data_table(doc, ["端", "宽度", "布局行为"], [
    ["PC", "≥1280px", "侧栏 248px，KPI 3 列，表格完整展示"],
    ["平板", "768–1279px", "内容边距 16px，双栏合并单列，表格内部横向滚动"],
    ["移动", "≤767px", "侧栏 64px，筛选单列，状态标签换行，分页精简"],
], [2.4, 4.0, 9.7], 9)
g.add_body(doc, "辅助断点为 900px（侧栏收起、图表合并单列）和 560px（KPI 单列）。宽表格的横向滚动限定在表格容器内部，页面保持单方向滚动。")
g.add_heading(doc, "9.3  关键适配", 2)
for text in [
    "表格：统一滚动容器，计划表最小 1100px，通用表 980px，管理端 1120px；",
    "向导：移动端步骤条 2×2，表单单列，渠道 2 列；",
    "筛选与分页：移动端单列筛选、查询/重置整行，分页保留前后页与页码；",
    "图表：容器尺寸就绪后初始化，移动端图例换行、坐标轴稀疏显示。",
]:
    g.add_bullet(doc, text)

# 10 安全性能
g.add_heading(doc, "10  安全、性能与稳定性", 1)
g.add_heading(doc, "10.1  安全", 2)
for text in [
    "密码使用 bcrypt 存储，不在前端保存密码；",
    "JWT 载荷包含账号、角色与令牌版本，请求时回查账号状态；",
    "账号停用、改密或重置密码后旧令牌立即失效；",
    "管理端写接口要求 admin 角色，前端路由守卫同步校验登录态。",
]:
    g.add_bullet(doc, text)
g.add_heading(doc, "10.2  性能", 2)
for text in [
    "列表接口统一分页，单页最大 200，避免一次加载过量数据；",
    "关键查询建立状态、日期、项目与维度索引；",
    "前端路由与系统管理页签按需加载，报表导出按需引入 SheetJS；",
    "图表在容器尺寸就绪后初始化，避免首屏空白或尺寸异常。",
]:
    g.add_bullet(doc, text)
g.add_heading(doc, "10.3  稳定性", 2)
g.add_body(doc, "接口统一错误处理并返回 traceId，便于定位问题；任务使用数据库锁保证幂等；前端对状态与渠道字段做空值兜底，图表初始化前校验可见性与尺寸，保证页面稳定渲染。")

# 11 生产部署与运维
doc.add_page_break()
g.add_heading(doc, "11  生产部署与运维", 1)
g.add_heading(doc, "11.1  生产部署拓扑", 2)
g.add_body(doc, "生产环境按接入层、应用层、数据层分离部署。接入层负责 HTTPS、静态资源和反向代理；应用层运行 Fastify 服务；数据层使用 MySQL 8；报表文件存放在持久化存储；监控、日志、备份由运维体系统一管理。")
g.add_data_table(doc, ["层次", "生产配置", "职责"], [
    ["接入层", "Nginx / 负载均衡，HTTPS 证书", "静态资源、反向代理、访问控制"],
    ["应用层", "Node.js 18+、Fastify 5，多实例部署", "接口、鉴权、自动任务"],
    ["数据层", "MySQL 8 主库与备份；报表文件持久化存储", "业务数据、报表文件与审计记录"],
], [2.6, 6.8, 6.7], 9)

g.add_heading(doc, "11.2  接入层与前端发布", 2)
for text in [
    "Nginx 启用 HTTPS，统一提供前端静态资源和 /api/ 反向代理，后端服务不直接暴露公网端口；",
    "前端构建产物按版本发布到独立目录，index.html 禁止强缓存，带哈希的静态资源设置长期缓存；",
    "单页应用配置 history 路由回退到 index.html，避免刷新业务页面出现 404；",
    "接口文档 /api-docs 在生产环境关闭或限制为内网白名单访问。",
]:
    g.add_bullet(doc, text)

g.add_heading(doc, "11.3  后端服务与配置", 2)
g.add_body(doc, "后端以独立 Node.js 服务运行，使用 systemd、容器或等价进程管理方式守护，以非 root 账号启动；服务只监听内网地址，由接入层转发。生产配置通过环境变量或配置中心注入，敏感信息不写入代码仓库。")
g.add_data_table(doc, ["配置项", "生产说明"], [
    ["NODE_ENV", "production，关闭开发调试输出"],
    ["PORT", "服务监听端口，仅内网可访问"],
    ["DATABASE_URL", "MySQL 连接串，账号最小权限"],
    ["JWT_SECRET", "独立强随机密钥，定期轮换"],
    ["JWT_EXPIRES_IN", "登录令牌有效期，按安全策略配置"],
    ["CORS_ORIGINS", "生产域名白名单，禁止泛域名"],
    ["REPORT_DIR", "持久化报表目录，多实例共享"],
    ["AUTO_PUBLISH_ENABLED", "排期自动发布开关"],
    ["AUTO_PUBLISH_INTERVAL_MS", "自动发布检查间隔"],
    ["LOG_LEVEL", "生产日志级别"],
], [5.0, 11.1], 8.8)

g.add_heading(doc, "11.4  数据库与文件存储", 2)
for text in [
    "MySQL 部署在内网私有网络，仅允许应用节点访问，数据库端口不对公网开放；",
    "应用使用独立数据库账号，按最小权限授权，结构与数据变更通过迁移脚本执行；",
    "每日执行全量备份并保留 binlog，定期做恢复演练，备份文件异地保存；",
    "报表目录使用持久化存储，多实例部署时挂载同一共享目录或对象存储，并设置访问权限与保留周期；",
    "审计日志、同步任务和报表任务设置保留策略，满足追溯与清理要求。",
]:
    g.add_bullet(doc, text)

g.add_heading(doc, "11.5  发布与回滚", 2)
g.add_body(doc, "发布流程按“构建校验 → 数据库迁移 → 后端发布 → 健康检查 → 前端切换 → 业务检查”执行。前端与后端均保留上一版本制品；出现接口异常或页面故障时，按版本制品回滚，数据库迁移需具备对应的回退方案。")
g.add_body(doc, "发布前完成 TypeScript 检查和生产构建；发布后检查健康接口、登录、计划列表、报表下载和自动发布任务状态，确认无误后再结束发布。")

g.add_heading(doc, "11.6  监控、日志与自动任务", 2)
for text in [
    "健康检查：接入 /health 与 /api/v1/health，监控服务进程和数据库连接；",
    "日志：记录 traceId、接口耗时和错误信息，统一收集并配置轮转与保留周期；",
    "指标：监控请求量、5xx 比例、接口延迟、数据库连接池和报表任务失败；",
    "自动任务：监控已排期计划、发布失败和过期未结束计划，异常时告警；",
    "审计：自动发布与自动结束记录操作人为「系统」，关键操作可在日志中追溯。",
]:
    g.add_bullet(doc, text)

g.add_heading(doc, "11.7  安全加固与容量", 2)
for text in [
    "全站 HTTPS，Nginx 配置安全响应头、请求体大小限制和访问日志；",
    "接口层限制登录失败频率和请求频率，上传接口限制文件类型与大小；",
    "JWT 密钥、数据库密码通过密钥管理系统或受控环境变量注入，不写入文档和代码；",
    "账号停用、改密、重置密码后旧令牌立即失效，管理员操作写入审计日志；",
    "列表接口保持分页上限，数据库按状态、项目、日期建立索引，报表文件使用独立存储，按访问量横向扩展应用节点。",
]:
    g.add_bullet(doc, text)

# 12 交付物
doc.add_page_break()
g.add_heading(doc, "12  交付物", 1)
g.add_data_table(doc, ["交付物", "说明"], [
    ["前端源代码", "Vue 3 + TypeScript 工程，包含页面、组件、API 适配与设计令牌"],
    ["后端服务", "Fastify 5 服务、数据库结构、接口与自动任务"],
    ["技术方案", "覆盖架构、模块、规则、接口、数据模型、自动任务与部署"],
    ["验收报告", "功能、规则、接口、非功能验收结果与需关注事项"],
    ["系统截图", "PC 与移动端共 17 张 PNG，按编号命名并单独打包"],
], [4.2, 11.9], 9)

doc.core_properties.title = "投流统计平台技术方案"
doc.core_properties.author = "投流统计平台项目组"
doc.core_properties.subject = "投流统计平台前后端一体化技术方案"
doc.save(OUT / "投流统计平台-技术方案-合并版.docx")
print("saved merged tech doc")

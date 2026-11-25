import pathlib

p = pathlib.Path(r"E:\投流统计平台\scripts\build-merged-tech-doc.py")
s = p.read_text(encoding="utf-8")
start = s.index("# 11 部署运维")
end = s.index("# 12 交付物")
new = '''# 11 生产部署与运维
g.add_heading(doc, "11  生产部署与运维", 1)
g.add_heading(doc, "11.1  生产部署拓扑", 2)
g.add_body(doc, "生产环境按接入层、应用层、数据层分离部署。接入层负责 HTTPS、静态资源和反向代理；应用层运行 Fastify 服务；数据层使用 MySQL 8；报表文件存放在持久化存储；监控、日志、备份由运维体系统一管理。")
g.add_data_table(doc, ["层次", "生产配置", "职责"], [
    ["接入层", "Nginx / 负载均衡，HTTPS 证书", "静态资源、反向代理、访问控制"],
    ["应用层", "Node.js 18+、Fastify 5，多实例部署", "接口、鉴权、自动任务"],
    ["数据层", "MySQL 8，主库与备份", "业务数据与审计记录"],
    ["文件存储", "持久化共享目录或对象存储", "xlsx 报表文件"],
    ["运维", "日志、指标、告警、备份", "故障定位、恢复与容量管理"],
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

'''
s = s[:start] + new + s[end:]
p.write_text(s, encoding="utf-8")
print("production deployment section replaced")

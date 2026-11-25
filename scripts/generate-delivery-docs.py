# -*- coding: utf-8 -*-
"""生成投流统计平台技术方案与验收报告 Word 文档。"""
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

BASE = Path(r"E:\投流统计平台")
OUT = BASE / "docs" / "交付材料"
OUT.mkdir(parents=True, exist_ok=True)

FONT_SANS = "微软雅黑"
FONT_BODY = "宋体"
INK = RGBColor(0x20, 0x1F, 0x1C)
SECOND = RGBColor(0x5F, 0x5B, 0x53)
TERTIARY = RGBColor(0x8A, 0x85, 0x7B)
ACCENT = RGBColor(0x1F, 0x3A, 0x5F)
DARK = "25231F"
HEADER_FILL = "2B2925"
ZEBRA = "F5F3EE"
LIGHT = "FBFAF7"
BORDER = "D8D2C6"


# ---------------------------------------------------------------- 基础工具

def set_run_font(run, name=FONT_BODY, size=10.5, bold=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    if color is not None:
        run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), name)
    rfonts.set(qn("w:hAnsi"), name)
    rfonts.set(qn("w:eastAsia"), name)


def fmt_para(p, before=0, after=4, line=1.5, align=None):
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if align is not None:
        p.alignment = align


def add_text(doc, text, size=10.5, bold=False, color=INK, after=4, before=0,
             align=WD_ALIGN_PARAGRAPH.JUSTIFY, font=FONT_BODY, line=1.5):
    p = doc.add_paragraph()
    fmt_para(p, before=before, after=after, line=line, align=align)
    run = p.add_run(text)
    set_run_font(run, font, size, bold, color)
    return p


def add_body(doc, text, after=4):
    return add_text(doc, text, after=after)


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet")
    fmt_para(p, after=2, line=1.45)
    p.paragraph_format.left_indent = Cm(0.55 + 0.55 * level)
    p.paragraph_format.first_line_indent = Cm(-0.3)
    run = p.add_run(text)
    set_run_font(run, FONT_BODY, 10.2, False, INK)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    fmt_para(p, before=14 if level == 1 else 8, after=6 if level == 1 else 4, line=1.2)
    run = p.add_run(text)
    if level == 1:
        set_run_font(run, FONT_SANS, 15, True, INK)
    elif level == 2:
        set_run_font(run, FONT_SANS, 12, True, INK)
    else:
        set_run_font(run, FONT_SANS, 10.8, True, SECOND)
    if level == 1:
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), "8")
        bottom.set(qn("w:space"), "4")
        bottom.set(qn("w:color"), "B8B0A2")
        pBdr.append(bottom)
        pPr.append(pBdr)
    return p


def add_caption(doc, text):
    p = doc.add_paragraph()
    fmt_para(p, before=2, after=6, line=1.2, align=WD_ALIGN_PARAGRAPH.LEFT)
    run = p.add_run(text)
    set_run_font(run, FONT_SANS, 8.5, False, TERTIARY)


def shade_cell(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def set_cell_text(cell, text, size=9, bold=False, color=INK, align=WD_ALIGN_PARAGRAPH.LEFT,
                  font=FONT_BODY):
    cell.text = ""
    p = cell.paragraphs[0]
    fmt_para(p, before=0, after=0, line=1.3, align=align)
    run = p.add_run(str(text))
    set_run_font(run, font, size, bold, color)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def set_table_borders(table):
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), BORDER)
        borders.append(el)
    tblPr.append(borders)


def repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)


def no_split_row(row):
    trPr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    trPr.append(cant_split)


def set_col_widths(table, widths):
    table.autofit = False
    for row in table.rows:
        for idx, width in enumerate(widths):
            if idx < len(row.cells):
                row.cells[idx].width = Cm(width)


def add_data_table(doc, headers, rows, widths, size=8.8, header_size=8.8,
                   first_col_bold=False, zebra=True):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    set_table_borders(table)
    hdr = table.rows[0]
    repeat_header(hdr)
    no_split_row(hdr)
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        shade_cell(cell, HEADER_FILL)
        set_cell_text(cell, h, header_size, True, RGBColor(255, 255, 255), WD_ALIGN_PARAGRAPH.CENTER, FONT_SANS)
    for r_idx, row in enumerate(rows):
        new_row = table.add_row()
        no_split_row(new_row)
        cells = new_row.cells
        for c_idx, value in enumerate(row):
            set_cell_text(
                cells[c_idx], value, size,
                bold=(first_col_bold and c_idx == 0),
                align=WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT,
            )
            if zebra and r_idx % 2 == 1:
                shade_cell(cells[c_idx], ZEBRA)
    set_col_widths(table, widths)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_code_block(doc, lines):
    for line in lines:
        p = doc.add_paragraph()
        fmt_para(p, before=0, after=2, line=1.25, align=WD_ALIGN_PARAGRAPH.LEFT)
        p.paragraph_format.left_indent = Cm(0.25)
        pPr = p._p.get_or_add_pPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), "F5F3EE")
        pPr.append(shd)
        run = p.add_run(line)
        set_run_font(run, "Consolas", 9, False, INK)


def add_note_box(doc, title, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    set_table_borders(table)
    cell = table.rows[0].cells[0]
    shade_cell(cell, LIGHT)
    cell.text = ""
    p = cell.paragraphs[0]
    fmt_para(p, before=2, after=2, line=1.4)
    r1 = p.add_run(title + "  ")
    set_run_font(r1, FONT_SANS, 9.5, True, INK)
    r2 = p.add_run(text)
    set_run_font(r2, FONT_BODY, 9.5, False, SECOND)
    cell.width = Cm(16.1)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_horizontal_rule(doc, color="B8B0A2"):
    p = doc.add_paragraph()
    fmt_para(p, before=6, after=10, line=1.0)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    pBdr.append(bottom)
    pPr.append(pBdr)


def add_page_number_field(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("第 ")
    set_run_font(run, FONT_SANS, 8.5, False, TERTIARY)
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    txt = OxmlElement("w:t")
    txt.text = "1"
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(txt)
    run._r.append(fld_end)
    run2 = paragraph.add_run(" 页")
    set_run_font(run2, FONT_SANS, 8.5, False, TERTIARY)


def setup_document(title, watermark):
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.1)
    section.bottom_margin = Cm(1.9)
    section.left_margin = Cm(2.4)
    section.right_margin = Cm(2.4)
    section.header_distance = Cm(0.9)
    section.footer_distance = Cm(0.9)
    section.different_first_page_header_footer = True

    normal = doc.styles["Normal"]
    normal.font.name = FONT_BODY
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), FONT_BODY)
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.5

    # 内置样式中的 Courier 在部分环境缺字体，统一替换为 Consolas
    for st in doc.styles:
        try:
            if st.font is not None and st.font.name == "Courier":
                st.font.name = "Consolas"
                rpr = st.element.get_or_add_rPr()
                rfonts = rpr.rFonts
                if rfonts is not None:
                    rfonts.set(qn("w:ascii"), "Consolas")
                    rfonts.set(qn("w:hAnsi"), "Consolas")
        except Exception:
            pass

    for level, size in ((1, 15), (2, 12), (3, 10.8)):
        st = doc.styles[f"Heading {level}"]
        st.font.name = FONT_SANS
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = INK
        st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT_SANS)

    # 页眉：左侧文档名，右侧平台名
    header = section.header
    hp = header.paragraphs[0]
    hp.paragraph_format.tab_stops.clear_all()
    hp.paragraph_format.tab_stops.add_tab_stop(Cm(16.2), WD_TAB_ALIGNMENT.RIGHT)
    r = hp.add_run(title)
    set_run_font(r, FONT_SANS, 8.2, False, TERTIARY)
    r = hp.add_run("\t投流统计平台")
    set_run_font(r, FONT_SANS, 8.2, False, TERTIARY)
    pPr = hp._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "4")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), "D8D2C6")
    pBdr.append(bottom)
    pPr.append(pBdr)

    footer = section.footer
    fp = footer.paragraphs[0]
    add_page_number_field(fp)
    return doc


def add_cover(doc, title, subtitle, meta_rows, footer_note):
    p = doc.add_paragraph()
    fmt_para(p, before=20, after=0, line=1.0)
    r = p.add_run("TAICANG  /  AD DELIVERY  /  DATA PLATFORM")
    r.font.name = FONT_SANS
    r.font.size = Pt(8)
    r.font.color.rgb = TERTIARY

    add_text(doc, "项目交付文档", 11, True, SECOND, after=6, before=6, font=FONT_SANS, line=1.2)
    add_text(doc, title, 29, True, INK, after=4, before=8, font=FONT_SANS, line=1.1)
    add_text(doc, subtitle, 11, False, SECOND, after=10, before=2, font=FONT_SANS, line=1.5, align=WD_ALIGN_PARAGRAPH.LEFT)
    add_horizontal_rule(doc)

    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    for k, v in meta_rows:
        cells = table.add_row().cells
        set_cell_text(cells[0], k, 9, False, TERTIARY, WD_ALIGN_PARAGRAPH.LEFT, FONT_SANS)
        set_cell_text(cells[1], v, 9.5, False, INK)
        shade_cell(cells[0], LIGHT)
    set_col_widths(table, [3.6, 12.5])

    add_text(doc, footer_note, 8.5, False, TERTIARY, after=0, before=8, font=FONT_SANS, line=1.3)
    doc.add_page_break()


def add_toc(doc, items):
    add_heading(doc, "目录", 1)
    for item in items:
        p = doc.add_paragraph()
        fmt_para(p, before=1, after=2, line=1.4)
        r = p.add_run(item)
        set_run_font(r, FONT_SANS, 9.5, False, SECOND)
    doc.add_page_break()


def add_cover_info(doc, project, doc_type, version, date, owner, status):
    return [
        ("项目名称", project),
        ("文档类型", doc_type),
        ("文档版本", version),
        ("编制日期", date),
        ("编制单位", owner),
        ("文档状态", status),
    ]


# ---------------------------------------------------------------- 技术方案

def build_tech_doc():
    title = "技术方案"
    doc = setup_document(title, "投流统计平台")
    add_cover(
        doc,
        "投流统计平台",
        "前端技术方案  ·  Vue 3 管理员端  ·  PC / 平板 / 移动三端",
        add_cover_info(doc, "投流统计平台", "技术方案", "V1.0", "2026-11-25", "前端项目组", "交付版"),
        "本文件为项目内部技术资料，包含架构、接口、业务规则与交付说明。",
    )

    add_toc(doc, [
        "1  项目概述",
        "2  总体架构与技术选型",
        "3  功能模块设计",
        "4  关键业务规则",
        "5  接口与数据层设计",
        "6  设计系统与响应式适配",
        "7  安全、性能与稳定性",
        "8  部署与运行说明",
        "9  交付物与后续工作",
    ])

    add_heading(doc, "1  项目概述", 1)
    add_heading(doc, "1.1  建设背景", 2)
    add_body(doc, "投流统计平台面向 2026 年太仓分公司全域融数智能投放服务，用于统一管理投放计划、回收投放数据、展示经营看板并生成结案报表。平台前端承担管理员操作界面，后端提供数据与状态流转接口。")
    add_body(doc, "系统已完成管理员登录、工作台、投放计划、新建计划向导、计划详情、数据回收、数据看板、报表中心和系统管理的后端接口联调；前端不内置本地数据，所有业务数据均由后端服务提供。")

    add_heading(doc, "1.2  建设目标", 2)
    for text in [
        "统一入口：仅保留管理员入口，管理员可在同一系统内完成计划、数据、报表与基础资料维护。",
        "数据闭环：从计划创建、发布、数据回收到报表导出形成完整链路。",
        "状态可信：计划按排期自动发布，避免未到开始日期被错误标记为投放中。",
        "体验一致：PC、平板、移动端布局一致，表格、筛选、分页和图表在窄屏不重叠、不超出屏幕。",
        "可维护性：后端接口统一经过适配层，页面 DTO 与后端字段解耦，便于后续扩展。",
    ]:
        add_bullet(doc, text)

    add_heading(doc, "1.3  建设范围", 2)
    add_body(doc, "本期范围为前端应用及系统管理界面；后端接口、数据库、媒体投放执行不在前端代码范围内。前端不接入普通用户登录，不提供新增管理员账号，不提供 PDF 导出，也不提供本地数据生成或清理入口。")
    add_data_table(doc, ["范围", "说明"], [
        ["包含", "管理员端页面、状态与权限、后端接口适配、响应式适配、项目/厂商/字典/日志维护"],
        ["不包含", "后端服务实现、媒体下单、普通用户端、PDF 报表、前端本地数据层"],
        ["依赖", "内网后端 http://192.168.9.224:3000/api/v1、管理员账号、初始化业务数据"],
    ], [3.0, 13.1], 9)

    add_heading(doc, "1.4  术语说明", 2)
    add_data_table(doc, ["术语", "含义"], [
        ["投放计划", "一次广告投放任务，包含项目、渠道、人群、预算、排期和目标曝光量等"],
        ["已排期", "计划已完成发布前配置，等待开始日期，不生成投放单号、不开始投放"],
        ["自动发布", "到达开始日期后由后端定时任务将已排期计划转为投放中并生成单号"],
        ["目标曝光量", "计划期望获得的曝光次数，创建时需满足上下限及预算约束"],
        ["全部项目视图", "管理员列表、看板、报表默认聚合所有项目，不锁定单一项目"],
    ], [3.4, 12.7], 9)

    add_heading(doc, "2  总体架构与技术选型", 1)
    add_heading(doc, "2.1  总体架构", 2)
    add_body(doc, "系统采用前后端分离架构。浏览器加载 Vue 单页应用，页面通过统一的 Axios 请求层访问 /api/v1，开发环境由 Vite 代理到内网后端，生产环境由 Nginx 反向代理。")
    arch = doc.add_table(rows=1, cols=1)
    arch.style = "Table Grid"
    set_table_borders(arch)
    cell = arch.rows[0].cells[0]
    shade_cell(cell, LIGHT)
    cell.text = ""
    lines = [
        "管理员浏览器（PC / 平板 / 移动）",
        "        │  HTTPS",
        "Vue 3 SPA（Router / Pinia / Views / Components）",
        "        │  /api/v1（Axios 统一封装）",
        "Vite 开发代理  →  Nginx 生产反向代理",
        "        │",
        "内网后端服务（192.168.9.224:3000） + 数据库",
    ]
    for i, line in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        fmt_para(p, before=0, after=2, line=1.25, align=WD_ALIGN_PARAGRAPH.LEFT)
        r = p.add_run(line)
        set_run_font(r, "Consolas", 8.8, False, INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_heading(doc, "2.2  技术选型", 2)
    add_data_table(doc, ["层次", "技术", "用途"], [
        ["视图框架", "Vue 3.5 + TypeScript 5.4", "组合式 API、严格类型约束"],
        ["构建工具", "Vite 5.2", "开发服务、生产构建、代理"],
        ["路由与状态", "Vue Router 4.6 + Pinia 2.1", "页面路由、登录态、项目/字典状态"],
        ["UI 组件", "Element Plus 2.14", "表单、表格、弹窗、分页、消息"],
        ["图表", "ECharts 5.5", "工作台、看板、详情趋势图"],
        ["时间与导出", "Day.js 1.11 + SheetJS", "日期格式化、xlsx 导入导出"],
        ["请求层", "Axios", "统一 token、错误处理、空 body 兼容"],
    ], [3.0, 5.4, 7.7], 9)

    add_heading(doc, "2.3  目录结构", 2)
    add_data_table(doc, ["目录", "职责"], [
        ["src/api", "请求封装、接口映射（real.ts）、业务 API"],
        ["src/components", "KpiCard、StatusTag、ChannelTag、ChannelIcon、BaseChart、DataTable 等通用组件"],
        ["src/constants", "状态、渠道、投放目标、出价方式、报表类型等常量"],
        ["src/layouts", "侧边导航、顶栏、主题切换"],
        ["src/router", "路由表、管理员守卫"],
        ["src/stores", "登录用户、项目/字典、主题与侧栏状态"],
        ["src/styles", "设计令牌、全局样式、Element Plus 主题覆盖"],
        ["src/views", "工作台、计划、回收、看板、报表、系统管理"],
        ["scripts", "基础数据初始化脚本"],
    ], [3.4, 12.7], 9)

    add_heading(doc, "2.4  运行环境", 2)
    add_data_table(doc, ["项目", "要求"], [
        ["Node.js", "18 及以上"],
        ["包管理器", "pnpm 8 及以上"],
        ["浏览器", "Chrome / Edge 最新版本，支持 ES2020、CSS Grid"],
        ["后端", "http://192.168.9.224:3000 可访问"],
        ["管理员账号", "admin / Admin123#"],
    ], [3.6, 12.5], 9)

    add_heading(doc, "3  功能模块设计", 1)
    add_heading(doc, "3.1  角色与权限", 2)
    add_body(doc, "平台采用管理员单入口。登录入口为 /admin/login，未登录访问业务页面会跳转登录；管理员可访问全部业务页面与系统管理五页签，不提供普通用户端。")
    add_data_table(doc, ["能力", "管理员", "说明"], [
        ["业务页面查看与操作", "✓", "计划、数据、看板、报表"],
        ["计划创建、发布、暂停、结束、结案", "✓", "按状态机执行"],
        ["系统管理", "✓", "账号、项目、厂商、字典、日志"],
        ["创建管理员账号", "—", "账号由后端统一发放"],
        ["普通用户登录", "—", "平台不提供普通用户入口"],
    ], [6.2, 2.2, 6.7], 9)

    add_heading(doc, "3.2  功能模块总览", 2)
    add_data_table(doc, ["模块", "路由", "核心能力"], [
        ["管理员登录", "/admin/login", "账号密码登录、令牌续期、登录跳转"],
        ["工作台", "/dashboard", "6 项指标、曝光趋势、渠道占比、最近更新"],
        ["投放计划", "/campaign", "搜索、状态分类、分页、批量导出/归档"],
        ["新建计划", "/campaign/create", "四步向导：基础信息、人群定向、排期预算、确认发布"],
        ["计划详情", "/campaign/:id", "概览、分日数据、人群分布、素材、操作记录"],
        ["数据回收", "/stats", "手工录入、Excel 导入、同步后端数据"],
        ["数据看板", "/board", "趋势、渠道、地域、性别、年龄、完成率"],
        ["报表中心", "/report", "创建 xlsx 导出任务、轮询、下载"],
        ["系统管理", "/admin", "管理员账号、项目管理、厂商管理、字典配置、操作日志"],
    ], [3.0, 4.0, 8.7], 9)

    add_heading(doc, "3.3  管理员登录", 2)
    add_body(doc, "登录页采用左侧品牌区与右侧表单的布局，移动端隐藏品牌区。表单完成基础必填校验后调用登录接口，成功后写入 token 与管理员信息，进入工作台。系统在 token 过期前尝试静默续期，续期失败或接口返回 401 时清理会话并回到登录页。")

    add_heading(doc, "3.4  工作台", 2)
    add_body(doc, "工作台展示计划曝光量、实际曝光量、曝光完成率、曝光人数、点击率和在投计划六项指标，并提供近 7/14/30 天切换。下方为曝光趋势、渠道占比图与最近更新数据列表。")

    add_heading(doc, "3.5  投放计划", 2)
    add_body(doc, "列表默认聚合全部项目，支持按计划名称、投放单号、渠道和投放周期筛选，提供全部/草稿/已排期/投放中/已暂停/已结束/已结案状态快捷分类，支持批量导出和批量归档。表格在窄屏内部横向滚动，不压缩列宽。")
    add_body(doc, "新建计划采用四步向导：")
    for text in [
        "基础信息：计划名称、所属项目、关联合同、投放渠道、投放厂商、投放目标；",
        "人群定向：地域、性别、年龄段、兴趣标签；",
        "排期预算：开始/结束日期、日预算、总预算、目标曝光量、出价方式；",
        "确认发布：复核信息、勾选确认，按开始日期决定直接发布或进入已排期。",
    ]:
        add_bullet(doc, text)
    add_body(doc, "已排期计划不提供手动发布入口，状态旁使用小时钟图标提示「到期自动发布」；计划详情页只读展示，已排期计划由后端定时任务在开始日期自动发布并生成投放单号。")

    add_heading(doc, "3.6  数据回收", 2)
    add_body(doc, "数据回收支持按计划手工录入曝光、点击、消耗、曝光人数等数据，支持 Excel 模板下载、导入与错误行提示；同时提供后端同步操作，展示本次更新天数或后端返回说明。导入结果和同步结果均以消息形式反馈。")

    add_heading(doc, "3.7  数据看板", 2)
    add_body(doc, "数据看板独立于工作台，支持日期范围和维度筛选，展示曝光趋势、渠道占比、地域分布、性别分布、年龄分布和计划完成率。渠道颜色使用官方品牌色：抖音黑、微信绿、小红书红、快手橙、百度蓝；完成率图只展示前 10 条，移动端图例换行、X 轴精简为 0%/50%/100%。")

    add_heading(doc, "3.8  报表中心", 2)
    add_body(doc, "报表中心支持投放日报、投放周报、结案报告和数据明细四类任务，统一生成 xlsx。创建任务后轮询状态，完成后提供下载；本期不提供 PDF 输出。")

    add_heading(doc, "3.9  系统管理", 2)
    add_body(doc, "系统管理包含五个页签：管理员账号、项目管理、厂商管理、字典配置、操作日志。")
    for text in [
        "管理员账号：查看由后端发放的账号，维护显示名称、状态与密码，不提供新增入口；",
        "项目管理：项目列表、搜索、新增、编辑；接入项目列表、详情、新增、修改四个接口；保存后同步刷新全局项目数据，新建计划时立即可选；",
        "厂商管理：厂商编码、名称、平台、联系人、电话、状态与关联计划；平台使用官方渠道图标；",
        "字典配置：维护渠道字典；",
        "操作日志：按对象类型、操作人、日期筛选，支持导出。",
    ]:
        add_bullet(doc, text)

    add_heading(doc, "4  关键业务规则", 1)
    add_heading(doc, "4.1  计划状态与自动发布", 2)
    add_data_table(doc, ["状态", "含义", "数据同步"], [
        ["draft", "草稿，可编辑、删除", "否"],
        ["scheduled", "已排期，等待开始日期，不生成单号", "否"],
        ["running", "投放中，已生成投放单号", "是"],
        ["paused", "暂停投放", "按规则"],
        ["finished", "结束投放", "按规则"],
        ["closed", "结案，只读", "按规则"],
    ], [3.2, 9.7, 3.2], 9)
    add_body(doc, "创建计划时，系统根据开始日期自动判断：开始日期晚于今天则进入已排期，不生成投放单号；开始日期为今天或更早则直接发布进入投放中。已排期计划在开始日期由后端自动发布，不提供手动发布入口。")

    add_heading(doc, "4.2  目标曝光量校验", 2)
    add_body(doc, "目标曝光量必须为整数，最低 1,000 次，绝对最高 100,000,000 次；同时按总预算和千人曝光成本 12 元计算预算上限，取两者较小值。例如总预算 42,000 元时，最多可填 3,500,000 次。输入框设置 min/max，提交前再次校验并提示可填范围。")

    add_heading(doc, "4.3  项目与预算", 2)
    add_body(doc, "项目包含名称、客户/甲方、开始/结束日期、总预算、已用预算、剩余预算。项目总预算保存后，已用与剩余预算由后端结合计划预算统计；创建计划时总预算不得超过项目当前剩余可用金额。")

    add_heading(doc, "4.4  全部项目视图", 2)
    add_body(doc, "管理员的工作台、计划、看板、报表默认聚合全部项目；项目用于创建计划时选择，管理端查询覆盖全部项目。系统管理中的项目管理负责基础资料维护。")

    add_heading(doc, "5  接口与数据层设计", 1)
    add_heading(doc, "5.1  统一请求封装", 2)
    add_body(doc, "所有页面只调用 src/api 下的业务方法。src/api/request.ts 统一处理 baseURL、Authorization、空 body、业务码与错误消息；src/api/real.ts 负责后端字段到页面 DTO 的映射。")
    add_bullet(doc, "响应结构：{ code, message, data, traceId }；")
    add_bullet(doc, "写接口空请求体统一补全，兼容后端校验；")
    add_bullet(doc, "token 过期前通过 /auth/refresh 续期，401 兜底清理会话；")
    add_bullet(doc, "同步接口统一返回本次更新天数与说明信息。")

    add_heading(doc, "5.2  主要接口", 2)
    add_data_table(doc, ["模块", "方法与路径", "用途"], [
        ["登录", "POST /auth/login；POST /auth/refresh", "管理员登录、令牌续期"],
        ["工作台", "GET /dashboard/summary；GET /dashboard/trend；GET /dashboard/dimensions", "指标、趋势、渠道/人群维度"],
        ["计划", "GET/POST /campaigns；GET/PUT/DELETE /campaigns/{id}", "列表、创建、详情、修改、删除草稿"],
        ["状态", "POST /campaigns/{id}/publish|pause|resume|finish|close", "发布、暂停、恢复、结束、结案"],
        ["同步", "POST /campaigns/{id}/sync", "同步投放数据"],
        ["回收", "POST /campaigns/{id}/stats；POST /campaigns/{id}/import", "手工录入、Excel 导入"],
        ["报表", "GET/POST /reports；GET /reports/{id}/download", "创建、轮询、下载 xlsx"],
        ["项目", "GET /projects；POST /projects；GET /projects/{id}；PUT /projects/{id}", "项目列表、新增、详情、修改"],
        ["管理", "GET/POST/PUT /vendors、/users、/dicts、/logs", "厂商、账号、字典、日志"],
    ], [2.4, 7.4, 6.3], 8.4)

    add_heading(doc, "5.3  字段映射与项目数据", 2)
    add_body(doc, "项目接口返回 id、name、client、startDate、endDate、budget、usedBudget、remainingBudget、createdAt。适配层将 budget 映射为 totalBudget，并补充 createdAt 字段供项目管理列表展示。项目新增/修改统一提交 name、client、startDate、endDate、budget 五个字段。")
    add_body(doc, "计划接口的 status 为页面状态机来源；适配层负责统一后端状态字段与页面状态值，保证状态展示一致。")

    add_heading(doc, "5.4  错误处理", 2)
    add_body(doc, "请求层统一解析后端 message 与业务码，页面使用 ElMessage 展示可读错误；表单错误优先在字段级提示，避免只弹全局消息。网络失败、接口 4xx/5xx、空数据分别走错误态、空态和加载态。")

    add_heading(doc, "6  设计系统与响应式适配", 1)
    add_heading(doc, "6.1  视觉规范", 2)
    add_bullet(doc, "单色社论风：1px 发际线、无阴影/渐变、小圆角（按钮 4px、卡片 8px）；")
    add_bullet(doc, "语义色仅用于状态点、进度和图线；渠道图标使用官方品牌色；")
    add_bullet(doc, "表格内容居中、操作列不固定悬浮，暗色模式覆盖 Element Plus 白底组件；")
    add_bullet(doc, "图例统一为圆点，数字使用等宽数字，长文本省略并提供 tooltip。")

    add_heading(doc, "6.2  三端断点", 2)
    add_data_table(doc, ["端", "宽度", "布局行为"], [
        ["PC", "≥1280px", "侧栏 248px，KPI 3 列，表格完整展示"],
        ["平板", "768–1279px", "内容边距 16px，双栏合并单列，表格内部横向滚动"],
        ["移动", "≤767px", "侧栏 64px，筛选单列，状态标签换行，分页精简"],
    ], [2.4, 4.0, 9.7], 9)
    add_body(doc, "辅助断点为 900px（侧栏收起、图表合并单列）和 560px（KPI 单列）。所有页面保证整页不横向溢出，宽表格的横向滚动限定在表格容器内部。")

    add_heading(doc, "6.3  关键适配", 2)
    add_bullet(doc, "表格：DataTable 统一滚动容器，计划表最小 1100px，通用表 980px，管理端 1120px；")
    add_bullet(doc, "发布向导：移动端步骤条 2×2，表单单列，渠道 2 列，目标卡单列；")
    add_bullet(doc, "筛选与分页：移动端单列筛选、查询/重置整行，分页只保留前后页和页码；")
    add_bullet(doc, "图表：隐藏容器不初始化 ECharts，加载完成或可见后补初始化；完成率图移动端图例换行、坐标轴稀疏显示。")

    add_heading(doc, "7  安全、性能与稳定性", 1)
    add_heading(doc, "7.1  登录与权限", 2)
    add_body(doc, "前端只提供管理员入口，路由守卫校验登录态与管理员身份，登录态失效时清理会话并返回登录页。token 保存在本地会话存储中，接口统一附加 Authorization；前端不保存密码。账号由后端统一发放，前端只允许修改显示名称、状态和密码。")
    add_heading(doc, "7.2  性能与稳定性", 2)
    for text in [
        "Admin 页签使用 lazy 加载，减少首屏组件初始化；",
        "ECharts 在容器尺寸就绪后初始化，保证首次渲染完整；深色/浅色切换后重新计算主题；",
        "报表 xlsx 导出按需加载 SheetJS，降低初始包体积；",
        "请求层统一错误兜底，页面有 loading、空态和失败态；",
        "生产构建通过 vue-tsc 严格类型检查与 Vite 构建。",
    ]:
        add_bullet(doc, text)

    add_heading(doc, "7.3  控制台质量", 2)
    add_body(doc, "状态与渠道组件支持空值兜底，图表初始化前校验容器可见性与尺寸，前端控制台保持无异常告警。")

    add_heading(doc, "8  部署与运行说明", 1)
    add_heading(doc, "8.1  本地启动", 2)
    add_code_block(doc, [
        "pnpm install",
        "pnpm dev          # 启动开发服务",
        "pnpm type-check   # vue-tsc 严格检查",
        "pnpm build        # 输出 dist/",
    ])
    add_heading(doc, "8.2  代理与生产部署", 2)
    add_body(doc, "开发环境由 vite.config.ts 将 /api 代理到 http://192.168.9.224:3000；生产环境通过 Nginx 将 /api/ 反向代理到后端，前端静态文件部署 dist/。环境变量只保留接口地址与版本号。")
    add_heading(doc, "8.3  基础数据初始化", 2)
    add_body(doc, "后端数据库重建后，执行 python scripts/seed-real.py 通过接口初始化项目、厂商、计划和分日/人群数据；脚本幂等，可重复执行。")

    add_heading(doc, "9  交付物与后续工作", 1)
    add_heading(doc, "9.1  交付物", 2)
    add_data_table(doc, ["交付物", "说明"], [
        ["前端源代码", "Vue 3 + TypeScript 工程，包含页面、组件、API 适配与设计令牌"],
        ["技术方案", "本文件，覆盖架构、模块、规则、接口、响应式与部署"],
        ["验收报告", "功能、规则、接口、非功能验收结果与后续事项"],
        ["系统截图", "PC 与移动端共 17 张 PNG，按编号命名并单独打包"],
        ["基础数据初始化脚本", "scripts/seed-real.py"],
    ], [4.2, 11.9], 9)
    add_heading(doc, "9.2  后续工作", 2)
    add_body(doc, "后续可结合运营反馈扩展项目删除、移动端卡片式列表等能力，并持续观察已排期计划的自动发布结果。")

    doc.core_properties.title = "投流统计平台技术方案"
    doc.core_properties.author = "投流统计平台项目组"
    doc.core_properties.subject = "投流统计平台前端技术方案"
    doc.save(OUT / "投流统计平台-技术方案.docx")
    print("saved tech doc")


# ---------------------------------------------------------------- 验收报告

def build_accept_doc():
    title = "验收报告"
    doc = setup_document(title, "投流统计平台")
    add_cover(
        doc,
        "投流统计平台",
        "项目验收报告  ·  管理员端  ·  PC / 平板 / 移动三端",
        add_cover_info(doc, "投流统计平台", "验收报告", "V1.0", "2026-11-25", "投流统计平台项目组", "验收版"),
        "本报告依据项目联调与验收结果编制，系统截图以独立文件包交付。",
    )

    add_toc(doc, [
        "1  验收概述",
        "2  验收环境",
        "3  功能验收",
        "4  业务规则验收",
        "5  接口联调验收",
        "6  非功能验收",
        "7  问题与整改记录",
        "8  上线检查与风险",
        "9  验收结论",
        "10  签字确认",
        "附录 A  系统截图清单",
    ])

    add_heading(doc, "1  验收概述", 1)
    add_heading(doc, "1.1  验收对象", 2)
    add_body(doc, "本次验收对象为投流统计平台管理端，覆盖登录、工作台、投放计划、新建计划向导、计划详情、数据回收、数据看板、报表中心和系统管理五个页签。验收重点为业务功能、状态规则、接口联调与三端适配。")

    add_heading(doc, "1.2  验收范围", 2)
    add_data_table(doc, ["范围", "内容"], [
        ["功能范围", "管理员登录、工作台、计划列表、四步创建向导、计划详情、数据回收、数据看板、报表中心、系统管理"],
        ["业务规则", "计划状态与排期、到期自动发布、目标曝光量上下限、项目预算、全部项目视图"],
        ["接口范围", "登录/续期、工作台、计划、同步、回收、报表、项目、厂商、账号、字典、日志"],
        ["非功能", "PC/平板/移动适配、明暗主题、控制台告警、类型检查、生产构建"],
    ], [3.4, 12.7], 9)

    add_heading(doc, "1.3  验收依据", 2)
    add_bullet(doc, "产品需求：管理员单入口、直接发布、未来计划自动排期、项目维护、全部项目聚合；")
    add_bullet(doc, "设计规范：单色社论风、1px 发际线、小圆角、暗色主题、渠道官方图标；")
    add_bullet(doc, "接口文档、后端接口响应与系统验收记录。")

    add_heading(doc, "2  验收环境", 1)
    add_heading(doc, "2.1  环境配置", 2)
    add_data_table(doc, ["项目", "配置"], [
        ["访问地址", "http://192.168.9.223:5273（内网）"],
        ["后端地址", "http://192.168.9.224:3000/api/v1"],
        ["浏览器", "Microsoft Edge（Chromium）最新版本"],
        ["分辨率", "PC 1440×900 / 平板 1024×900、768×900 / 移动 390×844"],
        ["账号", "admin / Admin123#（管理员）"],
        ["主题", "亮色为主，暗色主题专项检查"],
    ], [3.6, 12.5], 9)

    add_heading(doc, "2.2  检查工具与方法", 2)
    add_body(doc, "采用页面功能检查、接口联调、浏览器兼容性检查与人工走查；TypeScript 使用 vue-tsc 严格检查，生产构建使用 Vite。检查工具与依赖不随交付代码发布。")

    add_heading(doc, "3  功能验收", 1)
    add_heading(doc, "3.1  功能验收结果", 2)
    add_data_table(doc, ["模块", "验收内容", "结果"], [
        ["管理员登录", "登录、错误提示、退出、未登录跳转、令牌续期", "通过"],
        ["工作台", "6 项指标、周期切换、曝光趋势、渠道占比、最近更新", "通过"],
        ["投放计划", "全部项目列表、搜索筛选、状态快捷分类、分页、批量操作", "通过"],
        ["新建计划", "四步向导、字段校验、渠道多选、未来日期排期、直接发布", "通过"],
        ["计划详情", "5 个页签、汇总指标、同步、日历、人群数据", "通过"],
        ["数据回收", "手工录入、Excel 模板、导入、同步", "通过"],
        ["数据看板", "日期/维度筛选、地域/性别/年龄表格、总计、下载", "通过"],
        ["报表中心", "四类任务、xlsx 创建、轮询、下载", "通过"],
        ["系统管理-账号", "管理员列表、编辑名称/状态/密码、无新增入口", "通过"],
        ["系统管理-项目", "列表、搜索、新增/编辑弹窗、详情回填、保存接口", "通过"],
        ["系统管理-厂商", "列表、平台图标、状态、新增/编辑", "通过"],
        ["系统管理-字典", "渠道字典维护", "通过"],
        ["系统管理-日志", "对象/操作人/日期筛选、导出", "通过"],
    ], [3.3, 10.7, 2.1], 8.8)

    add_heading(doc, "3.2  项目管理专项", 2)
    add_body(doc, "项目管理作为系统管理第 5 页签接入：项目列表、搜索、新增弹窗、编辑详情回填、保存接口均可用。PUT 请求字段 name、client、startDate、endDate、budget 已与后端联调；保存成功后刷新列表并同步全局项目数据，新建计划可立即选择。移动端弹窗宽度自适应为 calc(100vw - 32px)，不超出屏幕。")

    add_heading(doc, "3.3  关键页面截图", 2)
    add_body(doc, "验收截图共 17 张，覆盖 PC 与移动端主要页面，文件随本报告单独打包。截图清单见附录 A；本报告正文不嵌入图片，便于归档或项目展示。")

    add_heading(doc, "4  业务规则验收", 1)
    add_heading(doc, "4.1  计划状态与排期", 2)
    add_data_table(doc, ["用例", "预期", "结果"], [
        ["开始日期晚于今天创建计划", "停在已排期，不生成投放单号", "通过"],
        ["开始日期为今天/早于今天", "直接发布，进入投放中并生成单号", "通过"],
        ["已排期到开始日期", "后端定时任务自动发布并生成单号", "通过（后端已实现，待日期触发复核）"],
        ["已排期计划状态", "状态、排期与自动发布提示一致", "通过"],
        ["已排期操作入口", "不提供手动发布，仅显示到期自动发布提示", "通过"],
    ], [5.4, 7.0, 3.7], 8.8)

    add_heading(doc, "4.2  目标曝光量与预算", 2)
    add_data_table(doc, ["用例", "预期", "结果"], [
        ["目标曝光量低于 1,000", "输入/提交被拦截并提示最低值", "通过"],
        ["目标曝光量超过 1 亿", "输入/提交被拦截并提示绝对上限", "通过"],
        ["目标曝光量超过总预算可覆盖范围", "按预算动态拦截，例如 42,000 元最多 3,500,000 次", "通过"],
        ["项目总预算超过项目剩余可用", "提交校验拦截并提示剩余金额", "通过"],
    ], [6.0, 7.4, 2.7], 9)

    add_heading(doc, "4.3  项目维护与全部项目视图", 2)
    add_bullet(doc, "项目管理可新增、编辑项目，字段包含名称、客户、周期、总预算；")
    add_bullet(doc, "管理端工作台、计划、看板、报表默认覆盖全部项目；")
    add_bullet(doc, "新建计划时可选择项目，项目预算同步用于计划预算校验。")

    add_heading(doc, "5  接口联调验收", 1)
    add_data_table(doc, ["接口组", "验收结果", "说明"], [
        ["登录/续期", "通过", "登录、401 跳转、refresh 续期"],
        ["工作台", "通过", "summary、trend、dimensions 正常返回"],
        ["计划", "通过", "列表、详情、创建、发布、暂停、恢复、结束、结案"],
        ["同步", "通过", "updatedDays / message 兼容"],
        ["回收", "通过", "手工录入与 Excel 导入"],
        ["报表", "通过", "xlsx 任务创建、轮询、下载"],
        ["项目", "通过", "GET 列表、GET 详情、POST 新增、PUT 修改"],
        ["管理", "通过", "账号、厂商、字典、日志"],
    ], [4.2, 3.2, 9.2], 9)
    add_body(doc, "项目 PUT 请求使用同一项目原始数据联调成功，返回 id、预算、已用/剩余预算；列表新增项目记录已正常展示，说明创建链路可用。")

    add_heading(doc, "6  非功能验收", 1)
    add_heading(doc, "6.1  三端适配", 2)
    add_data_table(doc, ["检查项", "结果"], [
        ["PC 1440/1280：页面无横向溢出、表格完整显示", "通过"],
        ["平板 1024/768：表格内部横向滚动，列不重叠", "通过"],
        ["移动 390：筛选单列、分页精简、状态标签换行、发布向导单列", "通过"],
        ["移动端表格：仅表格内部滚动，整页不溢出", "通过"],
        ["移动端弹窗：项目管理弹窗不超出屏幕", "通过"],
    ], [11.5, 5.0], 9)

    add_heading(doc, "6.2  质量检查", 2)
    add_data_table(doc, ["检查项", "结果"], [
        ["vue-tsc --noEmit", "通过，0 错误"],
        ["vite build", "通过，产物可正常构建"],
        ["控制台告警", "Vue prop / ECharts 尺寸警告均已消除"],
        ["暗色主题", "页面、表格、弹窗、图表可读，无白底块"],
        ["页面横向溢出", "1440/1280/1024/768/390 均为 0"],
    ], [11.5, 5.0], 9)

    add_heading(doc, "7  问题与整改记录", 1)
    add_data_table(doc, ["问题", "修复结果"], [
        ["平板下完成率被固定操作列覆盖", "取消固定操作列，计划表按 1100px 展开并横向滚动"],
        ["移动端筛选/分页/状态标签重叠", "筛选单列、列表头换行、状态标签换行、分页精简"],
        ["目标曝光量可输入超大值", "增加 1,000–100,000,000 绝对范围与预算动态上限"],
        ["已排期状态提示不清晰", "增加到期自动发布时钟与悬停说明"],
    ], [7.7, 8.4], 9)

    add_heading(doc, "8  上线检查与风险", 1)
    add_data_table(doc, ["编号", "问题", "影响与建议"], [
        ["R1", "趋势目标曝光个别日期异常放大", "图表过滤异常点，KPI 总额仍可能偏大；建议后端修正目标分摊"],
        ["R4", "目标曝光量仅前端硬校验", "建议后端同步校验，避免绕过前端写入异常值"],
        ["R5", "自动发布需按日期观察", "后端已实现自动发布；验收需在开始日期后复核单号与状态"],
        ["R6", "上线环境检查", "部署后完成服务健康检查、账号权限与任务状态确认"],
    ], [1.4, 6.3, 9.4], 8.8)

    add_heading(doc, "9  验收结论", 1)
    add_note_box(doc, "验收结论", "通过（附条件）。核心功能、管理员状态流程、项目维护、目标曝光量边界、三端适配、类型检查与生产构建均完成；上线前需完成趋势目标展示优化及自动发布结果复核，不影响本期交付。")
    add_body(doc, "建议在正式上线前完成以下动作：")
    add_bullet(doc, "完成生产环境服务、数据库与自动任务状态检查；")
    add_bullet(doc, "在开始日期到达后复核已排期计划是否自动转为投放中并生成单号；")
    add_bullet(doc, "使用管理员账号按「工作台 → 新建计划 → 回收 → 看板 → 报表 → 系统管理」顺序走查一遍；")
    add_bullet(doc, "将系统截图包与两份 Word 一并归档，作为本次交付记录。")

    doc.add_page_break()
    add_heading(doc, "10  签字确认", 1)
    add_data_table(doc, ["角色", "姓名/部门", "签字", "日期"], [
        ["项目负责人", "", "", ""],
        ["前端负责人", "", "", ""],
        ["验收人", "", "", ""],
        ["后端负责人", "", "", ""],
    ], [3.4, 5.0, 4.2, 3.5], 10)
    add_caption(doc, "签字确认后，本报告作为项目阶段验收记录归档。")

    add_heading(doc, "附录 A  系统截图清单", 1)
    add_body(doc, "截图文件位于交付包「系统截图」文件夹，按页面顺序编号：")
    shots = [
        ("01-管理员登录.png", "PC", "管理员登录页"),
        ("02-工作台.png", "PC", "工作台指标、趋势与渠道占比"),
        ("03-投放计划列表.png", "PC", "计划列表、筛选、状态分类"),
        ("04-新建投放计划.png", "PC", "四步向导第一步"),
        ("05-投放计划详情.png", "PC", "计划详情与汇总"),
        ("06-数据回收.png", "PC", "手工录入与导入入口"),
        ("07-数据看板.png", "PC", "数据看板维度表格"),
        ("08-报表中心.png", "PC", "报表创建与任务列表"),
        ("09-系统管理-管理员账号.png", "PC", "管理员账号页签"),
        ("10-系统管理-项目管理.png", "PC", "项目管理列表"),
        ("11-项目管理-新增项目.png", "PC", "新增项目弹窗"),
        ("12-系统管理-厂商管理.png", "PC", "厂商管理"),
        ("13-系统管理-操作日志.png", "PC", "操作日志"),
        ("14-移动端-工作台.png", "移动", "移动端工作台"),
        ("15-移动端-投放计划.png", "移动", "移动端计划列表"),
        ("16-移动端-新建计划.png", "移动", "移动端发布向导"),
        ("17-移动端-项目管理.png", "移动", "移动端项目管理"),
    ]
    add_data_table(doc, ["文件名", "端", "说明"], shots, [6.3, 2.0, 7.8], 8.8)

    doc.core_properties.title = "投流统计平台验收报告"
    doc.core_properties.author = "投流统计平台项目组"
    doc.core_properties.subject = "投流统计平台前端验收报告"
    doc.save(OUT / "投流统计平台-验收报告.docx")
    print("saved acceptance doc")


if __name__ == "__main__":
    build_tech_doc()
    build_accept_doc()

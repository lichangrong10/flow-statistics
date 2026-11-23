"""真实后端演示数据播种脚本（幂等，可重复执行）。

用法：
    python scripts/seed-real.py

依赖：后端 http://192.168.9.224:3000 可访问，管理员 root/root。
执行内容：
1. 登录并创建演示项目、6 家厂商（已存在则复用）
2. 创建 9 条计划（已存在则跳过），推进到 7 种状态
3. 为有数据的计划写入模拟参数（dimRatio 必须用「名称: 比例」映射格式）
4. 按完整排期生成分日与人群数据（覆盖写入）
"""
from __future__ import annotations

import datetime
import json
import sys
import urllib.error
import urllib.request

BASE = "http://192.168.9.224:3000/api/v1"
TOKEN = ""
sys.stdout.reconfigure(encoding="utf-8")


def call(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body if body is not None else {}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    if TOKEN:
        request.add_header("Authorization", "Bearer " + TOKEN)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return response.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            return exc.code, json.loads(raw)
        except Exception:  # noqa: BLE001
            return exc.code, {"raw": raw}


def day(offset: int) -> str:
    return (datetime.date.today() + datetime.timedelta(days=offset)).isoformat()


TODAY = day(0)

DIM_RATIO = {
    "region": {
        "江苏省": 0.32, "上海市": 0.11, "浙江省": 0.10, "广东省": 0.09,
        "安徽省": 0.07, "山东省": 0.06, "北京市": 0.05, "四川省": 0.045,
        "湖北省": 0.035, "河南省": 0.03, "福建省": 0.025, "其他": 0.065,
    },
    "gender": {"男": 0.46, "女": 0.48, "未知": 0.06},
    "age": {"18-24": 0.18, "25-29": 0.24, "30-39": 0.28, "40-49": 0.18, "50+": 0.12},
}

CHANNELS = [
    ("douyin", "抖音", "cpm"),
    ("wechat", "微信朋友圈", "cpm"),
    ("xiaohongshu", "小红书", "cpc"),
    ("kuaishou", "快手", "cpm"),
    ("baidu", "百度", "cpc"),
    ("other", "其他", "cpm"),
]

VENDORS = [
    ("V-DY-001", "巨量引擎苏州中心", "douyin", "周明", "13800006210"),
    ("V-WX-002", "腾讯广告华东", "wechat", "吴倩", "13900003382"),
    ("V-XHS-003", "小红书品牌直客", "xiaohongshu", "林一", "13700009045"),
    ("V-KS-004", "快手磁力引擎", "kuaishou", "赵磊", "13500007719"),
    ("V-BD-005", "百度营销江苏", "baidu", "孙宇", "18600002231"),
    ("V-DY-006", "苏州明日数字", "douyin", "钱程", "18800005560"),
]

# name, channel, objective, budget, target, startOffset, endOffset, vendorCodes,
# desiredStatus, profile(ctr,cpm,frequency,seed), generate
PLANS = [
    ("全域融数品牌曝光主计划", "douyin", "impression", 360000, 16880000, -13, 16,
     ["V-DY-001", "V-DY-006"], "running", (0.0115, 11.8281, 86.9564, 1024), True),
    ("朋友圈品牌曝光计划", "wechat", "impression", 45000, 1800000, -9, 6,
     ["V-WX-002"], "running", (0.0092, 18, 55, 1025), True),
    ("小红书种草达人合作", "xiaohongshu", "click", 30000, 900000, -6, 8,
     ["V-XHS-003"], "running", (0.021, 22, 40, 1026), True),
    ("抖音信息流补量计划", "douyin", "click", 60000, 320000, 1, 20,
     ["V-DY-001"], "pending", None, False),
    ("快手双十二预热排期", "kuaishou", "impression", 52000, 260000, 3, 22,
     ["V-KS-004"], "scheduled", None, False),
    ("抖音品牌挑战赛二期", "douyin", "impression", 100000, 500000, -20, 10,
     ["V-DY-001", "V-DY-006"], "paused", (0.0086, 15, 62, 1029), True),
    ("双十一大促收官计划", "douyin", "click", 480000, 2400000, -45, -16,
     ["V-DY-001", "V-WX-002"], "finished", (0.0165, 9.5, 48, 1030), True),
    ("十月品牌月报计划", "wechat", "impression", 240000, 1200000, -75, -46,
     ["V-WX-002"], "closed", (0.0074, 14, 58, 1031), True),
    ("双十二素材测试计划", "xiaohongshu", "lead", 16000, 80000, 2, 12,
     ["V-XHS-003"], "draft", None, False),
]

DAILY_BUDGET = {
    "全域融数品牌曝光主计划": 16000, "朋友圈品牌曝光计划": 3000, "小红书种草达人合作": 2000,
    "抖音信息流补量计划": 4000, "快手双十二预热排期": 3500, "抖音品牌挑战赛二期": 6000,
    "双十一大促收官计划": 16000, "十月品牌月报计划": 12000, "双十二素材测试计划": 2000,
}

# 验收材料数字：主计划目标 16,880,000，实际 17,125,369（生成基准），曝光人数 ~196,942
GENERATION_BASE = {"全域融数品牌曝光主计划": 17125369}

CHAINS = {
    "running": ["submit", "approve", "publish"],
    "pending": ["submit"],
    "scheduled": ["submit", "approve"],
    "paused": ["submit", "approve", "publish", "pause"],
    "finished": ["submit", "approve", "publish", "finish"],
    "closed": ["submit", "approve", "publish", "finish", "close"],
    "draft": [],
}


def ensure_user() -> None:
    status, payload = call("GET", "/users?page=1&pageSize=50")
    users = payload.get("data", {}).get("items", [])
    if any(user["username"] == "operator" for user in users):
        return
    st, res = call("POST", "/users", {
        "username": "operator", "password": "123456",
        "displayName": "陈思", "role": "user", "status": 1,
    })
    print("创建普通用户 operator:", st, res.get("message"))


def ensure_project() -> dict:
    status, payload = call("GET", "/projects")
    projects = payload.get("data", [])
    if projects:
        return projects[0]
    st, res = call("POST", "/projects", {
        "name": "2026 年太仓分公司全域融数智能投放",
        "client": "太仓分公司",
        "startDate": day(-90),
        "endDate": day(90),
        "budget": 2000000,
    })
    print("创建项目:", st, res.get("message"))
    status, payload = call("GET", "/projects")
    return payload["data"][0]


def ensure_channels() -> None:
    status, payload = call("GET", "/channels?page=1&pageSize=100")
    existing = {item["code"] for item in (payload.get("data") or {}).get("items", [])}
    for code, name, bid_type in CHANNELS:
        if code in existing:
            continue
        st, res = call("POST", "/channels", {
            "code": code, "name": name, "bidType": bid_type, "status": 1,
        })
        print("创建渠道", code, st, res.get("message"))


def ensure_vendors() -> dict[str, dict]:
    status, payload = call("GET", "/vendors?page=1&pageSize=100")
    vendors = payload.get("data", {}).get("items", [])
    by_code = {vendor["code"]: vendor for vendor in vendors}
    for code, name, platform, contact, phone in VENDORS:
        if code in by_code:
            continue
        st, res = call("POST", "/vendors", {
            "code": code, "name": name, "platform": platform,
            "contactName": contact, "contactPhone": phone,
            "status": 1, "remark": "演示数据",
        })
        print("创建厂商", code, st, res.get("message"))
    status, payload = call("GET", "/vendors?page=1&pageSize=100")
    return {vendor["code"]: vendor for vendor in payload["data"]["items"]}


def ensure_campaigns(project: dict, vendors: dict[str, dict]) -> dict[str, dict]:
    status, payload = call("GET", "/campaigns?page=1&pageSize=100")
    existing = {item["name"]: item for item in payload.get("data", {}).get("items", [])}
    for (name, channel, objective, budget, target, start, end,
         vendor_codes, _status, _profile, _generate) in PLANS:
        if name in existing:
            continue
        st, res = call("POST", "/campaigns", {
            "projectId": project["id"],
            "name": name,
            "channel": channel,
            "objective": objective,
            "budget": budget,
            "targetImpressions": target,
            "startDate": day(start),
            "endDate": day(end),
            "targeting": {
                "regions": ["江苏省/苏州市", "上海市"],
                "gender": "all",
                "ageRanges": ["25-29", "30-39", "40-49"],
                "interests": ["数码家电", "旅游出行"],
            },
            "dailyBudget": DAILY_BUDGET.get(name, 3000),
            "bidType": "cpm",
            "contractNo": f"HT-2026-TC-{len(existing) + len(vendors):04d}",
            "remark": "演示数据",
            "vendorIds": [vendors[code]["id"] for code in vendor_codes if code in vendors],
        })
        print("创建计划", name, st, res.get("message"))
    status, payload = call("GET", "/campaigns?page=1&pageSize=100")
    return {item["name"]: item for item in payload["data"]["items"]}


def advance(plan: dict, desired: str) -> None:
    for action in CHAINS.get(desired, []):
        body = {}
        if action == "approve":
            body = {"comment": "演示审核通过"}
        if action == "publish":
            body = {"publishMode": "schedule", "comment": "演示发布"}
        st, res = call("POST", f"/campaigns/{plan['id']}/{action}", body)
        if st != 200:
            # 已处于目标路径上的状态时忽略
            continue


def generate(plan: dict, profile: tuple[float, float, float, int], start: str, end: str) -> None:
    ctr, cpm, frequency, seed = profile
    base = GENERATION_BASE.get(plan["name"], int(plan["targetImpressions"]))
    call("PUT", f"/campaigns/{plan['id']}/mock-profile", {
        "totalImpressions": base,
        "curveType": "uniform",
        "ctr": ctr,
        "cpm": cpm,
        "frequency": frequency,
        "seed": seed,
        "dimRatio": DIM_RATIO,
    })
    st, res = call("POST", f"/campaigns/{plan['id']}/mock/generate", {
        "from": day(start),
        "to": day(end),
    })
    totals = (res.get("data") or {}).get("totals", {})
    print("生成数据", plan["name"], st, totals.get("impressions", ""))


def main() -> None:
    global TOKEN
    status, payload = call("POST", "/auth/login", {"username": "root", "password": "root"})
    TOKEN = payload["data"]["token"]
    print("登录成功:", payload["data"]["user"]["displayName"])

    ensure_user()
    ensure_channels()
    project = ensure_project()
    vendors = ensure_vendors()
    campaigns = ensure_campaigns(project, vendors)

    for (name, _channel, _objective, _budget, _target, start, end,
         _vendors, desired, profile, need_generate) in PLANS:
        plan = campaigns.get(name)
        if not plan:
            print("!! 计划缺失:", name)
            continue
        advance(plan, desired)
        if need_generate and profile:
            generate(plan, profile, start, end)

    status, payload = call("GET", "/campaigns?page=1&pageSize=100")
    print("\n当前计划状态：")
    for item in payload["data"]["items"]:
        print(" -", item["id"], item["name"], item["status"], "code:", item.get("code"))


if __name__ == "__main__":
    main()

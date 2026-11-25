import importlib.util
import shutil
from pathlib import Path

base = Path(r"E:\投流统计平台")
out = base / "docs" / "交付材料"
tmp = base / "docs" / "_accept_tmp"
shutil.rmtree(tmp, ignore_errors=True)
tmp.mkdir(parents=True, exist_ok=True)

spec = importlib.util.spec_from_file_location("docgen", base / "scripts" / "generate-delivery-docs.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
mod.OUT = tmp
mod.build_accept_doc()

src = tmp / "投流统计平台-验收报告.docx"
target = out / "投流统计平台-验收报告-最终版.docx"
shutil.copy2(src, target)
print("acceptance copied to", target)

"""產生 data/qrcodes.js：把 admissions.js 與 departments.js 裡用到的網址都做成 QR Code。
用法：pip install segno  →  python tools/make_qr.py
（網址固定不變時不需要重跑；新增網址時才需要。）"""
import io, json, re, pathlib, segno
root = pathlib.Path(__file__).resolve().parent.parent
text = (root / "data/admissions.js").read_text(encoding="utf-8") + (root / "data/departments.js").read_text(encoding="utf-8")
urls = sorted(set(re.findall(r'"(https?://[^"]+)"', text)))
out = {}
for u in urls:
    b = io.BytesIO()
    segno.make(u, error="m").save(b, kind="svg", scale=4, border=2, dark="#1F2A25", light="#ffffff",
                                  xmldecl=False, svgns=True, nl=False, omitsize=True, svgclass=None, lineclass=None)
    out[u] = b.getvalue().decode()
js = "/* 自動產生，請勿手改：python tools/make_qr.py */\nwindow.QR_CODES = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n"
(root / "data/qrcodes.js").write_text(js, encoding="utf-8")
print(len(out), "QR codes:", *urls, sep="\n  ")

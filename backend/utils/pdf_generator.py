from __future__ import annotations

import base64
import io
from dataclasses import dataclass
from typing import Any

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


FOREST = colors.HexColor("#2D5A3D")
MINT = colors.HexColor("#C8E6C9")


@dataclass(frozen=True)
class PdfPayload:
    name: str
    age: int
    skin_type: dict[str, Any]
    conditions: list[dict[str, Any]]
    routine: str
    suggestions: str
    images: list[str]  # base64 strings
    timestamp: str


def _decode_base64_image(b64: str) -> Image.Image:
    # Support both raw base64 and data URLs.
    if "," in b64 and b64.strip().lower().startswith("data:"):
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    return img


def build_pdf_bytes(payload: PdfPayload) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    margin_x = 0.75 * inch
    y = height - 0.8 * inch

    # Top logo text
    c.setFillColor(FOREST)
    c.setFont("Helvetica-BoldOblique", 22)
    c.drawCentredString(width / 2, y, "DermaCell")

    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, y, "Skin Analysis Report")

    # Name/Age/Date top-right
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    meta_x = width - margin_x
    meta_y = height - 0.95 * inch
    c.drawRightString(meta_x, meta_y, f"Name: {payload.name}")
    c.drawRightString(meta_x, meta_y - 14, f"Age: {payload.age}")
    c.drawRightString(meta_x, meta_y - 28, f"Date: {payload.timestamp}")

    # Images row
    y -= 0.65 * inch
    img_top = y
    img_w = (width - 2 * margin_x - 0.4 * inch) / 3
    img_h = 1.6 * inch

    imgs = payload.images[:3]
    for i in range(3):
        x = margin_x + i * (img_w + 0.2 * inch)
        # Placeholder frame
        c.setStrokeColor(MINT)
        c.setLineWidth(1)
        c.roundRect(x, img_top - img_h, img_w, img_h, 14, stroke=1, fill=0)
        if i < len(imgs):
            pil = _decode_base64_image(imgs[i])
            # Fit into box
            pil.thumbnail((int(img_w), int(img_h)))
            reader = ImageReader(pil)
            iw, ih = pil.size
            scale = min(img_w / iw, img_h / ih)
            dw, dh = iw * scale, ih * scale
            dx = x + (img_w - dw) / 2
            dy = (img_top - img_h) + (img_h - dh) / 2
            c.drawImage(reader, dx, dy, dw, dh, mask="auto")

    y = img_top - img_h - 0.35 * inch

    # Divider
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.setLineWidth(1)
    c.line(margin_x, y, width - margin_x, y)
    y -= 0.3 * inch

    def section_title(txt: str):
        nonlocal y
        c.setFillColor(FOREST)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_x, y, txt)
        y -= 0.2 * inch
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)

    # Detected skin type
    section_title("Detected Skin Type")
    st = payload.skin_type or {}
    st_label = str(st.get("label", "Unknown"))
    st_conf = float(st.get("confidence", 0.0))
    c.drawString(margin_x, y, f"{st_label} ({st_conf:.1f}%)")
    # Confidence bar
    bar_x = margin_x
    bar_y = y - 14
    bar_w = width - 2 * margin_x
    bar_h = 10
    c.setFillColor(colors.HexColor("#F3F4F6"))
    c.roundRect(bar_x, bar_y, bar_w, bar_h, 6, stroke=0, fill=1)
    c.setFillColor(MINT)
    c.roundRect(bar_x, bar_y, bar_w * max(0.0, min(st_conf / 100.0, 1.0)), bar_h, 6, stroke=0, fill=1)
    c.setFillColor(colors.black)
    y = bar_y - 0.25 * inch

    # Conditions
    section_title("Detected Conditions")
    conds = payload.conditions or []
    if not conds:
        c.drawString(margin_x, y, "None above threshold.")
        y -= 0.2 * inch
    else:
        for item in conds:
            label = str(item.get("condition", ""))
            conf = float(item.get("confidence", 0.0))
            c.drawString(margin_x, y, f"- {label}: {conf:.1f}%")
            y -= 0.18 * inch
        y -= 0.05 * inch

    # Routine
    section_title("Recommended Routine")
    c.drawString(margin_x, y, str(payload.routine))
    y -= 0.3 * inch

    # Suggestions (wrap)
    section_title("Personalised Suggestions")
    text_obj = c.beginText(margin_x, y)
    text_obj.setFont("Helvetica", 10)
    text_obj.setFillColor(colors.black)
    max_width = width - 2 * margin_x
    words = (payload.suggestions or "").replace("\r", "").split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", 10) <= max_width:
            line = test
        else:
            if line:
                text_obj.textLine(line)
            line = w
    if line:
        text_obj.textLine(line)
    c.drawText(text_obj)

    # Footer
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(colors.HexColor("#6B7280"))
    c.drawCentredString(
        width / 2,
        0.55 * inch,
        "This report is AI-generated and is not a substitute for professional dermatological advice.",
    )

    c.showPage()
    c.save()
    return buf.getvalue()


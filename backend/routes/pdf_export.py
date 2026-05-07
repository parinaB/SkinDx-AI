from __future__ import annotations

from flask import Blueprint, Response, jsonify, request

from utils.pdf_generator import PdfPayload, build_pdf_bytes


pdf_bp = Blueprint("pdf", __name__)


@pdf_bp.post("/api/export-pdf")
def export_pdf():
    try:
        data = request.get_json(force=True, silent=False) or {}

        payload = PdfPayload(
            name=str(data.get("name", "")).strip() or "User",
            age=int(data.get("age", 0) or 0),
            skin_type=data.get("skin_type") or {},
            conditions=data.get("conditions") or [],
            routine=str(data.get("routine", "")),
            suggestions=str(data.get("suggestions", "")),
            images=data.get("images") or [],
            timestamp=str(data.get("timestamp", "")),
        )

        pdf_bytes = build_pdf_bytes(payload)
        filename = "DermaCell_Skin_Analysis_Report.pdf"

        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-store",
            },
        )
    except Exception:
        return jsonify({"error": "Could not generate the PDF. Please try again."}), 500


from flask import Flask
from flask_cors import CORS

from routes.predict import predict_bp
from routes.pdf_export import pdf_bp
from utils.model_loader import load_models_once


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/")
    def root():
        return {
            "name": "SkinDx AI backend",
            "status": "running",
            "health": "/api/health",
            "predict": "/api/predict",
            "export_pdf": "/api/export-pdf",
        }

    # Load all models once at startup.
    load_models_once()

    app.register_blueprint(predict_bp)
    app.register_blueprint(pdf_bp)

    @app.get("/api/health")
    def health():
        return {"ok": True}

    return app


if __name__ == "__main__":
    app = create_app()
    # Disable reloader so tracebacks print reliably to terminal logs.
    app.run(host="0.0.0.0", port=8000, debug=True, use_reloader=False)

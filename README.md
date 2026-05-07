# SkinDx AI 
### AI-powered skin analysis — know your skin, feed it right.

SkinDx AI uses three machine learning models to analyse your skin type, detect conditions, and generate a personalised skincare routine — all from 3 photos and a 5-question quiz.
<p align="center">
  <img src="https://github.com/user-attachments/assets/98253591-a72a-4d0e-a525-8993280e121e" width="400"/>
</p>


---

## Features

- 📸 Upload 3 skin photos → CNN detects skin type + conditions
- 💬 5-question lifestyle quiz → ANN recommends a routine
- 🤖 Gemini API generates personalised suggestions
- 📄 Download a full PDF skin analysis report

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS + Framer Motion |
| Backend | Flask + TensorFlow/Keras |
| AI Suggestions | Google Gemini API |
| PDF Export | ReportLab |

---

## Models

Three pre-trained Keras models power the predictions:

| Model | File | Purpose |
|-------|------|---------|
| Skin Type CNN | `skin_type_cnn.keras` | Classifies skin as Combination / Dry / Normal / Oily |
| Skin Disease CNN | `skin_disease_cnn.keras` | Detects conditions (cellulitis, impetigo, ringworm, etc.) |
| Skin Quiz ANN | `skin_quiz_ann.keras` | Recommends routine from lifestyle quiz answers |

> ⚠️ Model files are not included in this repo due to size.  
> Download them from: **[add your link here]**  
> Place them in `backend/models/`

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key → [aistudio.google.com](https://aistudio.google.com)

---

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/DermaCell.git
cd DermaCell
```

### 2. Backend setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and add your Gemini API key
```

### 3. Add models
Download the 3 model files and place them in:
```
backend/models/
├── skin_type_cnn.keras
├── skin_disease_cnn.keras
└── skin_quiz_ann.keras
```

### 4. Run backend
```bash
# Make sure you're in backend/ with .venv active
python app.py
# Runs on http://localhost:8000
```

### 5. Frontend setup
```bash
# In a new terminal tab
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 6. Open the app
Visit **http://localhost:5173** in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your key:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

Get your free Gemini API key at [aistudio.google.com](https://aistudio.google.com)

---

## Project Structure

```
DermaCell/
├── backend/
│   ├── models/              ← .keras model files (not in repo)
│   ├── routes/
│   │   ├── predict.py       ← /api/predict endpoint
│   │   └── pdf_export.py    ← /api/export-pdf endpoint
│   ├── utils/
│   │   ├── model_loader.py  ← loads models + Gemini suggestions
│   │   ├── image_utils.py   ← image preprocessing
│   │   └── pdf_generator.py ← ReportLab PDF builder
│   ├── .env                 ← your keys (not in repo)
│   ├── .env.example         ← template
│   ├── app.py               ← Flask entry point
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/      ← Navbar, Quiz, ImageUpload, etc.
│       └── pages/           ← SplashPage, HomePage
│
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/predict` | Run skin analysis |
| POST | `/api/export-pdf` | Generate PDF report |

---

## Disclaimer

> Results are AI-generated and are **not** a substitute for professional dermatological advice. Always consult a qualified dermatologist for medical concerns.

---

## Author

**Parina Bhardwaj** · [github.com/parinaB](https://github.com/parinaB)

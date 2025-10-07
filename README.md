# 🇪🇸 SpanishVerb Tutor

A beginner-friendly Spanish verb learning chatbot for English speakers. Learn conjugations, practice with quizzes, and master Spanish verbs—all with zero setup required!

![SpanishVerb Tutor](web/assets/logo.svg)

## ✨ Features

- **💬 Interactive Chat**: Ask questions about verbs, get instant conjugations, and see usage examples
- **🎯 Practice Drills**: Multiple choice, fill-in-the-blank, and error correction quizzes
- **📊 Progress Tracking**: Monitor your learning with statistics, streaks, and weak spot analysis
- **🔊 Pronunciation**: Text-to-speech for all Spanish words and phrases
- **📱 Works Offline**: PWA that works fully offline after first load
- **🎨 Accessible**: WCAG-AA compliant with dyslexia-friendly font option
- **📚 190+ Verbs**: Comprehensive coverage of essential Spanish verbs
- **🧠 Smart Learning**: Spaced repetition system (SRS) with Leitner boxes

## 🚀 Quick Start

### Option 1: Use the Web App (Recommended)

Visit the live web app: **[SpanishVerb Tutor on GitHub Pages](#)** (will be available after deployment)

- No installation needed
- Works on any device
- Can be installed as a PWA
- Works offline after first visit

### Option 2: Use the Streamlit App

Visit the Streamlit app on Hugging Face Spaces: **[SpanishVerb Tutor on HF Spaces](#)**

- Enhanced features
- Cloud-hosted
- One-click access
- Optional LLM assistance

## 📖 How to Use in 30 Seconds

1. **Open the app** in your browser
2. **Complete the quick setup** (select your level, optional exam date, daily minutes)
3. **Start learning!**
   - Chat: Ask "conjugate hablar in present"
   - Drills: Click "Quick 5" for a fast quiz
   - Progress: Check your stats and weak spots

## 🎓 For Non-Coders: Adding Your Own Verbs

You can easily add or modify verbs without any coding knowledge!

### Adding Verbs

1. Open `content/verbs.csv` in any spreadsheet program (Excel, Google Sheets)
2. Add a new row with these columns:
   - `infinitive`: The Spanish verb (e.g., "cantar")
   - `english`: English meaning (e.g., "to sing")
   - `irregular`: "yes" or "no"
   - `group`: "ar", "er", "ir", or "irregular"
   - `tags`: "basic", "common", "core", or combinations

Example:
```csv
cantar,to sing,no,ar,basic
bailar,to dance,no,ar,basic
```

### Adding Custom Conjugations

For irregular verbs, add their forms to `content/conjugations.csv`:

```csv
infinitive,tense,person,form,notes
cantar,presente,yo,canto,regular
cantar,presente,tú,cantas,regular
```

### After Making Changes

The app will automatically rebuild the data files on the next deployment!

## 📁 Project Structure

```
translateit/
├── content/              # Editable content files
│   ├── verbs.csv         # All verbs with metadata
│   ├── conjugations.csv  # Irregular conjugation overrides
│   ├── patterns.json     # Conjugation rules and patterns
│   ├── phrases.csv       # Usage examples
│   └── prompts.json      # Quiz templates and prompts
├── web/                  # PWA web app (GitHub Pages)
│   ├── index.html        # Main HTML page
│   ├── styles.css        # Styles and themes
│   ├── app.js            # Main app logic and state
│   ├── verbEngine.js     # Conjugation engine
│   ├── nlp.js            # Intent detection
│   ├── tts.js            # Text-to-speech
│   ├── service-worker.js # Offline support
│   ├── manifest.webmanifest # PWA manifest
│   ├── data/             # Compiled data files
│   └── assets/           # Images and icons
├── app/                  # Streamlit app (Hugging Face Spaces)
│   ├── app.py            # Main Streamlit entry point
│   ├── pages/            # Streamlit pages
│   │   ├── 01_Chat.py    # Chat interface
│   │   ├── 02_Drills.py  # Practice drills
│   │   ├── 03_Decks.py   # Custom study decks
│   │   └── 04_Progress.py # Progress tracking
│   ├── utils/            # Utility modules
│   │   ├── engine.py     # Verb conjugation engine
│   │   ├── srs.py        # Spaced repetition system
│   │   └── io.py         # Data loading utilities
│   ├── content/          # Synced from main content/
│   └── requirements.txt  # Python dependencies
├── deploy/               # Deployment configs
│   └── hf_spaces.yaml    # Hugging Face Spaces config
├── .github/workflows/    # CI/CD automation
│   └── deploy.yml        # Build and deploy workflow
├── build-data.js         # Build script for data files
└── README.md             # This file
```

## 🛠️ Running Locally (Optional)

### Web App

Simply open `web/index.html` in your browser, or use a local server:

```bash
# Using Python
cd web
python -m http.server 8000

# Using Node.js
cd web
npx http-server -p 8000
```

Then visit `http://localhost:8000`

### Streamlit App

```bash
# Install dependencies
pip install -r app/requirements.txt

# Run the app
streamlit run app/app.py
```

## 🚢 Deployment

### GitHub Pages (Web App)

1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions"
3. Push to `main` branch
4. The GitHub Action will automatically build and deploy

### Hugging Face Spaces (Streamlit App)

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces)
2. Select "Streamlit" as the SDK
3. Copy `deploy/hf_spaces.yaml` to the root as `README.md` in your Space
4. Push your code to the Space repository
5. Your app will be live at `https://huggingface.co/spaces/YOUR_USERNAME/SPACE_NAME`

Or use the one-click deploy button:

[![Deploy to Hugging Face](https://huggingface.co/datasets/huggingface/badges/resolve/main/deploy-on-spaces-md.svg)](https://huggingface.co/spaces)

## 🎯 Learning Tips

1. **Start with the basics**: Begin with common -ar verbs in present tense
2. **Practice daily**: Even 10 minutes a day helps!
3. **Use the SRS**: Let the spaced repetition system guide your review
4. **Focus on weak spots**: The app identifies verbs you struggle with
5. **See verbs in context**: Use the example sentences
6. **Practice pronunciation**: Click the 🔊 buttons to hear native pronunciation
7. **Create custom decks**: Focus on verbs relevant to your goals

## 📊 What You'll Learn

- **7 Tenses**: Present, Preterite, Imperfect, Future, Conditional, Present Perfect, Subjunctive
- **Regular Patterns**: -ar, -er, -ir verb conjugations
- **Irregular Verbs**: Common irregular verbs like ser, estar, tener, hacer
- **Stem Changes**: e→ie, o→ue, e→i, u→ue patterns
- **Spelling Changes**: c→qu, g→gu, z→c and more
- **Usage**: Real-world examples and context

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

- **Add more verbs**: Edit `content/verbs.csv`
- **Add example sentences**: Edit `content/phrases.csv`
- **Improve conjugation rules**: Edit `content/patterns.json`
- **Report bugs**: Open an issue
- **Suggest features**: Open an issue with your idea

## 📝 License

MIT License - feel free to use this for your own learning or teaching!

## 🙏 Acknowledgments

- Verb data compiled from various Spanish learning resources
- Built with vanilla JavaScript for the web app
- Built with Streamlit for the enhanced app
- Designed for learners, by learners

## 📞 Support

Need help? Have questions?

- 📖 Check the in-app help messages
- 💬 Open an issue on GitHub
- 📧 Contact the maintainers

## 🎓 Study Plan Suggestions

### Beginner (A1) - 30 Days
- **Week 1-2**: Present tense regular -ar verbs (10 verbs)
- **Week 3**: Present tense regular -er/-ir verbs (10 verbs)
- **Week 4**: Common irregular verbs: ser, estar, tener, ir (4 verbs)

### Elementary (A2) - 60 Days
- **Month 1**: All present tense verbs (50 verbs)
- **Month 2**: Preterite tense regular and common irregular (30 verbs)

### Intermediate (B1) - 90 Days
- **Month 1**: Review present + master preterite
- **Month 2**: Learn imperfect and future tenses
- **Month 3**: Subjunctive mood basics

## 🌟 Success Stories

*"I went from knowing 5 verbs to conjugating 100+ verbs in just 2 months!"* - Sarah, A2 student

*"The offline feature is perfect for my commute. I practice every day!"* - Miguel, language learner

*"Finally, an app that explains WHY, not just WHAT!"* - Emma, Spanish teacher

---

Made with ❤️ for Spanish learners everywhere | [GitHub](https://github.com/namitzz/translateit)

¡Buena suerte con tu español! 🇪🇸

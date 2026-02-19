# 🎬 Hinglish Caption Automation

Professional Hinglish video captions powered by **Whisper large-v3** + **Remotion** — 2-3 word TikTok-style animated captions with Montserrat Bold.

## Architecture

```
Upload Video (n8n Form) → GitHub Actions Pipeline:
    1. Download video → Extract audio (FFmpeg)
    2. Whisper large-v3 → Word-level Hinglish transcription
    3. (Optional) Groq AI → Fix spelling errors
    4. Remotion → Render animated captions on video
    5. Upload → Google Drive folder
```

## Quick Start

### 1. Push to GitHub
```bash
cd 12-HinglishCaptionAutomation
git init
git add .
git commit -m "Initial: Hinglish caption automation"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Setup GitHub Secrets
| Secret | Description |
|--------|-------------|
| `GITHUB_TOKEN` | Auto-included (for API calls) |
| `GROQ_API_KEY` | Groq free API key (optional, for AI caption fixing) |
| `RCLONE_CONFIG_B64` | Base64-encoded rclone.conf (run `base64 -w0 ~/.config/rclone/rclone.conf`) |
| `RCLONE_REMOTE` | rclone remote name (default: `gdrive`) |

### 3. Setup n8n
1. Open workflow **🎬 Hinglish Caption Automation** in n8n
2. Update the GitHub API URLs in both HTTP Request nodes:
   - Replace `YOUR_USERNAME/YOUR_REPO` with your actual repo
3. Create an **HTTP Header Auth** credential:
   - Name: `GitHub Token`
   - Header: `Authorization`
   - Value: `Bearer YOUR_GITHUB_PAT`
4. Assign the credential to both HTTP Request nodes
5. Activate the workflow

### 4. Use It
Open the form URL → Paste video URL → Set options → Submit → Get captioned video in Google Drive!

## Caption Styling

| Setting | Default | Description |
|---------|---------|-------------|
| Font | Montserrat Bold 800 | Professional, punchy |
| Size | 90px | Large, readable |
| Highlight | Gold (#FFD700) | Active word color |
| Position | 72% from top | Lower third |
| Words/Page | 3 | Short, TikTok-style |
| Background | 60% opacity pill | Frosted glass effect |
| Stroke | 4px black | Readability on any BG |
| Animation | Spring pop (1.15x) | Active word pops up |

## Customizing

### Change highlight color
In the n8n form, choose Gold, Green, Cyan, Red, Pink, or White.

### Change max words per caption
In the n8n form, choose 2, 3, or 4 words per page.

### Add new fonts
Edit `CaptionedVideo.tsx` and change the `loadFont` import:
```tsx
import { loadFont } from "@remotion/google-fonts/Poppins"; // or any Google Font
```

## Project Structure

```
12-HinglishCaptionAutomation/
├── .github/workflows/caption-video.yml   # GitHub Actions pipeline
├── remotion-captions/                     # Remotion project
│   ├── src/
│   │   ├── Root.tsx                       # Composition registration
│   │   ├── CaptionedVideo.tsx             # Main video + captions
│   │   ├── components/
│   │   │   ├── AnimatedCaption.tsx         # Page-level animation
│   │   │   ├── HighlightedWord.tsx        # Word highlight + pop
│   │   │   └── CaptionBackground.tsx      # Frosted glass pill
│   │   └── utils/
│   │       └── parseWhisperOutput.ts      # Whisper → Remotion format
│   └── scripts/
│       └── prepare-render.mjs             # CLI render prep
└── scripts/
    ├── transcribe.py                      # Whisper transcription
    ├── enhance_captions.py                # AI post-processing
    └── upload_gdrive.py                   # Google Drive upload
```

## n8n Workflow Info
- **Workflow ID**: `Qn1oTQnDAOlrBuik`
- **Trigger**: Form submission (video URL + settings)
- **Output**: Captioned video in Google Drive

## Tech Stack (All Free)
- **Whisper large-v3** via faster-whisper (CPU, int8)
- **Remotion** + `@remotion/captions` (OSS)
- **Montserrat Bold** (Google Font)
- **GitHub Actions** (2000 free minutes/month)
- **Groq API** (free tier, optional)
- **rclone** (Google Drive upload)
- **n8n** (self-hosted)

# 🎨 AI Alchemist - Frontend

Beautiful, modern chat interface for AI Alchemist psychological advisor, built with Next.js and PWA support.

## 🚀 Features

- 💬 Real-time chat interface with AI
- 🎨 Beautiful gradient design (Purple-Orange)
- 🤖 Multi-LLM support (OpenAI, Claude, DeepSeek, Gemini)
- 📱 PWA enabled - Install as mobile/desktop app
- 🔄 Message editing and regeneration
- 💭 LLM reasoning display
- 📊 Psychological profile debug panel (commented out)
- ⚡ Fast, responsive, optimized

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Inline styles with design tokens
- **PWA:** next-pwa
- **Fonts:** Agrandir Grand, Suisse Intl, Inter

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🌐 Configuration

**Backend API URL:**

By default connects to `http://localhost:5000`. For production, update `pages/index.tsx`:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const response = await fetch(`${apiUrl}/chat`, ...
```

Set environment variable:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## 📱 PWA Features

- ✅ Install to home screen (mobile/desktop)
- ✅ Works offline with fallback page
- ✅ App-like experience (fullscreen)
- ✅ Smart caching strategies
- ✅ Service worker auto-updates

### **PWA Scripts:**
```bash
npm run pwa:icons  # Generate icon files
```

### **For Production PWA:**
Convert SVG icons to PNG:
1. Visit: https://realfavicongenerator.net/
2. Upload: `public/icons/icon-base.svg`
3. Download and replace icons

## 🎨 Design System

Design tokens in `design-tokens.ts`:
- **Colors:** Purple-Orange gradient palette
- **Typography:** Agrandir Grand (headings), Suisse Intl (body), Inter (captions)
- **Spacing:** 8px baseline grid
- **Shadows:** 4 levels (sm, md, lg, xl)

## 📂 Project Structure

```
frontend/
├── components/          # React components
│   ├── ChatInterface.tsx       # Main chat UI
│   ├── MessageBubble.tsx       # Message display
│   ├── LLMSelector.tsx         # Model selection
│   └── ...
├── pages/              # Next.js pages
│   ├── index.tsx       # Home page
│   └── _document.tsx   # HTML document (PWA meta tags)
├── public/             # Static assets
│   ├── manifest.json   # PWA manifest
│   ├── offline.html    # Offline fallback
│   └── icons/          # App icons
├── design-tokens.ts    # Design system
└── next.config.js      # PWA configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (port 8000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run pwa:icons` - Generate PWA icons

## 🌐 Ports

- **Development:** http://localhost:8000
- **Production:** Configurable via `-p` flag

## 🔗 Backend Repository

This frontend requires the AI Alchemist backend:
- Repository: [Link to your backend repo]
- Default URL: http://localhost:5000
- Required endpoints: `/chat`, `/chat/llms`

## 📄 License

MIT

# HIOS Web Platform

> Hardware que entendés, armás y mejorás.

🌐 **Website:** [openhios.dev](https://openhios.dev/)

Web platform for [HIOS](https://github.com/hios-open-systems) — showcasing open hardware projects built while learning electronics.

## What is HIOS?

HIOS (HI Open Systems) is a collection of open hardware projects built by someone learning electronics. Everything is documented, including the mistakes.

**Philosophy:**
- 🔧 Build real things, not just prototypes
- 📖 Document everything (failures included)
- 🌐 Open source by default
- 🎯 Learn by doing

## Projects

| Project | Status | Description |
|---------|--------|-------------|
| **BTDAC** | ✅ Working | Bluetooth DAC with ESP32 and PCM5102 |
| **WiFi Speaker** | 🔜 Concept | WiFi speaker with Class D amp |
| **Macropad** | 🔜 Concept | Custom mechanical macropad |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Ant Design + Framer Motion
- **Language:** TypeScript
- **Styling:** CSS Variables + Custom animations

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view locally.

## Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── landing/         # Homepage sections
│   ├── layout/          # Header, Footer
│   └── ...
├── lib/                 # Utilities and context
├── projects/            # Hardware project files
│   └── btdac/           # BTDAC source, docs, pics
├── public/              # Static assets
└── styles/              # Global CSS and animations
```

## License

- **Code:** MIT License
- **Hardware designs:** CERN-OHL-S v2
- **Documentation:** CC BY-SA 4.0

---

*Building hardware, one project at a time.*  
*Learning in public. Sharing everything.*

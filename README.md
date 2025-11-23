# FilmSim - Film-Inspired Camera Simulator

A production-grade, high-fidelity film-inspired camera simulator built with React, TypeScript, and WebGL. Apply accurate 3D LUT-based film simulations and photographic adjustments to your images with real-time GPU-accelerated preview.

## Features

- **GPU-Accelerated Rendering**: WebGL shader pipeline with 3D LUT support
- **Professional Editing Controls**: Exposure, white balance, tone curve, HSL, grain, vignette, sharpen
- **Preset Gallery**: 6+ production-quality film-inspired presets
- **Non-Destructive Editing**: Full undo/redo stack with parameter history
- **High-Quality Export**: Full-resolution PNG/JPEG export with proper color space conversion
- **Real-Time Preview**: Multiple preview modes (Original/Edited/Split/Side-by-side)

## Tech Stack

- React 18 + TypeScript
- Vite
- Redux Toolkit for state management
- gl-react for WebGL rendering
- Tailwind CSS + Headless UI
- Sentry for error monitoring

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/     # React components
├── shaders/        # GLSL shader files
├── services/       # LUT loader and utilities
├── workers/        # Web Workers for image processing
├── store/          # Redux Toolkit slices
├── utils/          # Utility functions
└── presets/        # Preset LUT files
```

## Legal Disclaimer

Film-inspired simulations. Not affiliated with or endorsed by Fujifilm. Use of the name "Fujifilm" is for reference only.

## License

MIT


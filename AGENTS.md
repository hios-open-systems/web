# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

HIOS (HI Open Systems) web platform - showcases open hardware projects with documentation. Built with Next.js 14 App Router, TypeScript, Ant Design, and next-intl for internationalization.

**Live site:** https://openhios.dev/

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build (sets NEXT_TELEMETRY_DISABLED=1)
npm run lint     # ESLint check
npm run start    # Start production server
```

## Architecture

### Routing Structure
Uses Next.js App Router with locale-based routing via next-intl:
- `app/[locale]/` - All pages are locale-prefixed (en, es, de, it)
- `app/[locale]/projects/[slug]/` - Individual hardware project pages
- `app/[locale]/pinouts/` - Interactive module pinout viewer
- `app/[locale]/print/[slug]/[doc]/` - Printable documentation views

### Key Directories
- `projects/` - Hardware project source files (README.md, pics/, firmware, schematics)
- `lib/projects.ts` - Server-side project data loading from filesystem
- `components/landing/` - Homepage sections (HeroSection, ProductShowcase, ProjectsGrid)
- `components/layout/` - Header, Footer, LocaleSwitcher
- `components/pinouts/` - Interactive module viewer components
- `messages/` - i18n JSON files (en.json, es.json, de.json, it.json)
- `styles/` - globals.css, animations.css, theme.ts (Ant Design config)
- `types/product.ts` - Core TypeScript interfaces

### Data Flow
Projects are loaded at build time from `projects/` directory:
- Each project folder contains README.md (title, description), pics/ (images), and downloadable files
- `lib/projects.ts` reads filesystem and exposes `getProjectBySlug()`, `getAllProjects()`
- Images served from `public/images/{slug}/` and downloads from `public/downloads/{slug}/`

### Internationalization
- next-intl with routing defined in `i18n/routing.ts`
- 4 locales: en (default), es, de, it
- Translations in `messages/*.json`
- Use `setRequestLocale(locale)` in server components

## Code Standards

- TypeScript strict mode, no `any` types
- Components max 150 lines, functions max 50 lines
- Separate data fetching from presentation (use custom hooks)
- Ant Design 5.x for UI components
- Husky + lint-staged for pre-commit hooks

## Current Projects

| Slug | Description |
|------|-------------|
| btdac | Bluetooth DAC with ESP32 and PCM5102 |
| speaker | WiFi speaker (work in progress) |

# HIOS Platform - Technical Product Showcase

## Project Overview

Create a professional web platform for HIOS (HI Open Systems) - an open hardware/software initiative showcasing modular electronic products. The site serves as both a product catalog and a technical portfolio demonstrating end-to-end product development capabilities.

---

## Tech Stack

### Core Framework
- **Next.js 14+** (App Router, React Server Components)
- **TypeScript 5+** (strict mode, zero `any` types)
- **React 18+**

### UI Framework
- **Ant Design 5.x** (antd)
  - Professional, technical aesthetic
  - Excellent table components for BOMs
  - Rich component library
  - Built-in TypeScript support

### Content Management
- **MDX** - Rich documentation with embedded components
- **next-mdx-remote** or **Contentlayer** - Type-safe content layer
- **gray-matter** - Frontmatter parsing
- **remark/rehype plugins** - Markdown processing

### Diagrams & Visualization
- **Mermaid.js** - Circuit diagrams, flowcharts, architecture
- **react-syntax-highlighter** - Code blocks with Prism
- **react-markdown** - Markdown rendering
- **react-image-lightbox** - Product image galleries

### Development Tools
- **ESLint** (strict config)
- **Prettier** (code formatting)
- **Husky** (git hooks)
- **lint-staged** (pre-commit checks)

---

## Architecture Principles

### Project Structure

```
hios-platform/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with antd ConfigProvider
│   ├── page.tsx                 # Homepage
│   ├── products/
│   │   ├── page.tsx            # Products listing
│   │   └── [slug]/
│   │       └── page.tsx        # Individual product page
│   └── about/
│       └── page.tsx
│
├── components/
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Breadcrumbs.tsx
│   ├── product/                 # Product-specific components
│   │   ├── ProductCard.tsx
│   │   ├── ProductHero.tsx
│   │   ├── SpecsTable.tsx
│   │   ├── BOMTable.tsx
│   │   ├── DiagramRenderer.tsx
│   │   └── ImageGallery.tsx
│   ├── common/                  # Reusable components
│   │   ├── DownloadButton.tsx
│   │   ├── GitHubCard.tsx
│   │   └── StatusBadge.tsx
│   └── mdx/                     # MDX components
│       ├── CodeBlock.tsx
│       └── Callout.tsx
│
├── lib/
│   ├── utils/                   # Pure utility functions
│   │   ├── formatters.ts       # Format dates, numbers, etc.
│   │   ├── validators.ts       # Input validation
│   │   └── helpers.ts          # General helpers
│   ├── hooks/                   # Custom React hooks
│   │   ├── useProducts.ts
│   │   └── useMediaQuery.ts
│   ├── api/                     # Data fetching logic
│   │   └── products.ts
│   └── constants/               # Constants
│       ├── routes.ts
│       └── config.ts
│
├── content/
│   └── products/                # Product MDX files
│       ├── hios-wfbtdacamp.mdx
│       └── hios-speaker.mdx
│
├── types/
│   ├── product.ts               # Product type definitions
│   ├── component.ts             # Component types
│   └── index.ts                 # Re-exports
│
├── styles/
│   ├── theme.ts                 # Ant Design theme configuration
│   └── globals.css              # Global styles (minimal)
│
├── public/
│   ├── products/                # Product images & assets
│   │   ├── wfbtdacamp/
│   │   │   ├── hero.jpg
│   │   │   ├── gallery/
│   │   │   └── renders/
│   │   └── ...
│   └── downloads/               # Downloadable files
│       └── wfbtdacamp/
│           ├── manual.pdf
│           ├── schematic.pdf
│           └── gerbers.zip
│
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
└── next.config.js
```

---

## Code Quality Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### SOLID Principles Implementation

#### 1. Single Responsibility Principle

Each component has ONE clear purpose. Separate data fetching from presentation. Extract business logic into utility functions.

**Example - Bad (Multiple responsibilities):**

```typescript
function ProductPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(setProduct);
  }, [slug]);
  
  return (
    <div>
      {/* Complex rendering logic */}
    </div>
  );
}
```

**Example - Good (Separated concerns):**

```typescript
function ProductPage({ slug }: { slug: string }) {
  const product = useProduct(slug);
  
  if (!product) return <ProductSkeleton />;
  
  return <ProductView product={product} />;
}
```

#### 2. Open/Closed Principle

Extend via composition, not modification. Use render props or children patterns.

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({ title, children, actions }: CardProps) {
  return (
    <AntCard title={title} actions={actions ? [actions] : undefined}>
      {children}
    </AntCard>
  );
}
```

#### 3. DRY (Don't Repeat Yourself)

Extract reusable hooks, create utility functions, build shared component library.

```typescript
// lib/hooks/useProduct.ts
export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    getProductBySlug(slug)
      .then(setProduct)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);
  
  return { product, loading, error };
}
```

### Component Size Guidelines

- **Max 150 lines per component**
- **Max 50 lines per function**
- If larger, extract sub-components or hooks
- Colocate related files in folders

**Example folder structure:**

```
components/product/ProductCard/
  ├── ProductCard.tsx         # Main component
  ├── ProductCard.styles.ts   # Styled components (if needed)
  ├── ProductCard.types.ts    # Local types
  └── index.ts                # Re-export
```

---

## Type System

### Core Types

```typescript
// types/product.ts
export type ProductStatus = 'concept' | 'prototype' | 'production';
export type ProductCategory = 'audio' | 'control' | 'iot' | 'power';

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  category: ProductCategory;
  
  specifications: Specification[];
  bom: BOMComponent[];
  images: ProductImages;
  documentation: Documentation;
  repositories: Repositories;
  diagrams?: Diagrams;
  
  createdAt: string;
  updatedAt: string;
}

export interface Specification {
  label: string;
  value: string;
  unit?: string;
}

export interface BOMComponent {
  id: string;
  quantity: number;
  reference: string;
  value: string;
  package?: string;
  manufacturer?: string;
  partNumber?: string;
  notes?: string;
  datasheet?: string;
}

export interface ProductImages {
  hero: string;
  gallery: string[];
  renders?: string[];
  schematics?: string[];
}

export interface Documentation {
  userManual?: string;
  technicalSpecs?: string;
  assemblyGuide?: string;
}

export interface Repositories {
  hardware?: string;
  firmware?: string;
  mechanical?: string;
}

export interface Diagrams {
  block?: string;      // Mermaid code
  schematic?: string;  // Image URL
  assembly?: string;   // Mermaid or image
}
```

---

## Ant Design Theme Configuration

```typescript
// styles/theme.ts
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0066cc',      // Professional blue
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    borderRadius: 4,
  },
  components: {
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
    },
    Card: {
      headerBg: '#fafafa',
    },
  },
};
```

---

## Key Features

### 1. Product Listing Page

- Grid of product cards
- Filter by category/status
- Search functionality
- Responsive layout (Grid/List view)

### 2. Product Detail Page Structure

- Hero section (image, name, tagline, status badge)
- Quick specs sidebar
- Tabs:
  - Overview (MDX content)
  - Specifications (Descriptions list)
  - Bill of Materials (Interactive table)
  - Documentation (Download cards)
  - Diagrams (Mermaid renders)
  - Gallery (Lightbox images)
- Repository cards (GitHub stats)
- Related products

### 3. Core Components to Build

#### ProductCard Component

```typescript
interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
}

export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  // Ant Design Card with image, title, description, status badge
}
```

#### BOMTable Component

```typescript
interface BOMTableProps {
  components: BOMComponent[];
  exportable?: boolean;
}

export function BOMTable({ components, exportable }: BOMTableProps) {
  // Ant Design Table with sorting, filtering, export to CSV
  // Columns: Quantity, Reference, Value, Package, Manufacturer, Part Number, Notes
  // Actions: Sort, Filter, Search, Export
}
```

#### DiagramRenderer Component

```typescript
interface DiagramRendererProps {
  type: 'mermaid' | 'image';
  content: string;
}

export function DiagramRenderer({ type, content }: DiagramRendererProps) {
  // Render Mermaid diagram or display image with zoom capability
}
```

#### ProductHero Component

```typescript
interface ProductHeroProps {
  product: Product;
}

export function ProductHero({ product }: ProductHeroProps) {
  // Large hero image, product name, tagline, status badge
  // Quick actions: Download docs, View repo, Share
}
```

#### SpecsTable Component

```typescript
interface SpecsTableProps {
  specifications: Specification[];
}

export function SpecsTable({ specifications }: SpecsTableProps) {
  // Ant Design Descriptions component
  // Display technical specifications in a clean format
}
```

---

## Development Workflow

### Step 1: Initialize Project

```bash
npx create-next-app@latest hios-platform --typescript --app
cd hios-platform
npm install antd @ant-design/icons
npm install gray-matter next-mdx-remote
npm install mermaid react-syntax-highlighter
npm install -D @types/node @types/react @types/react-dom
```

### Step 2: Setup Theme & Layout

1. Configure Ant Design theme in `styles/theme.ts`
2. Create root layout with ConfigProvider in `app/layout.tsx`
3. Build Header/Footer components in `components/layout/`
4. Setup global styles in `styles/globals.css`

### Step 3: Create Type System

1. Define all TypeScript interfaces in `types/`
2. No `any` types allowed
3. Explicit return types on all functions
4. Use discriminated unions for variant states

### Step 4: Build Component Library

1. Start with atomic components (Button, Badge, Card)
2. Compose into molecules (ProductCard, SpecsTable)
3. Build organisms (ProductHero, ProductTabs)
4. Create page templates

### Step 5: Add First Product

1. Create MDX file with frontmatter in `content/products/`
2. Add images to `public/products/`
3. Build product page template
4. Test with WFBTDACAMP product

### Step 6: Iterate and Refine

1. Add more products
2. Extract common patterns into reusable components
3. Optimize performance (image optimization, code splitting)
4. Add search and filtering
5. Implement analytics

---

## Design Principles

### Visual Identity

- **Minimalist**: Clean, focused interfaces without clutter
- **Technical**: Showcase engineering quality and precision
- **Professional**: Portfolio-grade presentation
- **Accessible**: Semantic HTML, proper ARIA labels, keyboard navigation

### Content Strategy

- Clear hierarchy (h1 > h2 > h3)
- Technical accuracy in all specifications
- Consistent terminology across products
- Rich media (high-quality images, diagrams, videos)
- Comprehensive documentation

### Performance

- Image optimization using Next.js Image component
- Code splitting (automatic with App Router)
- Lazy loading for heavy components (React.lazy)
- Static generation where possible (ISR for dynamic content)
- Minimize client-side JavaScript

---

## Product Data Example

### MDX Frontmatter

```markdown
---
id: "wfbtdacamp"
name: "HIOS WFBTDACAMP"
tagline: "Wireless Bluetooth DAC Amplifier with Battery Management"
description: "High-quality Bluetooth audio receiver with integrated DAC, headphone amplifier, and dual 18650 battery system"
status: "prototype"
category: "audio"
createdAt: "2026-01-20"
updatedAt: "2026-01-25"
---

## Overview

The WFBTDACAMP is a portable Bluetooth audio receiver featuring...

## Features

- Bluetooth 5.0 A2DP receiver
- PCM5102 24-bit DAC
- NE5532 headphone amplifier
- 2x18650 battery system (±3.65V split supply)
- BLE control interface
- Battery monitoring via ESP32 ADC

## Technical Details

### Audio Path
[Mermaid diagram here]

### Power System
[Technical description]
```

### JSON Product Data

```json
{
  "specifications": [
    { "label": "Audio Quality", "value": "24-bit PCM5102 DAC" },
    { "label": "Output Power", "value": "50", "unit": "mW @ 32Ω" },
    { "label": "Battery Life", "value": "12", "unit": "hours" },
    { "label": "Dimensions", "value": "80x50x30", "unit": "mm" },
    { "label": "Weight", "value": "150", "unit": "g" }
  ],
  "bom": [
    {
      "id": "1",
      "quantity": 1,
      "reference": "U1",
      "value": "NE5532",
      "package": "DIP-8",
      "manufacturer": "Texas Instruments",
      "partNumber": "NE5532P",
      "notes": "Dual op-amp for audio",
      "datasheet": "https://..."
    },
    {
      "id": "2",
      "quantity": 4,
      "reference": "R1-R4",
      "value": "10kΩ",
      "package": "0805",
      "notes": "Gain resistors"
    }
  ],
  "images": {
    "hero": "/products/wfbtdacamp/hero.jpg",
    "gallery": [
      "/products/wfbtdacamp/gallery/1.jpg",
      "/products/wfbtdacamp/gallery/2.jpg"
    ],
    "renders": [
      "/products/wfbtdacamp/renders/iso.jpg"
    ]
  },
  "documentation": {
    "userManual": "/downloads/wfbtdacamp/manual.pdf",
    "technicalSpecs": "/downloads/wfbtdacamp/specs.pdf",
    "assemblyGuide": "/downloads/wfbtdacamp/assembly.pdf"
  },
  "repositories": {
    "hardware": "https://github.com/user/hios-wfbtdacamp-hardware",
    "firmware": "https://github.com/user/hios-wfbtdacamp-firmware",
    "mechanical": "https://github.com/user/hios-wfbtdacamp-mechanical"
  },
  "diagrams": {
    "block": "graph TD\n    A[ESP32] --> B[PCM5102]\n    B --> C[NE5532]",
    "schematic": "/products/wfbtdacamp/schematic.png"
  }
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Initialize Next.js project with TypeScript
- [ ] Install and configure Ant Design
- [ ] Setup theme and global styles
- [ ] Create root layout with Header/Footer
- [ ] Define core type system
- [ ] Setup ESLint and Prettier

### Phase 2: Core Components
- [ ] Build ProductCard component
- [ ] Build ProductHero component
- [ ] Build SpecsTable component
- [ ] Build BOMTable component
- [ ] Build DiagramRenderer component
- [ ] Build ImageGallery component

### Phase 3: Pages
- [ ] Create Homepage with featured products
- [ ] Create Products listing page
- [ ] Create Product detail page template
- [ ] Create About page
- [ ] Setup MDX rendering

### Phase 4: First Product
- [ ] Add WFBTDACAMP product data
- [ ] Upload product images
- [ ] Create MDX documentation
- [ ] Generate PDF downloads
- [ ] Test all features

### Phase 5: Enhancement
- [ ] Add search functionality
- [ ] Add category filtering
- [ ] Implement GitHub stats integration
- [ ] Add SEO optimization
- [ ] Setup analytics

### Phase 6: Deployment
- [ ] Optimize build
- [ ] Configure environment variables
- [ ] Deploy to Vercel
- [ ] Setup custom domain
- [ ] Test production build

---

## Success Metrics

This platform should demonstrate:

- ✅ Clean, maintainable TypeScript code
- ✅ Solid architectural patterns (SOLID, DRY)
- ✅ Reusable component library
- ✅ Comprehensive type safety
- ✅ Professional UI/UX with Ant Design
- ✅ Technical depth in product showcase
- ✅ Full-stack capabilities
- ✅ Attention to detail and quality

---

## HIOS Philosophy & Brand Guidelines

### What is HIOS?

HIOS (HI Open Systems) is about **the journey of building hardware**, not just the destination.

It's the feeling when:
- Your first LED blinks after hours of debugging
- The DAC finally outputs sound instead of noise
- The battery monitoring actually works
- Someone else builds your design and it works for them too

**HIOS is not about perfection. It's about progress.**

### Core Principles

#### 1. Honest Documentation
- Show the failures, not just the successes
- Document the "why it didn't work" as much as the "why it works"
- Real photos of prototypes (messy breadboards included)
- Actual problems solved, not imaginary use cases

#### 2. Open by Default
- Hardware designs: Open
- Firmware code: Open
- Documentation: Open
- Lessons learned: Open

Not because it's trendy. Because that's how we learn from each other.

#### 3. Community Over Individual
- HIOS is not "my" platform, it's "our" playground
- Everyone who builds a HIOS project contributes to it
- Fork it, improve it, break it, fix it, share it
- Credit the giants whose shoulders we stand on

#### 4. Real Products, Real Use
- These aren't art projects
- They solve actual problems (even if the problem is "I want to learn")
- They get used, not just displayed
- If it doesn't work, it doesn't ship

#### 5. Learning is the Feature
- Not an engineer? Perfect. Neither am I.
- Started with modules? Great. That's how you learn.
- Made mistakes? Even better. Document them.
- The process IS the product.

### Tone & Voice Guidelines

#### What HIOS Sounds Like:

**Authentic:**
- "After three days of debugging, turns out I had swapped V+ and GND. Obviously."
- "This works. It's not pretty, but it works."
- "Version 1 was a disaster. Version 2 is better. Version 3 will be even better."

**Excited:**
- "IT WORKS! The DAC is outputting audio!"
- "Finally got the battery monitoring working. Check this out!"
- "Just integrated BLE control. This is so cool."

**Humble:**
- "Built on the shoulders of: ESP32 docs, random Arduino forums, that one YouTube video"
- "This design is inspired by [source], improved with [change]"
- "Still learning. Suggestions welcome."

**Inviting:**
- "Want to build one? Here's everything you need."
- "Stuck on something? Ask. I probably got stuck there too."
- "Made an improvement? Show me!"

#### What HIOS Does NOT Sound Like:

**Corporate:**
- ❌ "Industry-leading solutions"
- ❌ "Professional engineering standards"
- ❌ "Cutting-edge technology"

**Pretentious:**
- ❌ "Revolutionizing the audio landscape"
- ❌ "Bridging the gap between atoms and bits"
- ❌ "Pushing the boundaries of innovation"

**Fake:**
- ❌ Making it sound easier than it was
- ❌ Hiding the failed attempts
- ❌ Overselling capabilities

### The HIOS Journey Story

Every product page should tell the story:

1. **The Spark** - "I wanted a portable Bluetooth speaker that didn't suck"
2. **The Research** - "Found the PCM5102 DAC, looked promising"
3. **The Struggle** - "Spent two weeks figuring out why there was no audio output"
4. **The Breakthrough** - "Turns out you need to configure I2S properly. Who knew?"
5. **The Iteration** - "V1 worked but was too big. V2 is more compact"
6. **The Share** - "Here's everything I learned. Build your own!"

### For Whom is HIOS?

**Primary Audience:**
- Developers curious about hardware
- Makers who want to learn electronics
- Students building their first projects
- Hobbyists who enjoy the journey

**Secondary Audience:**
- People who just want the thing (buy it pre-built)
- Educators looking for teaching materials
- Other makers looking for inspiration

**NOT For:**
- People expecting production-ready products
- Enterprise clients
- Anyone looking for "professional solutions"

### Business Model (Transparent)

HIOS operates on three levels:

#### 1. Open Source (Free)
- All designs
- All code
- All documentation
- Build it yourself

#### 2. Kits (Cost + Small Margin)
- Pre-sourced components
- PCBs (when available)
- Assembly instructions
- Support via community

**Price:** BOM cost + 20% for sourcing/packaging/shipping

#### 3. Pre-Built (Cost + Fair Labor)
- Fully assembled products
- Tested and working
- Support included
- Limited availability

**Price:** BOM + Kit margin + Assembly time at fair rate

**Philosophy:** Make money, but don't get rich off open source work.

### Content Guidelines for Website

#### Homepage
**Hero Message:**
```
HIOS
Hardware you can understand, build, and improve.

[Image: Real prototype, messy but working]

Start with modules. Learn by building. 
Share what works (and what doesn't).
```

**Subtext:**
- Not an engineer? Good. Neither was I.
- Started somewhere? Perfect. So did everyone.
- Want to build something real? You're in the right place.

#### Product Pages
**Required Elements:**
- Current status (concept/prototype/production)
- Real photos (not just renders)
- What works / What doesn't
- What I learned
- How to build your own
- Where it failed before it worked

**Optional but Encouraged:**
- Video of it working
- Comparison to commercial alternatives
- Community builds/modifications
- Future improvements planned

#### Philosophy Page
Tell the real story:
- Why HIOS exists
- The frustration with closed systems
- The joy of understanding your tools
- The community of makers
- The business model (transparent)

### Writing Style Examples

**Bad (Corporate):**
> "The HIOS BTDAC represents a professional-grade Bluetooth audio solution, engineered to exacting standards for optimal performance."

**Good (HIOS):**
> "The BTDAC is a Bluetooth speaker I built because I wanted one that I actually understood. It took three prototypes to get right. Here's how I did it."

---

**Bad (Fake):**
> "Seamlessly integrating cutting-edge DAC technology with advanced power management systems."

**Good (HIOS):**
> "Uses a PCM5102 DAC (costs $2) and two 18650 batteries (about 12 hours runtime). The power circuit took forever to debug but finally works."

---

**Bad (Pretentious):**
> "HIOS pioneers the democratization of hardware development through open-source innovation."

**Good (HIOS):**
> "Build hardware without needing an EE degree. Everything's documented. Everything's open."

### Visual Identity

**Colors:**
- Not too corporate (no boring blue/grey)
- Not too playful (this is real tech)
- Suggestion: Deep blues, warm oranges (excitement + reliability)

**Typography:**
- Clean and readable
- Monospace for code
- Nothing too fancy

**Imagery:**
- REAL photos over renders
- Show the process, not just results
- Breadboard prototypes = good
- Messy desk = authentic
- Perfect studio shots = skip

**Icons/Graphics:**
- Simple and functional
- Circuit-inspired is fine
- No abstract corporate nonsense

### Community Guidelines

**How to Contribute:**
1. Build a HIOS product
2. Document your build (photos, issues, solutions)
3. Share improvements
4. Help others in forums/issues

**How to Get Help:**
1. Check docs first
2. Search existing issues
3. Ask with details (photos help!)
4. Be patient, be kind

**How to Sell HIOS Products:**
- You can! It's open hardware
- Credit the original design
- Share improvements back
- Don't claim you invented it
- Don't be a jerk

### Success Metrics

HIOS succeeds when:
- ✅ Someone builds their first hardware project using HIOS
- ✅ Someone fixes a bug and shares the solution
- ✅ Someone improves a design and publishes it
- ✅ Someone teaches others using HIOS materials
- ✅ The community grows organically

HIOS does NOT measure:
- ❌ Units sold
- ❌ Social media followers
- ❌ Website traffic
- ❌ "Market share"

### Technical Philosophy

**Use your frontend strength to build a solid foundation.**

Focus your learning energy on hardware, firmware, and mechanical design. The website showcases those skills - it doesn't need to also be a frontend learning project.

The goal is to create a platform that demonstrates:
1. The journey of learning hardware
2. Honest documentation of real projects
3. Community-driven improvement
4. Transparent business model
5. Open source commitment
6. Technical depth without pretension

The web platform is the window into the work - make it clean, authentic, and maintainable.

---

## Example Content

### Homepage Copy (Authentic Version)

```markdown
# HIOS

Hardware you can understand, build, and improve.

[Photo: Your actual BTDAC prototype stacked with modules]

I'm a developer learning hardware by building real things.
These projects work. They're documented. They're open.

No engineering degree required. Just curiosity and patience.

[Explore Projects] [Read the Story]

---

## Latest Build: BTDAC

Bluetooth speaker with decent audio and 12-hour battery.
Took 3 prototypes to get right. Here's everything I learned.

Status: Working prototype
→ See build log

---

## How HIOS Works

1. **Find a problem** (I wanted a Bluetooth speaker I understood)
2. **Research solutions** (Modules exist! PCM5102, ESP32, NE5532)
3. **Build, fail, iterate** (Audio was silent. Then it worked!)
4. **Document everything** (Circuits, code, mistakes, wins)
5. **Share it all** (You can build this too)

Open source. Real problems. Real solutions.

---

## Build Your Own

Every project includes:
- Complete schematics
- Source code
- Bill of materials
- Assembly guide
- What went wrong (and how I fixed it)

Don't want to source components? 
→ Pre-sourced kits available

Don't want to assemble?
→ Pre-built units available

[See Projects]
```

### Product Page Example (HIOS BTDAC)

```markdown
# HIOS BTDAC
Bluetooth DAC Amplifier with Battery Management

[Hero image: Your actual device working]

## Status: Working Prototype ✅

It works. It sounds good. The case is 3D-printed and rough, but it does the job.

**What it does:**
- Receives Bluetooth audio (A2DP)
- Converts to high-quality analog (PCM5102 DAC)
- Amplifies for headphones (NE5532)
- Runs for ~12 hours on 2x18650 batteries
- Shows battery level
- Controls via Bluetooth

**What it doesn't do:**
- Look pretty (yet)
- Have a fancy UI
- Cost as little as commercial options

---

## The Journey

### The Idea
I wanted a Bluetooth DAC that:
- I could understand
- I could repair
- Didn't have proprietary bullshit
- Actually sounded decent

### The Research
Found these modules:
- ESP32 for Bluetooth
- PCM5102 for DAC (24-bit, sounds great)
- NE5532 for amplification
- Standard 18650 batteries

"This should be easy," I thought. It wasn't.

### The Struggle

**Attempt 1:** No audio output
- Problem: I2S not configured correctly
- Solution: RTFM (Read The F***ing Manual)
- Time wasted: 2 days

**Attempt 2:** Audio worked, but awful quality
- Problem: Ground loops everywhere
- Solution: Proper grounding, shorter wires
- Time wasted: 3 days

**Attempt 3:** Everything worked!
- Then the battery monitoring didn't work
- Voltage divider was wrong
- Fixed it, finally done

**Total time:** 3 weeks from idea to working prototype

### The Breakthrough

The moment it first played music properly was incredible.
Not joking. I literally yelled "YES!" at 2am.

That's what HIOS is about. Those moments.

---

## Technical Specs

| Spec | Value |
|------|-------|
| Audio Quality | 24-bit PCM5102 DAC |
| Output Power | 50mW @ 32Ω |
| Battery | 2x18650 (7.4V) |
| Battery Life | ~12 hours |
| Bluetooth | 5.0 A2DP |
| Controls | BLE (phone app) |
| Dimensions | 80x50x30mm |
| Weight | ~150g |

---

## What Works

✅ Bluetooth pairing (reliable)
✅ Audio quality (surprisingly good)
✅ Battery life (12+ hours tested)
✅ Battery monitoring (accurate to ~5%)
✅ Volume control via BLE
✅ Power management (auto-sleep)

## What Needs Improvement

⚠️ Case design (functional but ugly)
⚠️ Component layout (could be more compact)
⚠️ Power switch (currently just unplugging battery)
⚠️ No physical volume control (BLE only)

## Known Issues

🐛 Sometimes takes 2 tries to pair
🐛 Battery percentage jumps around under load
🐛 No low-battery warning (yet)

---

## Build Your Own

### What You Need

[Link to complete BOM with prices]

**Total cost: ~$35 USD**

**Tools required:**
- Soldering iron
- Multimeter
- Basic hand tools
- 3D printer (or order case printed)

**Time estimate:**
- First build: 4-6 hours
- If you know what you're doing: 2 hours

### Files

- [📄 Technical Documentation (PDF)](link)
- [⚡ Schematic (KiCad)](link)
- [💾 Firmware Source Code](github)
- [📦 3D Printable Case (STL)](link)
- [📋 Bill of Materials (CSV)](link)
- [🎥 Assembly Video](youtube)

### Community Builds

- [@user1 built one with custom wood case](link)
- [@user2 added OLED display](link)
- [@user3 fit it in smaller enclosure](link)

Built one yourself? [Share it here!](link)

---

## Lessons Learned

1. **Start with modules** - Don't try to design everything from scratch
2. **Test each stage** - Add one thing at a time
3. **Document failures** - They teach more than successes
4. **Ground loops are evil** - Star grounding saves lives
5. **Battery management is hard** - Voltage dividers need tuning

---

## Want One But Don't Want to Build?

### Option 1: Component Kit
Pre-sourced components, ready to assemble.

**$35 + shipping**
[Order Kit]

### Option 2: Pre-Built Unit
Fully assembled, tested, ready to use.

**$75 + shipping** (limited availability)
[Pre-order]

*Prices are transparent: BOM cost + small margin + labor at fair rate*

---

## Version History

**v1.0 (Current)**
- Initial working prototype
- Features listed above

**v2.0 (Planned)**
- Custom PCB (no more breadboard stack!)
- Better case design
- Physical volume control
- Power switch
- Low battery warning

[Follow development on GitHub]

---

## Questions?

- [Read the FAQ](link)
- [Ask in Discussions](github)
- [Email me](email)

Built one and got stuck? I probably got stuck there too. Ask!

Made an improvement? Share it! That's the point.

---

*Last updated: January 2026*
*Status: Prototype working, case ugly but functional*
*License: Hardware (CERN-OHL-S v2) | Software (MIT)*
```

---

### About/Philosophy Page

```markdown
# About HIOS

## The Moment

You know that feeling when something you built actually works?

Not "works in theory." Not "should work." Actually works.

That's what HIOS is about.

---

## The Story

I'm Juan José, a backend developer who got curious about hardware.

Not because I needed it for work.
Not because it was trendy.
Because I wanted to understand how things actually work.

So I started building stuff.

---

## The Reality

**What I'm not:**
- ❌ An electrical engineer
- ❌ A hardware genius
- ❌ Revolutionizing anything

**What I am:**
- ✅ Learning by doing
- ✅ Documenting everything
- ✅ Sharing what works (and what doesn't)

---

## Why "Open"?

Because that's how I learned.

- Random forum post from 2012
- GitHub repo with commented code
- YouTube video explaining the basics
- That one person who answered my dumb question

I learned from people who shared. So I share back.

---

## What is HIOS?

**It's not a company.** It's a playground.

**It's not revolutionary.** It's incremental.

**It's not perfect.** It's real.

HIOS is:
- Projects I'm building
- Lessons I'm learning
- Mistakes I'm making
- Solutions I'm finding

All documented. All open. All buildable.

---

## Who is This For?

### You Should Build HIOS Projects If:

- ✅ You're curious about hardware
- ✅ You like understanding your tools
- ✅ You enjoy the process, not just the result
- ✅ You're okay with things not working first try
- ✅ You want to learn by doing

### This Probably Isn't For You If:

- ❌ You want production-ready products
- ❌ You need "professional solutions"
- ❌ You don't have time for troubleshooting
- ❌ You just want to buy something that works

(For that second group: you can buy pre-built units. No judgment.)

---

## The Business Model

**I'm not getting rich off this.**

Three tiers, fully transparent:

**1. Free (Open Source)**
- All designs
- All code
- All documentation

**2. Kits ($$ = BOM + 20%)**
- Pre-sourced components
- Assembly instructions
- Community support

**3. Pre-Built ($$ = Kit + Fair Labor)**
- Fully assembled
- Tested and working
- Direct support

The margins barely cover my time. That's intentional.

---

## The Community

**You're not alone.**

- Got stuck? Ask. Someone else got stuck there too.
- Found a better way? Share it.
- Built something cool? Show it off.
- Made a mistake? Document it. That helps everyone.

HIOS grows when:
- Someone builds their first hardware project
- Someone fixes a bug and shares the fix
- Someone improves a design
- Someone helps someone else

---

## The Values

1. **Honesty over hype** - Real products, real limitations
2. **Process over perfection** - Learning is the feature
3. **Community over individual** - We build together
4. **Open by default** - Knowledge should be free
5. **Sustainable, not exploitative** - Fair prices, fair labor

---

## What's Next?

**Short term:**
- Finish BTDAC v2 with custom PCB
- Start HIOS Speaker project
- Improve documentation
- Build community

**Long term:**
- More projects
- Better tools
- Stronger community
- Keep learning

---

## Join In

**Want to build?**
→ Check out the projects

**Want to contribute?**
→ Improve a design, share your build

**Want to learn?**
→ Start with the simplest project

**Want to buy?**
→ Kits and pre-builds available

**Have questions?**
→ Ask! That's how this works.

---

*Building hardware, one project at a time.*
*Learning in public. Sharing everything.*

[GitHub](link) | [Email](link) | [Discussions](link)
```

---

## Additional Resources

### Ant Design
- [Official Documentation](https://ant.design/)
- [Component Library](https://ant.design/components/overview/)
- [Design Patterns](https://ant.design/docs/spec/introduce)

### Next.js
- [App Router Documentation](https://nextjs.org/docs/app)
- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

### MDX
- [MDX Documentation](https://mdxjs.com/)
- [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)
- [Contentlayer](https://contentlayer.dev/)

### Mermaid
- [Mermaid Documentation](https://mermaid.js.org/)
- [Diagram Syntax](https://mermaid.js.org/intro/syntax-reference.html)

---

## Notes

- Keep components small and focused
- Extract logic from presentation
- Use TypeScript strictly
- No `any` types
- Document complex logic
- Test critical paths
- Optimize for performance
- Maintain accessibility
- Keep dependencies minimal
- Follow Ant Design patterns
- Use semantic HTML
- Implement proper error handling
- Add loading states
- Consider mobile-first
- Make it fast and lightweight
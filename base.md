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
	block?: string; // Mermaid code
	schematic?: string; // Image URL
	assembly?: string; // Mermaid or image
}
```

---

## Ant Design Theme Configuration

```typescript
// styles/theme.ts
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
	token: {
		colorPrimary: '#0066cc', // Professional blue
		colorSuccess: '#52c41a',
		colorWarning: '#faad14',
		colorError: '#ff4d4f',
		colorInfo: '#1890ff',

		fontFamily:
			"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

## Technical Standards

### Testing Strategy

- **Unit Testing**: Jest + React Testing Library for core components and utilities.
- **Integration Testing**: Testing complex flows like product filtering and BOM interactions.
- **E2E Testing**: Playwright for critical user journeys (e.g., navigating from landing to a specific product).
- **Snapshot Testing**: For Ant Design component customizations to ensure visual consistency.

### CI/CD Pipeline

- **Statical Analysis**: ESLint and Prettier runs on every push.
- **Automated Tests**: All unit and integration tests must pass before merging.
- **Build Verification**: Next.js build command is executed in CI to catch compilation errors.
- **Deployment**: Automatic staging deployments on Vercel for previewing changes.

### Accessibility (a11y)

- **Standard**: Target WCAG 2.1 AA compliance.
- **Semantic HTML**: Mandatory use of `<nav>`, `<main>`, `<header>`, `<footer>`, etc.
- **Keyboard Navigation**: All interactive elements must be focusable and operable via keyboard.
- **Contrast**: Maintain a minimum contrast ratio of 4.5:1 for text.
- **Aria Labels**: Proper usage of `aria-label` and `aria-describedby` where necessary.

### Performance & SEO

- **Core Web Vitals**: Target LCP < 2.5s, FID < 100ms, CLS < 0.1.
- **Image Optimization**: Strictly use `<Image />` component with proper `priority` for above-the-fold assets.
- **Metadata**: Dynamic generation of meta tags per product page for social sharing and search ranking.
- **Static Generation**: Use ISR (Incremental Static Regeneration) for product pages to ensure speed and freshness.

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
id: 'wfbtdacamp'
name: 'HIOS WFBTDACAMP'
tagline: 'Wireless Bluetooth DAC Amplifier with Battery Management'
description: 'High-quality Bluetooth audio receiver with integrated DAC, headphone amplifier, and dual 18650 battery system'
status: 'prototype'
category: 'audio'
createdAt: '2026-01-20'
updatedAt: '2026-01-25'
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
		"renders": ["/products/wfbtdacamp/renders/iso.jpg"]
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

## Philosophy

**Use your frontend strength to build a solid foundation.**

Focus your learning energy on hardware, firmware, and mechanical design. The website showcases those skills - it doesn't need to also be a frontend learning project.

The goal is to create a professional portfolio that demonstrates:

1. End-to-end product development
2. Hardware design expertise
3. Firmware programming skills
4. Mechanical engineering capability
5. Documentation quality
6. Open source contribution

The web platform is the window into your work - make it clean, professional, and maintainable.

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

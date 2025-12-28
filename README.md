# ScanPay Frontend

A production-ready Next.js application built with TypeScript, Tailwind CSS, shadcn/ui, and modern best practices.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (New York style)
- **Testing:** [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/)
- **Linting:** [ESLint](https://eslint.org/) with Next.js, TypeScript, and Prettier integration
- **Formatting:** [Prettier](https://prettier.io/) with Tailwind plugin
- **Git Hooks:** [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged)

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start development server       |
| `npm run build`        | Build for production           |
| `npm run start`        | Start production server        |
| `npm run lint`         | Run ESLint                     |
| `npm run lint:fix`     | Fix ESLint issues              |
| `npm run format`       | Format with Prettier           |
| `npm run format:check` | Check code formatting          |
| `npm run type-check`   | TypeScript checking            |
| `npm run test`         | Run tests                      |
| `npm run test:watch`   | Run tests in watch mode        |
| `npm run test:coverage`| Run tests with coverage report |
| `npm run clean`        | Remove build artifacts         |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── health/        # Health check endpoint
│   ├── globals.css        # Global styles & CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── avatar.tsx
│   │   └── index.ts
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   ├── ClientComponent.tsx
│   ├── ServerComponent.tsx
│   └── index.ts
├── hooks/                 # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── index.ts
├── lib/                   # Utility functions
│   └── utils.ts           # cn() helper
├── services/              # API clients
│   ├── api.ts
│   └── index.ts
├── types/                 # TypeScript types
│   └── index.ts
├── styles/                # Additional styles
└── tests/                 # Test files
    └── Button.test.tsx
```

## shadcn/ui Components

This project uses [shadcn/ui](https://ui.shadcn.com/) with the **New York** style. Pre-installed components:

| Component       | Description                          |
| --------------- | ------------------------------------ |
| `Button`        | Primary action button with variants  |
| `Card`          | Container component                  |
| `Input`         | Text input field                     |
| `Label`         | Form label                           |
| `Badge`         | Status badges and tags               |
| `Alert`         | Alert/notification messages          |
| `Dialog`        | Modal dialog                         |
| `DropdownMenu`  | Dropdown menu component              |
| `Separator`     | Visual separator                     |
| `Skeleton`      | Loading placeholder                  |
| `Sonner`        | Toast notifications                  |
| `Avatar`        | User avatar component                |

### Adding More Components

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add accordion tabs tooltip
```

### Using Components

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Features

### Dark Mode

Dark mode is implemented using the `class` strategy. Toggle with the theme button in the header.

```tsx
// Toggle programmatically
document.documentElement.classList.toggle('dark');
```

### CSS Variables

Custom properties are defined in `globals.css` and integrate with shadcn/ui's theming system:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

### Absolute Imports

Use the `@/` alias for clean imports:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
```

### Server vs Client Components

- **Server Components** (default): Run on the server, can fetch data directly
- **Client Components**: Use `'use client'` directive for interactivity

```tsx
// Server Component (default)
export async function ServerComponent() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component
'use client';
export function ClientComponent() {
  const [state, setState] = useState();
  return <Button onClick={() => setState(...)}>Click</Button>;
}
```

### Toast Notifications

Using Sonner for toast notifications:

```tsx
import { toast } from 'sonner';

// In your component
toast.success('Operation completed!');
toast.error('Something went wrong');
toast.info('Did you know?');
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Writing Tests

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

## Code Quality

### Pre-commit Hooks

Husky runs lint-staged before each commit:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

### ESLint Configuration

Located in `eslint.config.mjs`:

- Next.js recommended rules
- TypeScript strict rules
- React Hooks rules
- Prettier integration

### Prettier Configuration

Located in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Environment Variables

| Variable                       | Description            | Required |
| ------------------------------ | ---------------------- | -------- |
| `NEXT_PUBLIC_APP_NAME`         | Application name       | No       |
| `NEXT_PUBLIC_APP_URL`          | Application URL        | No       |
| `NEXT_PUBLIC_API_URL`          | Backend API URL        | Yes      |
| `API_SECRET_KEY`               | Server-side API secret | Yes      |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics       | No       |

> **Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Build for Production

```bash
npm run build
npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

# Book a Demo Page

Next.js + shadcn/ui form for SMRT demo booking. Deploy to Vercel and embed in Framer via the site URL.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion (animated dropdown)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel + Framer)

1. Push to GitHub
2. Connect the repo in Vercel (framework preset: Next.js)
3. Deploy
4. In Framer: **Insert → Embed** → paste your Vercel URL

The React app loads in an iframe the same way the old static HTML did.

## Components

- `components/ui/animated-dropdown.tsx` — animated select dropdown
- `components/book-demo-form.tsx` — full booking form
- `lib/form-config.ts` — regions, dial codes, options

## Legacy

`index.legacy.html` is the previous static HTML version (kept for reference).

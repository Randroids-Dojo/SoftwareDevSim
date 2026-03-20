# SoftwareDevSim

A collaboratively agentic coded game about software development.

## Welcome, Contributors!

Anyone is welcome to put in a PR to add features or fix issues. **Be creative** — this is meant to be a collaborative effort. Whether you want to add new game mechanics, improve the UI, fix bugs, or dream up entirely new systems, your contributions are welcome.

Some ideas to get you started:
- Game mechanics (developer skills, project management, code reviews)
- Visual improvements and UI polish
- New scenarios and storylines
- Bug fixes and performance improvements
- Documentation and onboarding improvements

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment template and fill in your Vercel KV credentials
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

This project uses [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Upstash Redis) for persistent storage. You'll need to set up a KV store in your Vercel dashboard and copy the credentials to `.env.local`.

See `.env.local.example` for the required variables.

## Stack

- **Next.js** (App Router, TypeScript strict mode)
- **Tailwind CSS** — styling
- **Vercel KV** (Upstash Redis) — persistent game state
- **Zod** — runtime validation

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint checks |
| `npm run type-check` | TypeScript strict type checking |
| `npm run test:unit` | Run unit tests |
| `npm run test:smoke` | Run smoke tests |

## Deployment

The project auto-deploys to Vercel on push to `main`. Preview deployments are created for pull requests.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-cool-idea`)
3. Make your changes
4. Run `npm run lint && npm run type-check` to verify
5. Open a PR — describe what you did and why

No contribution is too small. Let's build something fun together.

# AI Code Reviewer

Live URL: https://ai-code-reviewer-zeta-ashen.vercel.app/

AI Code Reviewer is a web app that lets you paste or type code in multiple languages and receive structured feedback in real time.

## Features

- Supports code input for multiple programming languages
- Paste or type code directly into the app
- Streams review results in real time
- Provides structured feedback across categories
- Includes severity levels for identified issues
- Suggests fixes for each finding

## Overview

This app helps developers review code quickly by analyzing submitted code and returning organized feedback that is easier to understand and act on.

## Stack

- Next.js App Router
- TypeScript (strict mode)
- Zod
- Anthropic SDK
- Upstash Redis

## Technical Decisions

### Why Zod for validation?

TypeScript types disappear at runtime, so they cannot protect API boundaries by themselves.
Zod validates the shape of data at runtime in both directions:

- Incoming request payloads
- Outgoing Claude response payloads

This ensures the app only accepts and returns data that matches expected structures.

### Why streaming?

Streaming improves user experience by showing progress immediately while the AI is generating a review.
Instead of waiting for one large final response, users see feedback as it arrives, which makes the app feel faster and more responsive.

### Why shared schemas?

The same Zod schemas are shared across client and server to provide:

- Client-side validation
- Server-side validation
- Type inference for TypeScript

This creates a single source of truth and avoids duplicated validation logic.

### Why sliding-window rate limiting?

Sliding-window rate limiting is smoother and fairer than fixed-window limiting.

- **Fixed window:** Requests are counted in discrete blocks of time (for example, per minute). This can allow burst traffic at window boundaries (end of one window + start of next).
- **Sliding window:** Limits are evaluated continuously over the most recent time range, reducing boundary spikes and producing more consistent protection.

Why it matters: it prevents sudden double-burst behavior, improves abuse resistance, and gives more predictable request handling for real users.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local env file:

   ```bash
   cp .env.example .env.local
   ```

   If `.env.example` is not present, create `.env.local` manually.

3. Add the 3 required environment variables:

   - `ANTHROPIC_API_KEY`
     - Get it from the Anthropic Console: https://console.anthropic.com/
   - `UPSTASH_REDIS_REST_URL`
     - Create a Redis database in Upstash and copy the REST URL from the database details
   - `UPSTASH_REDIS_REST_TOKEN`
     - From the same Upstash database, copy the REST token

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## What I’d do next

- Add syntax highlighting in the code editor
- Add authentication so users can save and revisit past reviews
- Add a side-by-side diff (original code vs suggested fixes)
- Support file uploads in addition to paste input
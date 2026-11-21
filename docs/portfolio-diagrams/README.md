# RailFlow Technical Architecture Diagrams & Portfolio Assets

This directory contains production-grade, architectural diagram assets reverse-engineered directly from the [RailFlow codebase](https://github.com/mrsantanu21/RailFlow) (located at `C:\Users\santanu dey\Downloads\railflow\railflow-app`).

Every diagram is designed to match the personal portfolio's editorial, Swiss-inspired aesthetic:
- **Paper Field Canvas**: `#f2f2ee` (`--paper`)
- **Monochrome & Technical Typography**: Clean sans-serif hierarchy (`Plus Jakarta Sans` / `DM Sans`), uppercase section tokens (`0.65rem - 0.75rem`), structured rule dividers (`#111110` / `rgba(17,17,16,0.12)`).
- **Zero Gimmicks**: No neon gradients, no cyberpunk glow, no cartoon icons—designed specifically for technical hiring managers, systems architects, and engineering leaders.

---

## 1. Diagram Directory & Manifest

| Diagram Asset | Vector Source | Mermaid Spec | Primary Focus & Engineering Value |
| :--- | :--- | :--- | :--- |
| **01. System Architecture** | [`railflow-architecture.svg`](./railflow-architecture.svg) | [`railflow-architecture.mmd`](./railflow-architecture.mmd) | End-to-end multi-tier pipeline: React 19 client, Express gateway, domain services, Prisma ORM, SQLite DB, Gemini Flash, and multi-tier telemetry failover. |
| **02. Booking & Concurrency Lifecycle** | [`railflow-booking-flow.svg`](./railflow-booking-flow.svg) | [`railflow-booking-flow.mmd`](./railflow-booking-flow.mmd) | Two-stage seat reservation lifecycle: segment-aware collision math, 10-minute hold TTL (`LOCKED`), serializable transactions, and payment idempotency. |
| **03. AI Reasoning & Telemetry Failover** | [`railflow-ai-tracking.svg`](./railflow-ai-tracking.svg) | [`railflow-ai-tracking.mmd`](./railflow-ai-tracking.mmd) | Dual editorial spread: Controlled Gemini Flash tool boundary (read-only guard) alongside the 4-tier live radar telemetry failover cascade. |

---

## 2. Reverse-Engineered Architecture Breakdown

The architecture was reverse-engineered directly from the implementation source code:

### A. Client Tier (`/client`)
- **Core Framework**: React 19 + TypeScript, bundled with Vite.
- **Styling**: Tailwind CSS 3.4 using a refined monochrome/slate palette and responsive modular cards.
- **State & Server Synchronization**: TanStack Query v5 managing query invalidation, optimistic states, and in-flight request deduplication.
- **Geospatial & Visualization**: Leaflet and custom GeoJSON pipelines rendering interactive railway routes, polyline track paths, and live locomotive marker telemetry.
- **Routing**: React Router v6 separating public discovery, passenger booking flows, and administrative backoffice surfaces.

### B. Application Backend (`/server`)
- **Core Engine**: Express 4.21 on Node 20+, written strictly in TypeScript 5.6.
- **Security & Cryptography**: Password hashing via Argon2id (`argon2`), stateless sessions via signed HTTP-only JWT cookies, and rate-limiting middleware.
- **Validation Barrier**: Schema validation on all controller entrypoints via Zod (`z.object({...})`), generating structured OpenAPI 3.0 compatible contracts.
- **Domain Services**:
  - `inventoryService.ts`: Segment interval collision math and seat allocation engine.
  - `bookings.ts`: Two-phase booking coordinator and ticket lifecycle manager.
  - `payments.ts`: Idempotency-keyed payment simulation and transaction verifier.
  - `cancellations.ts`: Dynamic departure-window tier refund calculator (25% / 50% / 75% deductions) with atomic seat release.
  - `trains.ts` / `stations.ts`: Station routing and schedule timetable management.

### C. Data Persistence Tier (`/server/prisma`)
- **Data Engine**: SQLite (`prisma/dev.db`) operating with Write-Ahead Logging (WAL) mode for fast concurrent reads.
- **ORM**: Prisma Client 5.22.
- **Schema Entities**: `User`, `Train`, `Station`, `RouteStation`, `Coach`, `Seat`, `SeatAllocation`, `Booking`, `Payment`, `AuditLog`.
- **Concurrency Isolation**: Critical booking operations run inside `prisma.$transaction(async (tx) => {...})` with strict serializable sequencing.

### D. Controlled AI Assistant (`/server/src/services/aiService.ts` & `toolRegistry.ts`)
- **Model**: Google Gemini 2.5 Flash via `@google/genai`.
- **Bounded Interaction**: Enforces a strict multi-turn execution cap (maximum 3 function calling rounds per query).
- **Zero Mutation Invariant**: The model has access to **5 read-only tools**:
  1. `search_trains`: Queries route availability between stations.
  2. `get_fare`: Deterministic pricing calculator based on distance and class multiplier.
  3. `get_booking_status`: PNR lookup with passenger-level privacy masking.
  4. `get_my_bookings`: Context-bounded query restricted to the authenticated session's user ID.
  5. `get_train_running_status`: Live radar running telemetry lookup.
- **Hard Security Guard**: The model cannot mutate database state, reserve seats, initiate payments, or trigger cancellations.

### E. 4-Tier Radar Telemetry Failover (`/server/src/services/trackingService.ts`)
- **In-Memory Cache**: 60-second TTL cache (`trainNo:date`), protecting external endpoints from repeated polling.
- **Client Rate Limiting**: 10 requests/minute per client IP.
- **Hierarchical Provider Cascade**:
  - **Tier 1 (RailRadar API)**: Primary provider providing live GPS coordinates, speed, next station ETA, and complete GeoJSON route vectors.
  - **Tier 2 (ChukChuk NTES Scraper)**: Python FastAPI microservice fallback scraping real-time National Train Enquiry System (NTES) station delay tables.
  - **Tier 3 (RapidAPI Gateway)**: Third-party transit API backup when scrapers encounter IP throttling or CAPTCHA challenges.
  - **Tier 4 (Timetable Math Fallback Engine)**: Purely deterministic internal calculation engine that compares current server timestamp against scheduled station departure times to estimate running delay.

---

## 3. The 3 Strongest Engineering Concepts Demonstrated

### 1. Segment-Aware Interval Collision Formula
Unlike naive booking systems that lock an entire seat for the full train run, RailFlow maximizes coach capacity by allowing non-overlapping station journeys on the exact same seat.
- **Implementation**: `server/src/services/inventoryService.ts`
- **Formula**:
  ```typescript
  // A seat is conflicted if and only if existing allocation overlaps the requested window:
  const isOverlapping = alloc.boardingSeq < toRS.sequence && alloc.alightingSeq > fromRS.sequence;
  ```
- **Result**: Passenger A can occupy Seat 14 from New Delhi (Seq 1) to Kanpur (Seq 3), while Passenger B books Seat 14 from Kanpur (Seq 3) to Varanasi (Seq 6) on the same train departure.

### 2. Two-Phase Hold TTL & Idempotent Verification
Prevents phantom bookings, double-allocations, and abandoned carts under high concurrency.
- **Phase 1 (Lock with Expiration)**: Seat allocations are created with `status: 'LOCKED'` and an explicit `holdExpiresAt = now + 10 minutes`.
- **Phase 2 (Payment Idempotency)**: `payments.ts` verifies incoming payments against a unique client-supplied `idempotencyKey`. If a duplicate network request or retry arrives, the engine returns `{ alreadyProcessed: true }` without re-running card debits or creating duplicate PNR records.
- **Automated Reclaim**: Expired `LOCKED` seats are automatically ignored by availability queries once `holdExpiresAt` has passed, eliminating stale inventory.

### 3. Air-Gapped AI Tool Execution Barrier
Guarantees LLM predictability and prevents malicious prompt injections from causing unauthorized state mutations.
- **Design Pattern**: Command-Query Separation with Tool Calling Sandboxing.
- **Implementation**: The LLM system prompt explicitly states its read-only advisory role. The tool dispatcher (`toolRegistry.ts`) only accepts registered function calls and injects the authenticated session's `userId` programmatically, preventing prompt injection attacks from exfiltrating other users' travel records.

---

## 4. Code vs. README Discrepancy Analysis

| Feature | README / Documentation Claim | Actual Code Implementation (`railflow-app`) | Technical Significance |
| :--- | :--- | :--- | :--- |
| **Database** | Claims PostgreSQL-ready cloud production database. | Production codebase strictly runs SQLite (`prisma/dev.db`) in WAL mode. | SQLite was selected for atomic file-level transactions and self-contained zero-config developer deployment. |
| **Telemetry Provider** | Highlights ChukChuk Python scraper as the primary live tracking source. | Code establishes **RailRadar API** as Tier 1, with ChukChuk FastAPI scraper functioning as Tier 2 fallback. | RailRadar delivers high-fidelity GeoJSON route geometries that ChukChuk's tabular scraper does not provide. |
| **AI Capabilities** | Describes AI as an autonomous ticket booking and booking management assistant. | AI is strictly sandboxed to 5 read-only query tools; forbidden from mutating reservations or processing payments. | Deliberate defense-in-depth architectural pattern preventing AI hallucination or prompt injection financial liability. |
| **Realtime Updates** | Suggests WebSocket / SSE bidirectional socket streams for radar. | Implemented via polling with a strict 60-second in-memory server cache (`trackingCache`) and client-side TanStack Query stale times. | Dramatically simplifies infrastructure complexity and eliminates persistent socket overhead on standard container hosts. |

---

## 5. Recommended Portfolio Placement & Integration

### Placement within Case Study
Integrate these diagrams into the **RailFlow Case Study Modal / Project Detail View** in the following sequence:

1. **System Architecture Diagram** (`railflow-architecture.svg`):
   - **Position**: Immediately below the project hero metrics ("Full-Stack Railway Platform • TypeScript • React 19 • Express • Prisma • Gemini").
   - **Caption**: *Fig 1. End-to-end multi-tier system topology showing decoupled React client, Express domain services, Prisma ORM, and external telemetry integration.*

2. **Booking & Concurrency Lifecycle Diagram** (`railflow-booking-flow.svg`):
   - **Position**: Within the **"Concurrency & Transaction Integrity"** deep-dive section.
   - **Caption**: *Fig 2. Two-stage reservation flow detailing segment-aware seat interval checking, 10-minute hold TTL expiration, and idempotent payment verification.*

3. **AI Reasoning & Telemetry Failover Diagram** (`railflow-ai-tracking.svg`):
   - **Position**: Within the **"AI Integration & Resilient Telemetry"** technical showcase.
   - **Caption**: *Fig 3. Left: Air-gapped Gemini Flash tool barrier enforcing zero state mutation. Right: 4-tier live radar telemetry cascade with deterministic fallback.*

### Visual Integration Code Example (React / Tailwind)
```tsx
<figure className="my-8 rounded-lg border border-[rgba(17,17,16,0.12)] bg-[#f2f2ee] p-4 sm:p-6">
  <img 
    src="/portfolio-diagrams/railflow-architecture.svg" 
    alt="RailFlow Full-Stack System Architecture" 
    className="w-full h-auto object-contain rounded"
    loading="lazy"
  />
  <figcaption className="mt-3 text-xs tracking-wider uppercase font-mono text-neutral-500 text-center">
    Fig 1. RailFlow System Architecture — End-to-end multi-tier pipeline
  </figcaption>
</figure>
```

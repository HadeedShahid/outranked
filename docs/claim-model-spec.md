# Outrank — Free Claim Model Spec

**Status:** draft for implementation
**Supersedes:** the paid-bid model (payments ledger, `amountCents` ranking)

---

## 1. The model

Rank is **recency of claim**, not money.

- Anyone can claim **#1** by submitting a URL. There is no other action — you never choose a rank.
- Claiming pushes every other listing down one place.
- After a claim, #1 is **frozen** for a fixed window. Nobody can take it until the window expires.
- The live board is capped at **100**. Anything below falls into an archive but keeps its product page.
- A listing that has slipped (or been archived) can **re-claim** to jump straight back to #1.
- Each listing has an **owner**; only the owner can re-claim it.

Money is replaced by *time* as the scarce resource. The freeze window is what makes the spot worth having, and what manufactures the anticipation that money used to supply.

### Parameters (tunable, one place)

| Name | Value | Rationale |
|---|---|---|
| `FREEZE_DURATION` | 24h | Long enough to be worth winning; short enough for daily return visits |
| `UNFREEZE_JITTER` | 0–10 min, random | See T-1. Defeats to-the-second cron sniping |
| `BOARD_CAP` | 100 | Beyond this the page is dead weight |
| `RECLAIM_COOLDOWN` | none | Displacement is the only gate — see E-4 |

---

## 2. Data model

```
Listing
  id            text primary key      -- normalised domain key
  url           text                  -- canonical https URL
  title         text
  description   text
  image_url     text null
  category_slug text
  first_claim_at timestamptz          -- never changes; for "member since"
  click_count   int default 0
  owner_hash    text                  -- sha256 of the ownership token
  owner_email   text null             -- optional, double opt-in only
  email_verified bool default false
  status        text                  -- 'live' | 'archived' | 'removed'

Claim                                 -- the ledger; replaces Payment
  id            uuid primary key
  listing_id    text references Listing
  claimed_at    timestamptz           -- server clock only
  released_at   timestamptz null      -- set when displaced
  source_ip_hash text                 -- hashed, for abuse forensics only
```

Rank on the live board = `ORDER BY claimed_at DESC` over each listing's **most recent** claim.

The three existing boards survive unchanged, because they were already date filters over a ledger:

- **All-time** — every listing by latest claim
- **Today** — listings claimed in the rolling 24h
- **Daily** — listings claimed within a given UTC day

`rankListings()` changes from *sum of amounts* to *latest claim timestamp*. Nothing above it changes.

---

## 3. Claim lifecycle

```
                    ┌─────────────┐
  new URL ─────────▶│   CLAIMED   │  #1, freeze starts
                    └──────┬──────┘
                           │ freeze expires (+ jitter)
                    ┌──────▼──────┐
                    │  CONTESTED  │  anyone may take #1
                    └──────┬──────┘
                           │ someone else claims
                    ┌──────▼──────┐
                    │  DISPLACED  │  shifts down one rank
                    └──────┬──────┘
              rank > 100   │        owner re-claims
                    ┌──────▼──────┐         │
                    │  ARCHIVED   │─────────┘ jumps to #1
                    └─────────────┘
```

`removed` is a terminal admin state (§6, A-1) and is excluded from every board.

---

## 4. Claim rules

**R-1.** A claim always targets #1. There is no rank selection.

**R-2.** A claim is rejected while `frozen_until > now()`. The UI shows a countdown instead of a button.

**R-3.** A claim on an **existing** listing (same normalised key) moves that listing — it never creates a second row. This preserves the product page, click history, and ownership across the whole cycle.

**R-4.** The **current #1 cannot re-claim**. Without this, one listing squats forever by refreshing its own freeze. Displacement is a precondition.

**R-5.** Re-claiming an existing listing requires ownership proof (§5). A first claim on an unclaimed domain requires none.

**R-6.** Falling past `BOARD_CAP` sets `status = 'archived'`. Archived listings keep their product page and can re-claim normally. Archiving is presentational — no data is deleted.

---

## 5. Ownership

Ownership must be provable without an account system and without email on the critical path.

**On first claim:**
1. Server generates a 256-bit random token.
2. Stores `sha256(token)` — never the token itself.
3. Sets it in an `httpOnly; Secure; SameSite=Lax` cookie.
4. Displays it **once** as a recovery code.

**On re-claim,** ownership is proven by, in order: the cookie (silent), the pasted recovery code, or an emailed code if a verified address exists.

**Email is optional and captured after the fact** — on the success screen and on the countdown screen, never before the claim. Its primary job is retention (*"you've been outranked"*), not authentication.

**Dispute escape hatch:** if someone can prove control of the domain via a DNS `TXT` record or a `<meta>` tag, they take over the listing. This exists only for squatting disputes and never gates a normal claim.

---

## 6. Threat model

Written adversarially — as the bot operator and the pen tester, not the author.

### T-1 · Cron sniping the unfreeze
**Attack:** freeze expiry is public and exact. A fifteen-line script polls and fires at the millisecond, permanently owning #1.
**Severity:** critical — kills the product.
**Mitigation:** randomise actual expiry within `UNFREEZE_JITTER` (0–10 min) and never expose the exact value. The countdown displays the *earliest* possible time. A sniper must now poll for ten minutes rather than fire once, which raises cost and lets rate limiting bite.

### T-2 · Claim race at expiry
**Attack:** two claims arrive in the same millisecond; both read "unfrozen", both write. Result: duplicate #1 or corrupted ordering. Classic TOCTOU.
**Severity:** high.
**Mitigation:** the claim must be a single atomic conditional write —
`UPDATE ... WHERE frozen_until <= now()` inside a transaction with a row lock on the board head. Losers get a clean "someone beat you by 200ms", which is good theatre. Never read-then-write.

### T-3 · Turnstile bypass
**Attack (a):** verifying the token client-side only — trivially skipped by POSTing the API directly.
**Attack (b):** replaying one token across many claims.
**Attack (c):** commercial solving services (~$1–2 per 1000).
**Severity:** high.
**Mitigation:** verify server-side via siteverify on every claim; record consumed token hashes to reject replays; treat (c) as unavoidable and rely on the freeze — a solved CAPTCHA buys one claim per day, which is poor economics.

### T-4 · IP rotation defeats rate limiting
**Attack:** residential proxies make per-IP limits meaningless.
**Severity:** medium.
**Mitigation:** don't rely on IP alone. Layer IP + Turnstile + cookie, and store `source_ip_hash` for forensics. Accept that IP limiting only stops the lazy.

### T-5 · Normalisation bypass → duplicate listings
**Attack:** `example.com`, `www.example.com`, `EXAMPLE.com`, `example.com/`, `example.com?utm=x`, `example.com#a` all claimed separately to occupy multiple ranks — or to sidestep the "already owned" check.
**Severity:** high (defeats ownership entirely).
**Mitigation:** one normalisation function, applied to **both** the listing key and the ownership lookup. Lowercase host, strip `www.`, drop query and fragment, strip trailing slash. Already implemented in `lib/domain/url.ts`; the requirement is that ownership checks use the *same* key, never the raw input.

### T-6 · IDN homograph squatting
**Attack:** `аpple.com` with a Cyrillic `а` renders identically to `apple.com` but is a distinct key.
**Severity:** medium — enables convincing impersonation.
**Mitigation:** normalise to punycode before keying. Flag mixed-script hostnames for review rather than auto-rejecting (legitimate non-Latin domains exist).

### T-7 · SSRF via metadata fetch — **existing gap**
**Attack:** the claim endpoint fetches an attacker-supplied URL server-side. Current defence is a *hostname string* check, which does **not** stop: a public hostname whose DNS resolves to `127.0.0.1`; DNS rebinding (public on check, private on connect); or a redirect chain ending at an internal address.
**Severity:** high. This is live in `lib/domain/metadata.ts` today.
**Mitigation:** resolve DNS first, reject if **any** resolved address is private/loopback/link-local, then connect to the validated IP with the `Host` header preserved. Cap redirects at 3 and re-validate each hop. Keep the existing timeout and byte cap.

### T-8 · Stored XSS via listing metadata
**Attack:** attacker controls their own page's `og:title` / `og:description`, which we render.
**Severity:** high if mishandled.
**Mitigation:** React escapes by default — the rule is never to pass listing metadata through `dangerouslySetInnerHTML`, and to escape explicitly when it reaches non-JSX sinks (`<meta>` tags, JSON-LD, OG images). Strip control characters and cap length on ingest.

### T-9 · Dangerous URL schemes
**Attack:** `javascript:` or `data:` URL stored and rendered as an `href`.
**Severity:** high.
**Mitigation:** allow `http`/`https` only, enforced at normalisation *and* re-checked at render.

### T-10 · og:image as a tracking / malicious vector
**Attack:** `og:image` points at an attacker host, leaking every visitor's IP and user-agent — or serves a decompression bomb.
**Severity:** low–medium.
**Mitigation:** proxy and re-encode images through our own domain with a size cap, or accept the leak knowingly. Never render an attacker-controlled URL directly as `<img src>` in the long term.

### T-11 · Ownership token attacks
**Attack:** brute-forcing recovery codes; timing attacks on comparison; stolen cookies.
**Severity:** high.
**Mitigation:** 256-bit tokens, `sha256` at rest, constant-time comparison, rate limit verification attempts per listing, `httpOnly; Secure; SameSite=Lax`.

### T-12 · CSRF on claim / re-claim
**Attack:** a third-party page auto-submits a POST; the victim's ownership cookie rides along and re-claims (or burns) their listing.
**Severity:** medium.
**Mitigation:** `SameSite=Lax` plus a server-side `Origin`/`Referer` check on all mutating routes.

### T-13 · Clickjacking
**Attack:** the site is iframed with an invisible overlay so users claim without realising.
**Severity:** medium.
**Mitigation:** `Content-Security-Policy: frame-ancestors 'none'`.

### T-14 · Email as a spam relay
**Attack:** enter a victim's address as a listing's contact; they receive mail from us. Repeat to harass.
**Severity:** medium — a deliverability and reputation risk.
**Mitigation:** double opt-in; nothing is sent to an unverified address beyond one confirmation; per-address rate limits; one-click unsubscribe.

### T-15 · Enumeration
**Attack:** probing the recovery endpoint to learn which domains are claimed or which have emails.
**Severity:** low.
**Mitigation:** uniform responses and uniform timing regardless of existence.

### T-16 · Content abuse
**Attack:** scam, adult, or malware site claims #1 and sits on the front page for a full freeze window.
**Severity:** high — reputational, and an ad-network disqualifier.
**Mitigation:** admin removal (A-1) that both hides the listing and releases the freeze immediately; a domain blocklist checked on claim; `rel="nofollow ugc"` on every outbound listing link.

### T-17 · Clock trust
**Attack:** client-supplied timestamps used for freeze arithmetic.
**Severity:** high if present.
**Mitigation:** all freeze and ranking arithmetic uses server time exclusively. Client clocks are display-only.

---

## 7. Edge cases

| # | Case | Resolution |
|---|---|---|
| E-1 | Double-click submits twice | Atomic conditional write (T-2) makes the second a no-op; return the same result idempotently |
| E-2 | Board is empty (first ever claim) | First claim takes #1; no freeze applies to an empty board |
| E-3 | Only one listing exists | It holds #1; freeze still applies, so it cannot refresh itself (R-4) |
| E-4 | Owner tries to re-claim while at #1 | Rejected by R-4. UI shows "you already hold #1" rather than an error |
| E-5 | Listing removed by admin while at #1 | Freeze released immediately; #2 promotes to #1 and starts a fresh freeze |
| E-6 | Listing at exactly rank 100 gets displaced | Moves to archived; keeps product page; can re-claim |
| E-7 | Archived listing re-claims | Jumps to #1, `status` → live, listing at 100 archives. Same row throughout |
| E-8 | Two listings with identical `claimed_at` | Tie-break on `first_claim_at` ascending — the older listing wins, matching the paid model's convention |
| E-9 | Metadata fetch fails or times out | Claim still succeeds; title falls back to the domain. Never block a claim on a third party |
| E-10 | Owner loses cookie and recovery code, no email | Only route is the domain-verification escape hatch (§5). Documented, not a support burden |
| E-11 | Domain changes hands in real life | New owner uses the verification escape hatch to take over |
| E-12 | Claim arrives during the jitter window | Treated as frozen until true expiry; countdown continues to show the earliest time |
| E-13 | Category changed on re-claim | Allowed — re-claim may update category and refresh metadata |
| E-14 | Same domain submitted with a different path | Normalises to the same key (T-5), so it is a re-claim, except on path-keyed platform hosts |
| E-15 | Turnstile fails to load (blocked / offline) | Fail closed — no claim without verification. Show a clear message, not a silent failure |

---

## 8. Required response headers

```
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Outbound listing links: `rel="nofollow ugc noopener noreferrer"`, `target="_blank"`.

---

## 9. Admin

**A-1 · Removal.** One authenticated route that sets `status = 'removed'`, hides the listing from every board, and releases the freeze so the board recovers immediately. This is the single non-negotiable operational control — without it, T-16 has no answer.

Authentication: a server-side secret in an env var for v1. Not a user system.

---

## 10. Implementation phases

**Phase 1 — engine**
Replace the payments ledger with the claims ledger. `rankListings()` sorts by latest `claimed_at`. Board cap and archive status. Atomic claim with row lock (T-2).

**Phase 2 — claim path**
Turnstile server-side verification (T-3). Ownership token issue and verify (T-11). Origin check and headers (T-12, T-13). Harden the SSRF gap (T-7).

**Phase 3 — UI**
Countdown / claim button states. Recovery code display. Archive page. Remove the money-based gap labels from rows — they are meaningless without amounts.

**Phase 4 — retention**
Double opt-in email (T-14). "You've been outranked" and "spot opens soon" notifications.

**Phase 5 — operations**
Admin removal (A-1). Domain blocklist. Verification escape hatch.

---

## 11. Open decisions

1. **Freeze duration.** 24h is the recommendation, not a settled value. Shorter means more churn and more page views; longer means a more valuable spot and fewer claims.
2. **Do the Today / Daily boards survive?** They add navigation weight and, with one claim per day, may be near-empty. Consider shipping the all-time board alone.
3. **Is the archive browsable or just deep-linked?** A browsable archive is SEO surface; it is also a page nobody reads.
4. **Category-level boards** — with a 24h freeze there may be too few claims to fill 16 categories. Consider cutting the category list substantially, or dropping per-category boards until volume justifies them.

# Deploy Package

## Files to push to repo:

| File | Destination |
|------|------------|
| worker.ts | / (repo root) |
| wrangler.toml | / (repo root) |
| src/App.tsx | /src/ |
| src/components/FeaturedCollections.tsx | /src/components/ |
| src/components/TileAI.tsx | /src/components/ |

## What changed:
- worker.ts: reads "Photo" attachment field → thumbnailUrl, "Product Photo" URL field → productPhotoUrl
- FeaturedCollections.tsx: cards show photo only, details on click, AI filter banner
- TileAI.tsx: combined search+chat panel, auto-suggests similar on cart change
- App.tsx: wires AI filter from cart to grid

# Buildraeth data sources

Snapshot policy date: **2026-09-19**

Buildraeth separates current Early Access facts from older Demo/playtest records.

## Current / official
- Dimraeth Steam store: https://store.steampowered.com/app/2402680/Dimraeth/
- Mudtek Steam news and developer posts: https://steamcommunity.com/app/2402680/allnews/

## Historical archive
- Deprecated community wiki: https://dimraeth.wiki.gg/

Historical spell/equipment records are labelled **Demo Legacy** and require Early Access re-verification.

## Update workflow
1. `npm run data:fetch` downloads raw wiki.gg MediaWiki snapshots.
2. Review changes manually. Never auto-promote historical values to current EA.
3. Update curated JSON under `data/`, preserving `dataStatus` and `sourceUrl`.
4. Run `npm run data:validate`.
5. Run `npm run build`.

Raw snapshots are ignored by git by default.

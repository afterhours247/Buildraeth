# Buildraeth

Buildraeth is an unofficial, static-first character planner and build-sharing tool for **Dimraeth**.

## Current MVP
- Human / Elf / Minotaur × Mage / Brawler / Shadow
- EA-style pan/zoom skill-tree planner with allocations and prerequisites
- Five-spell loadout planning
- 62 archived Demo modifiers
- Eight equipment-slot set planning
- 46 historical Demo/playtest spell records
- 23 historical Demo set records
- Searchable compendium
- Provenance badges
- Local autosave
- Shareable URL builds including skill-tree allocations
- JSON import/export
- Curated concept browser
- GitHub issue-based build submissions
- GitHub Pages deployment

## Data policy
Dimraeth entered Early Access on September 15, 2026. Older Demo data remains useful but is never silently presented as current.

See [DATA_SOURCES.md](DATA_SOURCES.md).

## Commands
```bash
npm install
npm run data:validate
npm run dev
npm run build
npm run data:fetch
```

## Disclaimer
Buildraeth is an unofficial fan project and is not affiliated with or endorsed by Mudtek.


## Skill-tree reconstruction

Buildraeth mirrors the documented Early Access mental model: race branches, class branches, archetype corners, spell nodes and modifier branches.

The interaction engine is production-ready, but individual node coordinates are only treated as exact when verified from the current EA client. Historical Demo spell records remain clearly marked until the community replaces them with current evidence.

Use the **Skill tree correction** issue template to submit screenshots, node placement, prerequisites or rank corrections.

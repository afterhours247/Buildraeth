import { useEffect, useMemo, useState } from "react";
import { CLASSES, RACES, SPELL_OPTIONS, TEMPLATES } from "./data";
import type { BuildState, BuildTemplate, CharacterClass, Race } from "./types";

type View = "builder" | "browse" | "data";

const DEFAULT_BUILD: BuildState = {
  title: "Untitled Build",
  race: "Human",
  characterClass: "Mage",
  spells: ["empty", "empty", "empty", "empty", "empty"],
  notes: "",
};

const STORAGE_KEY = "buildraeth-draft-v1";

function encodeBuild(build: BuildState) {
  const bytes = new TextEncoder().encode(JSON.stringify(build));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBuild(value: string): BuildState | null {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as BuildState;

    if (
      !parsed ||
      !RACES.includes(parsed.race) ||
      !CLASSES.includes(parsed.characterClass) ||
      !Array.isArray(parsed.spells)
    ) {
      return null;
    }

    return {
      ...DEFAULT_BUILD,
      ...parsed,
      spells: [...parsed.spells.slice(0, 5), ...Array(5).fill("empty")].slice(0, 5),
    };
  } catch {
    return null;
  }
}

function initialBuild(): BuildState {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("build");
  if (hash) {
    const decoded = decodeBuild(hash);
    if (decoded) return decoded;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_BUILD, ...(JSON.parse(saved) as BuildState) };
    } catch {
      return DEFAULT_BUILD;
    }
  }

  return DEFAULT_BUILD;
}

function RuneMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "rune-mark rune-mark--small" : "rune-mark"} aria-hidden="true">
      <span />
    </span>
  );
}

function App() {
  const [view, setView] = useState<View>("builder");
  const [build, setBuild] = useState<BuildState>(initialBuild);
  const [shareLabel, setShareLabel] = useState("Copy build link");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(build));
  }, [build]);

  const selectedSpellLabels = useMemo(
    () =>
      build.spells.map(
        (id) => SPELL_OPTIONS.find((spell) => spell.id === id)?.label ?? "Unknown record",
      ),
    [build.spells],
  );

  const updateSpell = (index: number, id: string) => {
    setBuild((current) => {
      const spells = [...current.spells];
      spells[index] = id;
      return { ...current, spells };
    });
  };

  const share = async () => {
    const encoded = encodeBuild(build);
    const url = new URL(window.location.href);
    url.hash = "build=" + encoded;
    window.history.replaceState(null, "", url);

    try {
      await navigator.clipboard.writeText(url.toString());
      setShareLabel("Copied!");
    } catch {
      setShareLabel("Link ready in address bar");
    }

    window.setTimeout(() => setShareLabel("Copy build link"), 1800);
  };

  const loadTemplate = (template: BuildTemplate) => {
    const { id: _id, description: _description, tags: _tags, ...nextBuild } = template;
    setBuild(nextBuild);
    setView("builder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("builder")} aria-label="Buildraeth home">
          <RuneMark small />
          <span className="brand-copy">
            <strong>BUILDRAETH</strong>
            <small>UNOFFICIAL DIMRAETH BUILDER</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="Primary navigation">
          <button className={view === "builder" ? "active" : ""} onClick={() => setView("builder")}>
            Builder
          </button>
          <button className={view === "browse" ? "active" : ""} onClick={() => setView("browse")}>
            Browse
          </button>
          <button className={view === "data" ? "active" : ""} onClick={() => setView("data")}>
            Game Data
          </button>
        </nav>

        <a
          className="ghost-button github-link"
          href="https://github.com/afterhours247/Buildraeth"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </header>

      <main>
        {view === "builder" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">FORGE YOUR ARCHETYPE</span>
                <h1>Build first. Respec less.</h1>
                <p>
                  Shape a Dimraeth loadout, keep it locally, and share it as a link. No account and
                  no backend required.
                </p>
              </div>
              <div className="hero-rune" aria-hidden="true">
                <RuneMark />
                <div className="orbit orbit-a" />
                <div className="orbit orbit-b" />
              </div>
            </section>

            <section className="builder-grid">
              <aside className="panel parchment-panel identity-panel">
                <div className="panel-heading">
                  <span className="step-number">I</span>
                  <div>
                    <span className="kicker">ARCHETYPE</span>
                    <h2>Who are you forging?</h2>
                  </div>
                </div>

                <label className="field">
                  <span>Build name</span>
                  <input
                    value={build.title}
                    maxLength={56}
                    onChange={(event) => setBuild({ ...build, title: event.target.value })}
                  />
                </label>

                <div className="field">
                  <span>Race</span>
                  <div className="choice-grid">
                    {RACES.map((race) => (
                      <button
                        key={race}
                        className={build.race === race ? "choice active" : "choice"}
                        onClick={() => setBuild({ ...build, race: race as Race })}
                      >
                        <span className="choice-sigil">{race.slice(0, 1)}</span>
                        {race}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <span>Class</span>
                  <div className="choice-grid">
                    {CLASSES.map((characterClass) => (
                      <button
                        key={characterClass}
                        className={build.characterClass === characterClass ? "choice active" : "choice"}
                        onClick={() =>
                          setBuild({
                            ...build,
                            characterClass: characterClass as CharacterClass,
                          })
                        }
                      >
                        <span className="choice-sigil">{characterClass.slice(0, 1)}</span>
                        {characterClass}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="panel spell-panel">
                <div className="panel-heading inverse">
                  <span className="step-number">II</span>
                  <div>
                    <span className="kicker">SPELL LOADOUT</span>
                    <h2>Five slots. One plan.</h2>
                  </div>
                  <span className="source-chip">DATA SEED</span>
                </div>

                <div className="spell-wheel">
                  <div className="spell-core">
                    <RuneMark small />
                    <span>5</span>
                    <small>SLOTS</small>
                  </div>
                  {build.spells.map((spellId, index) => {
                    const option = SPELL_OPTIONS.find((item) => item.id === spellId);
                    return (
                      <label className={"spell-slot spell-slot-" + (index + 1)} key={index}>
                        <span className="slot-index">{index + 1}</span>
                        <select value={spellId} onChange={(event) => updateSpell(index, event.target.value)}>
                          {SPELL_OPTIONS.map((spell) => (
                            <option key={spell.id} value={spell.id}>
                              {spell.label}
                            </option>
                          ))}
                        </select>
                        <small>{option?.status === "placeholder" ? "placeholder" : "open slot"}</small>
                      </label>
                    );
                  })}
                </div>

                <div className="data-warning">
                  <strong>⚑ Data honesty:</strong> race, class, and five-slot structure are seeded from
                  public game information. Spell names here are placeholders until the importer lands.
                </div>
              </section>

              <aside className="panel summary-panel">
                <div className="panel-heading inverse">
                  <span className="step-number">III</span>
                  <div>
                    <span className="kicker">BUILD SCROLL</span>
                    <h2>Ready to share</h2>
                  </div>
                </div>

                <div className="build-card">
                  <div className="build-card-title">
                    <RuneMark small />
                    <div>
                      <strong>{build.title || "Untitled Build"}</strong>
                      <span>{build.race} · {build.characterClass}</span>
                    </div>
                  </div>

                  <div className="slot-stack">
                    {selectedSpellLabels.map((label, index) => (
                      <div className="slot-row" key={index}>
                        <span>{index + 1}</span>
                        <strong>{label}</strong>
                      </div>
                    ))}
                  </div>

                  <label className="notes">
                    <span>Notes</span>
                    <textarea
                      value={build.notes}
                      placeholder="Rotation, synergies, stat goals, boss notes..."
                      onChange={(event) => setBuild({ ...build, notes: event.target.value })}
                    />
                  </label>
                </div>

                <button className="primary-button" onClick={share}>
                  ⛓ {shareLabel}
                </button>
                <button className="text-button" onClick={() => setBuild(DEFAULT_BUILD)}>
                  Reset draft
                </button>
              </aside>
            </section>

            <section className="coming-strip">
              <span className="kicker">NEXT FOR THE FORGE</span>
              <div className="coming-items">
                <span>Equipment</span>
                <span>Skill tree</span>
                <span>Attributes</span>
                <span>Modifiers</span>
                <span>Community builds</span>
              </div>
            </section>
          </>
        )}

        {view === "browse" && (
          <section className="page-section">
            <div className="section-intro">
              <span className="eyebrow">COMMUNITY FORGE</span>
              <h1>Builds will live here.</h1>
              <p>
                The first version ships with local skeletons. Community publishing can be added later
                without making the core builder depend on a paid backend.
              </p>
            </div>
            <div className="template-grid">
              {TEMPLATES.map((template) => (
                <article className="template-card" key={template.id}>
                  <div className="template-topline">
                    <span>{template.race}</span>
                    <span>{template.characterClass}</span>
                  </div>
                  <h2>{template.title}</h2>
                  <p>{template.description}</p>
                  <div className="tag-row">
                    {template.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <button className="primary-button compact" onClick={() => loadTemplate(template)}>
                    Open in builder
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "data" && (
          <section className="page-section data-page">
            <div className="section-intro">
              <span className="eyebrow">THE LEDGER</span>
              <h1>Know what is real.</h1>
              <p>
                Buildraeth keeps provenance visible so Early Access balance changes do not quietly turn
                old assumptions into fake facts.
              </p>
            </div>

            <div className="data-grid">
              <article className="data-card verified">
                <span className="status-dot" />
                <div>
                  <small>VERIFIED SEED</small>
                  <h2>Current EA archetypes</h2>
                  <p>Human, Elf, Minotaur · Mage, Brawler, Shadow</p>
                </div>
              </article>
              <article className="data-card verified">
                <span className="status-dot" />
                <div>
                  <small>VERIFIED SEED</small>
                  <h2>Spell loadout</h2>
                  <p>Five equipped spell slots are represented in the builder.</p>
                </div>
              </article>
              <article className="data-card pending">
                <span className="status-dot" />
                <div>
                  <small>PENDING IMPORT</small>
                  <h2>Spells and modifiers</h2>
                  <p>Waiting for a source-backed community dataset or importer.</p>
                </div>
              </article>
              <article className="data-card pending">
                <span className="status-dot" />
                <div>
                  <small>PENDING IMPORT</small>
                  <h2>Items and equipment</h2>
                  <p>No fabricated stats. These stay empty until they can be sourced.</p>
                </div>
              </article>
            </div>

            <div className="source-note">
              <RuneMark small />
              <div>
                <strong>Planned data pipeline</strong>
                <p>Official/public sources → normalization → review → static JSON → site build.</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>Buildraeth is an unofficial fan project.</span>
        <span>Not affiliated with or endorsed by Mudtek.</span>
      </footer>
    </div>
  );
}

export default App;

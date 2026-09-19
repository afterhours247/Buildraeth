import { useMemo, useRef, useState } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction, WheelEvent } from "react";
import { generateSkillTree, type SkillTreeNode } from "./skillTree";
import type { BuildState, Modifier, Spell } from "./types";
import "./skill-tree.css";

type Props = {
  build: BuildState;
  setBuild: Dispatch<SetStateAction<BuildState>>;
  spells: Spell[];
  modifiers: Modifier[];
};

const SECTION_LABELS = {
  core: "Archetype core",
  race: "Race tree",
  class: "Class tree",
  archetype: "Archetype tree",
  archive: "Unmapped archive",
};

function nodeState(
  node: SkillTreeNode,
  allocations: Record<string, number>,
  nodeMap: Map<string, SkillTreeNode>,
) {
  if (node.cost === 0) return "free";
  if ((allocations[node.id] ?? 0) > 0) return "allocated";
  const unlocked = node.prerequisiteIds.every(
    (id) => (allocations[id] ?? 0) > 0 || (nodeMap.get(id)?.cost ?? 1) === 0,
  );
  return unlocked ? "available" : "locked";
}

export default function SkillTree({ build, setBuild, spells, modifiers }: Props) {
  const tree = useMemo(
    () => generateSkillTree(build.race, build.characterClass, spells, modifiers),
    [build.race, build.characterClass, spells, modifiers],
  );
  const nodeMap = useMemo(() => new Map(tree.nodes.map((node) => [node.id, node])), [tree]);
  const [selectedId, setSelectedId] = useState("core");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 800, y: 500 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; cx: number; cy: number } | null>(null);

  const allocations = build.treeAllocations ?? {};
  const spent = Object.entries(allocations).reduce((sum, [id, rank]) => {
    const node = nodeMap.get(id);
    return sum + (node?.cost ?? 0) * rank;
  }, 0);
  const budget = build.skillPointBudget ?? 60;
  const available = Math.max(0, budget - spent);
  const selected = nodeMap.get(selectedId) ?? nodeMap.get("core")!;

  const allocate = (node: SkillTreeNode) => {
    const state = nodeState(node, allocations, nodeMap);
    if (node.cost === 0 || state === "locked" || available < node.cost) return;
    setBuild((current) => ({
      ...current,
      treeAllocations: {
        ...(current.treeAllocations ?? {}),
        [node.id]: Math.min(node.maxRank, (current.treeAllocations?.[node.id] ?? 0) + 1),
      },
    }));
  };

  const refund = (node: SkillTreeNode) => {
    if (!(allocations[node.id] > 0)) return;
    const dependentIds = new Set<string>([node.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const candidate of tree.nodes) {
        if (
          !dependentIds.has(candidate.id) &&
          candidate.prerequisiteIds.some((id) => dependentIds.has(id)) &&
          (allocations[candidate.id] ?? 0) > 0
        ) {
          dependentIds.add(candidate.id);
          changed = true;
        }
      }
    }
    setBuild((current) => {
      const next = { ...(current.treeAllocations ?? {}) };
      dependentIds.forEach((id) => delete next[id]);
      return { ...current, treeAllocations: next };
    });
  };

  const equipSelected = () => {
    if (!selected.spellId) return;
    setBuild((current) => {
      const spellsNext = [...current.spells];
      const existingIndex = spellsNext.findIndex((slot) => slot.spellId === selected.spellId);
      const index = existingIndex >= 0 ? existingIndex : spellsNext.findIndex((slot) => !slot.spellId);
      if (index < 0) return current;
      spellsNext[index] = {
        spellId: selected.spellId,
        modifierId: selected.modifierId ?? spellsNext[index].modifierId ?? "",
      };
      return { ...current, spells: spellsNext };
    });
  };

  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const next = Math.max(.45, Math.min(2.3, zoom * (event.deltaY > 0 ? .9 : 1.1)));
    setZoom(next);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const target = event.target as Element;
    if (target.closest("[data-tree-node]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, cx: center.x, cy: center.y };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const scale = 1 / zoom;
    setCenter({
      x: drag.cx - (event.clientX - drag.x) * scale,
      y: drag.cy - (event.clientY - drag.y) * scale,
    });
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  const viewWidth = tree.bounds.width / zoom;
  const viewHeight = tree.bounds.height / zoom;
  const viewBox = [
    center.x - viewWidth / 2,
    center.y - viewHeight / 2,
    viewWidth,
    viewHeight,
  ].join(" ");

  const sectionClass = (section: SkillTreeNode["section"]) => "tree-section-" + section;

  return (
    <section className="skill-tree-shell">
      <div className="skill-tree-header">
        <div>
          <span className="eyebrow">SKILL TREE PLANNER</span>
          <h2>{build.race} {build.characterClass}</h2>
          <p>
            EA-style combined tree visualization. Structure follows the documented race/class/archetype
            compass; archived spell placement remains a reconstruction until verified in the live client.
          </p>
        </div>
        <div className="skill-point-panel">
          <label>
            <span>Planner budget</span>
            <input
              type="number"
              min={0}
              max={999}
              value={budget}
              onChange={(event) =>
                setBuild((current) => ({
                  ...current,
                  skillPointBudget: Math.max(0, Math.min(999, Number(event.target.value) || 0)),
                }))
              }
            />
          </label>
          <div><strong>{available}</strong><span>Available</span></div>
          <div><strong>{spent}</strong><span>Spent</span></div>
          <button
            type="button"
            className="tree-reset"
            onClick={() => setBuild((current) => ({ ...current, treeAllocations: {} }))}
          >
            Respec
          </button>
        </div>
      </div>

      <div className="skill-tree-workspace">
        <div className="tree-stage">
          <div className="tree-controls" aria-label="Skill tree view controls">
            <button type="button" onClick={() => setZoom((value) => Math.min(2.3, value * 1.15))}>＋</button>
            <button type="button" onClick={() => setZoom((value) => Math.max(.45, value / 1.15))}>−</button>
            <button type="button" onClick={() => { setZoom(1); setCenter({ x: 800, y: 500 }); }}>⌾</button>
          </div>
          <svg
            className="tree-canvas"
            viewBox={viewBox}
            role="application"
            aria-label="Interactive Buildraeth skill tree"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
          >
            <defs>
              <pattern id="tree-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="rgba(201,168,95,.055)" strokeWidth="1" />
              </pattern>
              <radialGradient id="tree-core-glow">
                <stop offset="0%" stopColor="rgba(223,185,94,.35)" />
                <stop offset="100%" stopColor="rgba(223,185,94,0)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width={tree.bounds.width} height={tree.bounds.height} className="tree-bg" />
            <rect x="0" y="0" width={tree.bounds.width} height={tree.bounds.height} fill="url(#tree-grid)" />
            <circle cx="800" cy="500" r="175" fill="url(#tree-core-glow)" />

            <g className="tree-edges">
              {tree.edges.map((edge) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;
                const active =
                  from.cost === 0
                    ? (allocations[to.id] ?? 0) > 0
                    : (allocations[from.id] ?? 0) > 0 && (allocations[to.id] ?? 0) > 0;
                return (
                  <line
                    key={edge.from + "-" + edge.to}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={active ? "tree-edge active" : "tree-edge"}
                  />
                );
              })}
            </g>

            <g className="tree-axis-labels" aria-hidden="true">
              <text x="800" y="42" textAnchor="middle">RACE TREE</text>
              <text x="800" y="975" textAnchor="middle">RACE TREE</text>
              <text x="1540" y="505" textAnchor="end">CLASS TREE</text>
              <text x="60" y="505">CLASS TREE</text>
              <text x="1320" y="105" textAnchor="middle">ARCHETYPE</text>
              <text x="280" y="105" textAnchor="middle">ARCHETYPE</text>
              <text x="1320" y="915" textAnchor="middle">ARCHETYPE</text>
              <text x="280" y="915" textAnchor="middle">ARCHETYPE</text>
            </g>

            <g className="tree-nodes">
              {tree.nodes.map((node) => {
                const state = nodeState(node, allocations, nodeMap);
                const isSelected = selected.id === node.id;
                const className = [
                  "tree-node",
                  "tree-node-" + node.kind,
                  sectionClass(node.section),
                  "tree-node-" + state,
                  isSelected ? "selected" : "",
                ].filter(Boolean).join(" ");
                const size = node.kind === "core" ? 50 : node.kind === "hub" ? 24 : node.kind === "spell" ? 23 : 13;
                return (
                  <g
                    key={node.id}
                    data-tree-node
                    className={className}
                    transform={"translate(" + node.x + " " + node.y + ")"}
                    role="button"
                    tabIndex={0}
                    aria-label={node.label + ", " + state}
                    onClick={(event) => { event.stopPropagation(); setSelectedId(node.id); }}
                    onDoubleClick={(event) => { event.stopPropagation(); allocate(node); }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(node.id);
                        allocate(node);
                      }
                    }}
                  >
                    {node.kind === "core" ? (
                      <>
                        <circle r="68" className="node-core-ring" />
                        <rect x="-36" y="-36" width="72" height="72" rx="4" transform="rotate(45)" className="node-shape" />
                        <text y="5" textAnchor="middle" className="node-core-letter">{build.race[0]}{build.characterClass[0]}</text>
                      </>
                    ) : node.kind === "modifier" ? (
                      <circle r={size} className="node-shape" />
                    ) : (
                      <rect x={-size} y={-size} width={size * 2} height={size * 2} rx={node.kind === "hub" ? 9 : 4} transform="rotate(45)" className="node-shape" />
                    )}
                    {node.kind === "spell" && <text y="4" textAnchor="middle" className="node-letter">{node.label[0]}</text>}
                    {(node.kind === "spell" || node.kind === "hub") && (
                      <text y={node.kind === "hub" ? 45 : 42} textAnchor="middle" className="node-label">{node.label}</text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="tree-legend">
            <span><i className="legend-race"/>Race</span>
            <span><i className="legend-class"/>Class</span>
            <span><i className="legend-archetype"/>Archetype</span>
            <span><i className="legend-archive"/>Unmapped archive</span>
            <small>Drag to pan · wheel to zoom · double-click a node to allocate</small>
          </div>
        </div>

        <aside className="tree-inspector">
          <span className="kicker">{SECTION_LABELS[selected.section]}</span>
          <h3>{selected.label}</h3>
          {selected.subtitle && <div className="tree-node-subtitle">{selected.subtitle}</div>}
          <div className={"tree-data-state state-" + (selected.dataStatus ?? "community-pending")}>
            {(selected.dataStatus ?? "community-pending").replaceAll("-", " ")}
          </div>
          <p>{selected.description || "No verified description yet."}</p>

          <dl>
            <div><dt>Cost</dt><dd>{selected.cost || "Free"}</dd></div>
            <div><dt>Rank</dt><dd>{allocations[selected.id] ?? 0} / {selected.maxRank}</dd></div>
            <div><dt>State</dt><dd>{nodeState(selected, allocations, nodeMap)}</dd></div>
          </dl>

          <div className="tree-inspector-actions">
            {selected.cost > 0 && (
              <>
                <button
                  type="button"
                  className="primary-button inline-primary"
                  disabled={nodeState(selected, allocations, nodeMap) === "locked" || available < selected.cost || (allocations[selected.id] ?? 0) >= selected.maxRank}
                  onClick={() => allocate(selected)}
                >
                  Allocate point
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={(allocations[selected.id] ?? 0) === 0}
                  onClick={() => refund(selected)}
                >
                  Refund branch
                </button>
              </>
            )}
            {selected.spellId && (
              <button type="button" className="ghost-button" onClick={equipSelected}>
                Equip in loadout
              </button>
            )}
          </div>

          {selected.sourceUrl && (
            <a className="tree-source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">
              Open source ↗
            </a>
          )}

          <div className="tree-honesty-note">
            <strong>Reconstruction status</strong>
            <p>
              The compass layout and tree layers follow current EA documentation. Individual archived spell
              positions are provisional until matched against live Early Access screenshots.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

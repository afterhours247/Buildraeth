import type { Modifier, Spell } from "./types";

export type TreeSection = "core" | "race" | "class" | "archetype" | "archive";
export type TreeNodeKind = "core" | "hub" | "spell" | "modifier";

export type SkillTreeNode = {
  id: string;
  label: string;
  subtitle?: string;
  kind: TreeNodeKind;
  section: TreeSection;
  x: number;
  y: number;
  cost: number;
  maxRank: number;
  prerequisiteIds: string[];
  spellId?: string;
  modifierId?: string;
  description?: string;
  sourceUrl?: string;
  dataStatus?: string;
};

export type SkillTreeEdge = {
  from: string;
  to: string;
};

export type GeneratedSkillTree = {
  nodes: SkillTreeNode[];
  edges: SkillTreeEdge[];
  bounds: { width: number; height: number };
};

const CENTER = { x: 800, y: 500 };

type Direction = {
  dx: number;
  dy: number;
  section: TreeSection;
  id: string;
  label: string;
};

const DIRECTIONS: Direction[] = [
  { dx: 0, dy: -1, section: "race", id: "race-north", label: "Race" },
  { dx: 0, dy: 1, section: "race", id: "race-south", label: "Race" },
  { dx: 1, dy: 0, section: "class", id: "class-east", label: "Class" },
  { dx: -1, dy: 0, section: "class", id: "class-west", label: "Class" },
  { dx: .72, dy: -.72, section: "archetype", id: "archetype-ne", label: "Archetype" },
  { dx: -.72, dy: -.72, section: "archetype", id: "archetype-nw", label: "Archetype" },
  { dx: .72, dy: .72, section: "archetype", id: "archetype-se", label: "Archetype" },
  { dx: -.72, dy: .72, section: "archetype", id: "archetype-sw", label: "Archetype" },
];

function partition<T>(items: T[], count: number) {
  const groups = Array.from({ length: count }, () => [] as T[]);
  items.forEach((item, index) => groups[index % count].push(item));
  return groups;
}

export function generateSkillTree(
  race: string,
  characterClass: string,
  spells: Spell[],
  modifiers: Modifier[],
): GeneratedSkillTree {
  const nodes: SkillTreeNode[] = [];
  const edges: SkillTreeEdge[] = [];

  nodes.push({
    id: "core",
    label: race + " " + characterClass,
    subtitle: "Archetype core",
    kind: "core",
    section: "core",
    x: CENTER.x,
    y: CENTER.y,
    cost: 0,
    maxRank: 1,
    prerequisiteIds: [],
    description:
      "The center anchors the combined race, class and archetype board. Public sources confirm this combined-tree model; exact EA node coordinates are still being reconstructed.",
    dataStatus: "ea-official",
  });

  const raceSpells = spells.filter((spell) => spell.source === "Race");
  const classSpells = spells.filter((spell) => spell.source === "Class");
  const archetypeSpells = spells.filter((spell) => spell.source === "Spellbook");
  const archiveSpells = spells.filter(
    (spell) => !["Race", "Class", "Spellbook"].includes(spell.source),
  );

  const raceGroups = partition(raceSpells, 2);
  const classGroups = partition(classSpells, 2);
  const archetypeGroups = partition(archetypeSpells, 4);

  const contentByDirection = [
    raceGroups[0],
    raceGroups[1],
    classGroups[0],
    classGroups[1],
    archetypeGroups[0],
    archetypeGroups[1],
    archetypeGroups[2],
    archetypeGroups[3],
  ];

  DIRECTIONS.forEach((direction, directionIndex) => {
    const hubDistance = 110;
    const hubX = CENTER.x + direction.dx * hubDistance;
    const hubY = CENTER.y + direction.dy * hubDistance;
    const hubId = "hub-" + direction.id;

    nodes.push({
      id: hubId,
      label: direction.label + " wing",
      kind: "hub",
      section: direction.section,
      x: hubX,
      y: hubY,
      cost: 0,
      maxRank: 1,
      prerequisiteIds: ["core"],
      description:
        direction.section === "race"
          ? "Race skills occupy the north/south axis in the documented EA layout."
          : direction.section === "class"
            ? "Class skills occupy the east/west axis in the documented EA layout."
            : "The corners are reserved for race-class archetype interactions.",
      dataStatus: "developer-confirmed",
    });
    edges.push({ from: "core", to: hubId });

    const group = contentByDirection[directionIndex] ?? [];
    let previousId = hubId;

    group.forEach((spell, index) => {
      const distance = 210 + index * 112;
      const wobble = index % 2 === 0 ? -34 : 34;
      const perpendicular = { x: -direction.dy, y: direction.dx };
      const x = CENTER.x + direction.dx * distance + perpendicular.x * wobble;
      const y = CENTER.y + direction.dy * distance + perpendicular.y * wobble;
      const id = "spell-" + spell.id;

      nodes.push({
        id,
        label: spell.name,
        subtitle: [spell.element, spell.damageType].filter(Boolean).join(" · "),
        kind: "spell",
        section: direction.section,
        x,
        y,
        cost: 1,
        maxRank: 1,
        prerequisiteIds: [previousId],
        spellId: spell.id,
        description:
          spell.roles.join(" / ") +
          (spell.statusEffect ? " · " + spell.statusEffect : "") +
          ". Historical Demo record until current EA placement is verified.",
        sourceUrl: spell.sourceUrl,
        dataStatus: spell.dataStatus,
      });
      edges.push({ from: previousId, to: id });
      previousId = id;

      const spellMods = modifiers.filter((modifier) => modifier.spellId === spell.id);
      spellMods.forEach((modifier, modIndex) => {
        const side = modIndex % 2 === 0 ? 1 : -1;
        const tier = Math.floor(modIndex / 2) + 1;
        const mx = x + perpendicular.x * side * (58 + tier * 18) + direction.dx * 34;
        const my = y + perpendicular.y * side * (58 + tier * 18) + direction.dy * 34;
        const modNodeId = "modifier-" + modifier.id;
        nodes.push({
          id: modNodeId,
          label: modifier.name,
          subtitle: "Spell modifier",
          kind: "modifier",
          section: direction.section,
          x: mx,
          y: my,
          cost: 1,
          maxRank: 1,
          prerequisiteIds: [id],
          spellId: spell.id,
          modifierId: modifier.id,
          description: modifier.effect,
          sourceUrl: modifier.sourceUrl,
          dataStatus: modifier.dataStatus,
        });
        edges.push({ from: id, to: modNodeId });
      });
    });
  });

  const archiveGroups = partition(archiveSpells, 4);
  const archiveAnchors = [
    { x: 220, y: 150, dx: .72, dy: .45 },
    { x: 1380, y: 150, dx: -.72, dy: .45 },
    { x: 220, y: 850, dx: .72, dy: -.45 },
    { x: 1380, y: 850, dx: -.72, dy: -.45 },
  ];

  archiveGroups.forEach((group, groupIndex) => {
    const anchor = archiveAnchors[groupIndex];
    const hubId = "archive-" + groupIndex;
    nodes.push({
      id: hubId,
      label: "Unmapped archive",
      subtitle: "Placement pending",
      kind: "hub",
      section: "archive",
      x: anchor.x,
      y: anchor.y,
      cost: 0,
      maxRank: 1,
      prerequisiteIds: [],
      description:
        "These documented Demo spells do not yet have a verified Early Access race/class/archetype position.",
      dataStatus: "demo-legacy",
    });

    let previousId = hubId;
    group.forEach((spell, index) => {
      const x = anchor.x + anchor.dx * (90 + index * 92);
      const y = anchor.y + anchor.dy * (90 + index * 72);
      const id = "spell-" + spell.id;
      nodes.push({
        id,
        label: spell.name,
        subtitle: [spell.element, spell.damageType].filter(Boolean).join(" · "),
        kind: "spell",
        section: "archive",
        x,
        y,
        cost: 1,
        maxRank: 1,
        prerequisiteIds: index === 0 ? [] : [previousId],
        spellId: spell.id,
        description:
          spell.roles.join(" / ") +
          (spell.statusEffect ? " · " + spell.statusEffect : "") +
          ". Placement is not verified for the current EA tree.",
        sourceUrl: spell.sourceUrl,
        dataStatus: spell.dataStatus,
      });
      if (index > 0) edges.push({ from: previousId, to: id });
      previousId = id;
    });
  });

  return { nodes, edges, bounds: { width: 1600, height: 1000 } };
}

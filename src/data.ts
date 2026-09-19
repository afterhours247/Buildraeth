import type { BuildTemplate, BuilderOption, CharacterClass, Race } from "./types";

export const RACES: Race[] = ["Human", "Elf", "Minotaur"];
export const CLASSES: CharacterClass[] = ["Mage", "Brawler", "Shadow"];

export const SPELL_OPTIONS: BuilderOption[] = [
  {
    id: "empty",
    label: "Unassigned",
    description: "Leave this spell slot open.",
    status: "verified",
  },
  {
    id: "sample-fire",
    label: "Fire spell (sample)",
    description: "Placeholder record until the community data importer is connected.",
    status: "placeholder",
  },
  {
    id: "sample-frost",
    label: "Frost spell (sample)",
    description: "Placeholder record until the community data importer is connected.",
    status: "placeholder",
  },
  {
    id: "sample-lightning",
    label: "Lightning spell (sample)",
    description: "Placeholder record until the community data importer is connected.",
    status: "placeholder",
  },
  {
    id: "sample-utility",
    label: "Utility spell (sample)",
    description: "Placeholder record until the community data importer is connected.",
    status: "placeholder",
  },
];

export const TEMPLATES: BuildTemplate[] = [
  {
    id: "human-mage",
    title: "Human Mage Skeleton",
    race: "Human",
    characterClass: "Mage",
    spells: ["empty", "empty", "empty", "empty", "empty"],
    notes: "Starter shell for an elemental or hybrid Mage build.",
    description: "A clean starting point for testing Mage synergies.",
    tags: ["Starter", "Mage"],
  },
  {
    id: "minotaur-brawler",
    title: "Minotaur Brawler Skeleton",
    race: "Minotaur",
    characterClass: "Brawler",
    spells: ["empty", "empty", "empty", "empty", "empty"],
    notes: "Starter shell for a close-range Brawler setup.",
    description: "A blank front-line template ready for real item and spell data.",
    tags: ["Starter", "Melee"],
  },
  {
    id: "elf-shadow",
    title: "Elf Shadow Skeleton",
    race: "Elf",
    characterClass: "Shadow",
    spells: ["empty", "empty", "empty", "empty", "empty"],
    notes: "Starter shell for a Shadow archetype.",
    description: "A lightweight template for future mobility and burst combinations.",
    tags: ["Starter", "Shadow"],
  },
];

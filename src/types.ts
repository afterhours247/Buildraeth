export type Race = "Human" | "Elf" | "Minotaur";
export type CharacterClass = "Mage" | "Brawler" | "Shadow";

export type BuildState = {
  title: string;
  race: Race;
  characterClass: CharacterClass;
  spells: string[];
  notes: string;
};

export type BuildTemplate = BuildState & {
  id: string;
  description: string;
  tags: string[];
};

export type DataRecordStatus = "verified" | "placeholder" | "pending";

export type BuilderOption = {
  id: string;
  label: string;
  description: string;
  status: DataRecordStatus;
};

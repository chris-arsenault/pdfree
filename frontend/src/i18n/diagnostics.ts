export const warningKeys = {
  scripts: "warnings.scripts",
  navigation: "warnings.navigation",
} as const;
export const structureKeys = {
  bookmarks: "structure.bookmarks",
  destinations: "structure.destinations",
  accessibility: "structure.accessibility",
  links: "structure.links",
  comments: "structure.comments",
} as const;
export type SourceWarning = keyof typeof warningKeys;
export type StructuralWarning = keyof typeof structureKeys;

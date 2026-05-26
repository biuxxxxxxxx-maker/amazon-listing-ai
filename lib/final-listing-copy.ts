import type { GenerationResult } from "@/lib/workup-schema";

export function copyTitle(result: GenerationResult) {
  return result.finalListing.title.english.trim();
}

export function copyBulletPoints(result: GenerationResult) {
  return result.finalListing.bulletPoints.map((bullet) => bullet.english.trim()).join("\n");
}

export function copyDescription(result: GenerationResult) {
  return result.finalListing.description.english.trim();
}

export function copySearchTerms(result: GenerationResult) {
  return result.finalListing.searchTerms.english.trim();
}

export function copyFullListing(result: GenerationResult) {
  return [
    "Title:",
    copyTitle(result),
    "",
    "Bullet Points:",
    ...result.finalListing.bulletPoints.map(
      (bullet, index) => `${index + 1}. ${bullet.english.trim()}`,
    ),
    "",
    "Description:",
    copyDescription(result),
    "",
    "Search Terms:",
    copySearchTerms(result),
  ].join("\n");
}

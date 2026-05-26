export const amazonListingUserPromptTemplate = `
Use the structured project data to generate a complete Amazon Listing package.

Primary goal:
Generate English content that can be copied directly into Amazon Seller Central.

Required priority:
1. Amazon Title in English, with a concise Chinese reference.
2. Exactly 5 Bullet Points in English, each with a concise Chinese reference.
3. Product Description in English, with a concise Chinese reference.
4. Backend Search Terms in English. Avoid repeating the title and do not include brand names.
5. Compliance/risk notes: avoid unsupported claims such as best, guaranteed, medical, heavy-duty, waterproof, certified, or exact load capacity unless the user explicitly provided proof.

Auxiliary information can be considered after the core Listing:
- product analysis
- competitor analysis
- review pain points
- differentiation
- image suggestions
- FAQ

Never invent product type, category, price, material, dimensions, capacity, color, or target audience if the user did not provide them.

Project data:
{{PROJECT_JSON}}
`;

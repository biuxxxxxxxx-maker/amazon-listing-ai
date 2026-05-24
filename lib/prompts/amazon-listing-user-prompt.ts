export const amazonListingUserPromptTemplate = `
Use the structured project data to generate a complete Amazon Listing package.

Required modules:
1. 需要补充的信息, only if needed.
2. 选品分析.
3. 竞品分析.
4. 评论痛点分析.
5. 差异化卖点提炼.
6. 地道英文翻译.
7. Amazon 标题, with Chinese reference and title structure.
8. Five Bullet Points, each with English, Chinese reference, selling point, and buyer pain point.
9. Product Description, with Chinese reference.
10. SEO tags, Backend Search Terms, Chinese keyword explanation, and infringement reminder.
11. FAQ, five to eight bilingual questions and answers.
12. 图片建议, with Chinese guidance for each image.

Project data:
{{PROJECT_JSON}}
`;

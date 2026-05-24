export type ProductProjectInsert = {
  user_id: string;
  product_name_cn: string;
  product_name_en: string | null;
  marketplace: string;
  category: string;
  target_price: string | null;
  target_customer: string | null;
  form_data: Record<string, string | boolean | null>;
  status: "Draft";
};

const textFields = [
  "product_name_cn",
  "product_name_en",
  "marketplace",
  "category",
  "target_price",
  "target_user",
  "material",
  "dimensions",
  "color",
  "package_contents",
  "usage_scenarios",
  "core_features",
  "supplier_description",
  "notes",
  "competitor_title",
  "competitor_url",
  "competitor_selling_points",
  "review_pain_points",
  "differentiation",
  "english_style",
  "language",
] as const;

function getText(formData: FormData, key: (typeof textFields)[number]) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value.length > 0 ? value : null;
}

export function buildProjectDraftPayload(
  formData: FormData,
  userId: string,
): ProductProjectInsert {
  const productNameCn = getText(formData, "product_name_cn");
  const marketplace = getText(formData, "marketplace") || "US";
  const category = getText(formData, "category");

  if (!productNameCn) {
    throw new Error("产品中文名称不能为空");
  }

  const snapshot: Record<string, string | boolean | null> = {};

  for (const field of textFields) {
    snapshot[field] = optional(getText(formData, field));
  }

  snapshot.needs_chinese_explanation = formData.get("needs_chinese_explanation") === "on";
  snapshot.needs_image_suggestions = formData.get("needs_image_suggestions") === "on";

  return {
    user_id: userId,
    product_name_cn: productNameCn,
    product_name_en: optional(getText(formData, "product_name_en")),
    marketplace,
    category: category || "Uncategorized",
    target_price: optional(getText(formData, "target_price")),
    target_customer: optional(getText(formData, "target_user")),
    form_data: snapshot,
    status: "Draft",
  };
}

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
  "target_customer",
  "target_user",
  "material",
  "dimensions",
  "size",
  "weight",
  "capacity",
  "color",
  "package_quantity",
  "package_contents",
  "use_cases",
  "usage_scenarios",
  "core_features",
  "supplier_description",
  "prohibited_claims",
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

function firstText(formData: FormData, fields: Array<(typeof textFields)[number]>) {
  for (const field of fields) {
    const value = getText(formData, field);

    if (value) {
      return value;
    }
  }

  return "";
}

export function buildProjectDraftPayload(
  formData: FormData,
  userId: string,
): ProductProjectInsert {
  const productNameCn = getText(formData, "product_name_cn");
  const marketplace = getText(formData, "marketplace");
  const category = getText(formData, "category");

  if (!productNameCn) {
    throw new Error("产品中文名称不能为空");
  }

  if (!marketplace) {
    throw new Error("Amazon 站点不能为空");
  }

  if (!category) {
    throw new Error("产品类目不能为空");
  }

  const snapshot: Record<string, string | boolean | null> = {};

  for (const field of textFields) {
    snapshot[field] = optional(getText(formData, field));
  }

  const targetCustomer = firstText(formData, ["target_customer", "target_user"]);
  const packageQuantity = firstText(formData, ["package_quantity", "package_contents"]);
  const useCases = firstText(formData, ["use_cases", "usage_scenarios"]);

  snapshot.target_customer = optional(targetCustomer);
  snapshot.target_user = optional(targetCustomer);
  snapshot.package_quantity = optional(packageQuantity);
  snapshot.package_contents = optional(packageQuantity);
  snapshot.use_cases = optional(useCases);
  snapshot.usage_scenarios = optional(useCases);
  snapshot.needs_chinese_explanation = formData.get("needs_chinese_explanation") === "on";
  snapshot.needs_image_suggestions = formData.get("needs_image_suggestions") === "on";

  return {
    user_id: userId,
    product_name_cn: productNameCn,
    product_name_en: optional(getText(formData, "product_name_en")),
    marketplace,
    category,
    target_price: optional(getText(formData, "target_price")),
    target_customer: optional(targetCustomer),
    form_data: snapshot,
    status: "Draft",
  };
}

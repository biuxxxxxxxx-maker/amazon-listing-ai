"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  FileText,
  Image,
  Languages,
  ListChecks,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { wizardSteps } from "@/lib/mock-data";
import { buildProjectDraftPayload } from "@/lib/project-draft";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const draftDefaults = {
  product_name_cn: "",
  product_name_en: "",
  marketplace: "",
  category: "",
  target_price: "",
  target_customer: "",
  target_user: "",
  material: "",
  dimensions: "",
  size: "",
  weight: "",
  capacity: "",
  color: "",
  package_quantity: "",
  package_contents: "",
  use_cases: "",
  usage_scenarios: "",
  core_features: "",
  supplier_description: "",
  prohibited_claims: "",
  notes: "",
  competitor_title: "",
  competitor_url: "",
  competitor_selling_points: "",
  review_pain_points: "",
  differentiation: "",
  english_style: "localized",
  language: "English",
};

type DraftField = keyof typeof draftDefaults;

const stepGuides = [
  {
    title: "先定产品边界",
    score: "三项必填",
    impact: "只要产品中文名、Amazon 站点和类目完整，就可以保存 Draft 并生成基础版 Listing。",
    tips: ["资料少也可以生成基础版", "资料越真实，生成越准确", "英文名没有把握可以空着"],
  },
  {
    title: "把供应商资料变成买家语言",
    score: "可选增强",
    impact: "影响五点描述、商品描述、资料质量判断和缺失信息提醒。",
    tips: ["尺寸和材质不要编造", "没有数据就留空", "禁止夸大的点会进入合规边界"],
  },
  {
    title: "从竞品里找机会",
    score: "运营加分项",
    impact: "影响关键词模式、评论痛点、差异化机会和合规风险识别。",
    tips: ["竞品 claim 不会变成我方事实", "差评比好评更有价值", "差异化要能被图片证明"],
  },
  {
    title: "控制最终输出风格",
    score: "生成设置 90%",
    impact: "影响英文语气、中文解释粒度、图片建议是否生成。",
    tips: ["新手建议使用自然本地化", "中文解释默认开启", "图片建议适合给设计师做 brief"],
  },
];

const generationModules: Array<{
  title: string;
  desc: string;
  icon: LucideIcon;
}> = [
  {
    title: "产品分析",
    desc: "产品资料、缺失信息、保守推断和风险提醒",
    icon: Sparkles,
  },
  {
    title: "地道翻译",
    desc: "把中文资料改写成自然 Amazon 英文",
    icon: Languages,
  },
  {
    title: "标题与五点",
    desc: "英文标题、5 条 Bullet 和中文参照",
    icon: ListChecks,
  },
  {
    title: "描述与 FAQ",
    desc: "Product Description、策略摘要和运营建议",
    icon: FileText,
  },
  {
    title: "Search Terms",
    desc: "后台关键词、中文解释和侵权提醒",
    icon: Search,
  },
  {
    title: "图片建议",
    desc: "资料缺口、假设和下一步补充建议",
    icon: Image,
  },
];

export function ListingWizard() {
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState(draftDefaults);
  const [needsChineseExplanation, setNeedsChineseExplanation] = useState(true);
  const [needsImageSuggestions, setNeedsImageSuggestions] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DraftField, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const isLast = currentStep === wizardSteps.length - 1;
  const guide = stepGuides[currentStep];

  useEffect(() => {
    if (!supabaseReady) {
      return;
    }

    let isMounted = true;

    async function requireSession() {
      try {
        const supabase = getBrowserSupabase();
        const { data: sessionData } = await supabase.auth.getSession();

        if (!isMounted || sessionData.session) {
          return;
        }

        setSaveError("请先登录后再创建 Listing 项目。正在跳转到登录页...");
        window.location.href = "/login";
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSaveError(
          error instanceof Error
            ? `登录状态检查失败：${error.message}`
            : "登录状态检查失败，请先回到登录页。",
        );
      }
    }

    requireSession();

    return () => {
      isMounted = false;
    };
  }, [supabaseReady]);

  function updateField(field: DraftField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function setStepValidationError(message: string, errors: Partial<Record<DraftField, string>>) {
    setSaveError(message);
    setFieldErrors(errors);
  }

  function validateCurrentStep(step: number) {
    if (step !== 0) {
      return true;
    }

    const nextErrors: Partial<Record<DraftField, string>> = {};

    if (!draft.product_name_cn.trim()) {
      nextErrors.product_name_cn = "产品中文名称不能为空。";
    }

    if (!draft.marketplace.trim()) {
      nextErrors.marketplace = "Amazon 站点不能为空。";
    }

    if (!draft.category.trim()) {
      nextErrors.category = "产品类目不能为空。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setStepValidationError("请先补全当前步骤的必填项。", nextErrors);
      return false;
    }

    setSaveError("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.product_name_cn;
      delete next.marketplace;
      delete next.category;
      return next;
    });
    return true;
  }

  function handleNextStep() {
    if (!validateCurrentStep(currentStep)) {
      return;
    }

    setCurrentStep((step) => Math.min(wizardSteps.length - 1, step + 1));
  }

  function fieldProps(field: DraftField) {
    return {
      value: draft[field],
      onChange: (
        event:
          | ChangeEvent<HTMLInputElement>
          | ChangeEvent<HTMLTextAreaElement>
          | ChangeEvent<HTMLSelectElement>,
      ) => updateField(field, event.target.value),
    };
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaveError("");
    setFieldErrors({});
    setIsSaving(true);

    try {
      const supabase = getBrowserSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        window.location.href = "/login";
        return;
      }

      const requiredErrors: Partial<Record<DraftField, string>> = {};
      const requiredFields: Array<[DraftField, string]> = [
        ["product_name_cn", "产品中文名称不能为空。"],
        ["marketplace", "Amazon 站点不能为空。"],
        ["category", "产品类目不能为空。"],
      ];

      for (const [field, message] of requiredFields) {
        if (!String(formData.get(field) || "").trim()) {
          requiredErrors[field] = message;
        }
      }

      if (Object.keys(requiredErrors).length > 0) {
        setStepValidationError("请先补全当前步骤的必填项。", requiredErrors);
        return;
      }

      const payload = buildProjectDraftPayload(formData, userId);
      const { data, error } = await supabase
        .from("product_projects")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      window.location.href = `/projects/${data.id}/result?created=1`;
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? `保存失败：${error.message}`
          : "保存失败，请检查 Supabase 表结构和登录状态。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={saveDraft}>
      {Object.entries(draft).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {needsChineseExplanation ? (
        <input type="hidden" name="needs_chinese_explanation" value="on" />
      ) : null}
      {needsImageSuggestions ? (
        <input type="hidden" name="needs_image_suggestions" value="on" />
      ) : null}
      <Stepper steps={wizardSteps} currentStep={currentStep} />
      {saveError ? (
        <div className="rounded-lg border border-orange-200 bg-amberSoft p-4 text-sm leading-6 text-[#8a5a1e]">
          {saveError}
        </div>
      ) : null}
      <Card className="p-5 shadow-soft sm:p-7">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warm">
                  Step {currentStep + 1} / {wizardSteps.length}
                </Badge>
                <Badge tone="neutral">Amazon Only</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-ink">
                {wizardSteps[currentStep].title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {wizardSteps[currentStep].description}
              </p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-ink transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {currentStep === 0 ? (
              <BasicInfoStep fieldProps={fieldProps} fieldErrors={fieldErrors} />
            ) : null}
            {currentStep === 1 ? (
              <ProductMaterialStep fieldProps={fieldProps} fieldErrors={fieldErrors} />
            ) : null}
            {currentStep === 2 ? (
              <CompetitorStep fieldProps={fieldProps} fieldErrors={fieldErrors} />
            ) : null}
            {currentStep === 3 ? (
              <GenerationSettingsStep
                fieldProps={fieldProps}
                fieldErrors={fieldErrors}
                needsChineseExplanation={needsChineseExplanation}
                needsImageSuggestions={needsImageSuggestions}
                setNeedsChineseExplanation={setNeedsChineseExplanation}
                setNeedsImageSuggestions={setNeedsImageSuggestions}
              />
            ) : null}
          </div>

          <aside className="rounded-lg border border-line bg-paper p-4 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-ink">
                <CircleHelp className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{guide.title}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{guide.impact}</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-neutral-400">当前资料完整度</p>
                <p className="text-xs font-semibold text-ink">{guide.score}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-3/4 rounded-full bg-gold" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {guide.tips.map((tip) => (
                <div key={tip} className="flex gap-2 text-sm leading-6 text-neutral-600">
                  <Check className="mt-1 size-4 shrink-0 text-gold" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="sticky bottom-3 z-10 -mx-1 mt-8 flex flex-col-reverse gap-3 rounded-2xl border border-line bg-white/90 p-2 shadow-soft backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
          <Button
            type="button"
            variant="secondary"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            上一步
          </Button>
          {isLast ? (
            <Button
              key="listing-draft-submit"
              data-testid="listing-draft-submit"
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? "保存中..." : "保存 Draft"}
              <Check className="size-4" />
            </Button>
          ) : (
            <Button
              key="listing-next-step"
              data-testid="listing-next-step"
              type="button"
              className="w-full sm:w-auto"
              onClick={handleNextStep}
            >
              下一步
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}

function Field({
  label,
  hint,
  optional = false,
  error,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-ink">
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-neutral-400">可选</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-neutral-500">{hint}</span> : null}
      {error ? <span className="mt-2 block text-xs leading-5 text-red-600">{error}</span> : null}
    </label>
  );
}

type StepProps = {
  fieldProps: (field: DraftField) => {
    value: string;
    onChange: (
      event:
        | ChangeEvent<HTMLInputElement>
        | ChangeEvent<HTMLTextAreaElement>
        | ChangeEvent<HTMLSelectElement>,
    ) => void;
  };
  fieldErrors?: Partial<Record<DraftField, string>>;
};

function BasicInfoStep({ fieldProps, fieldErrors = {} }: StepProps) {
  return (
    <div className="space-y-7">
      <SectionHeader
        icon={<Sparkles className="size-4" />}
        title="基础必填"
        description="只需要产品中文名、Amazon 站点和产品类目，就可以先保存 Draft。资料少也可以生成基础版 Listing，Work UP 会标注缺失信息和保守推断。"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="产品中文名称" hint="必填。建议写到具体形态，例如“行李箱”。" error={fieldErrors.product_name_cn}>
          <Input {...fieldProps("product_name_cn")} />
        </Field>
        <Field label="产品英文名称" hint="不确定可以先空着，后续 AI 会生成更自然的英文名。" optional>
          <Input placeholder="可选：留空让 AI 生成" {...fieldProps("product_name_en")} />
        </Field>
        <Field label="Amazon 站点" hint="必填。第一阶段只做 Amazon，不做其他平台。" error={fieldErrors.marketplace}>
          <Select {...fieldProps("marketplace")}>
            <option value="">请选择 Amazon 站点</option>
            <option value="US">US</option>
            <option value="UK">UK</option>
            <option value="CA">CA</option>
            <option value="AU">AU</option>
          </Select>
        </Field>
        <Field label="产品类目" hint="必填。可以先写 Amazon 大类目，例如 Travel & Luggage。" error={fieldErrors.category}>
          <Input {...fieldProps("category")} />
        </Field>
        <Field label="目标售价" hint="用于判断文案语气，暂不做利润计算。" optional>
          <Input {...fieldProps("target_price")} />
        </Field>
        <Field label="目标用户" hint="写真实买家，例如学生、差旅人群、车主、妈妈群体。" optional>
          <Input {...fieldProps("target_customer")} />
        </Field>
      </div>
    </div>
  );
}

function ProductMaterialStep({ fieldProps }: StepProps) {
  return (
    <div className="space-y-7">
      <SectionHeader
        icon={<ShieldCheck className="size-4" />}
        title="基础可选资料"
        description="资料越真实，生成越准确。这里的信息会进入 Product Brief；没有数据就留空，不要为了好看编参数。"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="颜色" optional>
          <Input {...fieldProps("color")} />
        </Field>
        <Field label="材质" optional>
          <Input {...fieldProps("material")} />
        </Field>
        <Field label="尺寸" hint="如果没有精确尺寸，可以留空，结果页会提醒补资料。" optional>
          <Input placeholder="例如 20 inch / 55 x 35 x 22 cm" {...fieldProps("dimensions")} />
        </Field>
        <Field label="尺码 / 规格" hint="适合行李箱等有 20 inch、24 inch 规格的产品。" optional>
          <Input {...fieldProps("size")} />
        </Field>
        <Field label="重量" optional>
          <Input placeholder="例如 6.2 lb" {...fieldProps("weight")} />
        </Field>
        <Field label="容量" optional>
          <Input placeholder="例如 38 L" {...fieldProps("capacity")} />
        </Field>
        <Field label="包装数量" optional>
          <Input placeholder="例如 1 pack / 2 pack" {...fieldProps("package_quantity")} />
        </Field>
        <Field label="使用场景" optional>
          <Textarea {...fieldProps("use_cases")} />
        </Field>
        <Field label="核心卖点" optional>
          <Textarea {...fieldProps("core_features")} />
        </Field>
        <div className="md:col-span-2">
          <Field label="供应商中文描述" optional>
            <Textarea {...fieldProps("supplier_description")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="禁止夸大的点" hint="例如：不要写 waterproof、airline approved、lifetime warranty。" optional>
            <Textarea {...fieldProps("prohibited_claims")} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function CompetitorStep({ fieldProps }: StepProps) {
  return (
    <div className="space-y-7">
      <SectionHeader
        icon={<CircleHelp className="size-4" />}
        title="进阶运营资料 / 竞品资料"
        description="如果你提供竞品标题、五点和评论痛点，Work UP 会分析关键词、卖点机会和合规风险。竞品资料只作为洞察来源，不会被写成我方 confirmed fact。"
      />
      <div className="grid gap-5">
        <Field label="竞品标题" hint="可以粘贴 1-3 个竞品标题，系统会拆解常见关键词和表达方式。" optional>
          <Textarea {...fieldProps("competitor_title")} />
        </Field>
        <Field label="竞品链接" optional>
          <Input placeholder="https://www.amazon.com/..." {...fieldProps("competitor_url")} />
        </Field>
        <Field label="竞品五点" hint="例如竞品 Bullet Points、A+ 页面文案、你观察到的主图卖点。" optional>
          <Textarea placeholder="粘贴竞品五点或你观察到的卖点。" {...fieldProps("competitor_selling_points")} />
        </Field>
        <Field label="评论痛点" hint="差评能帮助系统写出更贴近买家痛点的 Bullet。" optional>
          <Textarea {...fieldProps("review_pain_points")} />
        </Field>
        <Field label="我方差异化" hint="请写能被产品、图片或参数证明的差异点。" optional>
          <Textarea {...fieldProps("differentiation")} />
        </Field>
      </div>
    </div>
  );
}

type GenerationSettingsStepProps = StepProps & {
  needsChineseExplanation: boolean;
  needsImageSuggestions: boolean;
  setNeedsChineseExplanation: (value: boolean) => void;
  setNeedsImageSuggestions: (value: boolean) => void;
};

function GenerationSettingsStep({
  fieldProps,
  needsChineseExplanation,
  needsImageSuggestions,
  setNeedsChineseExplanation,
  setNeedsImageSuggestions,
}: GenerationSettingsStepProps) {
  return (
    <div className="space-y-7">
      <SectionHeader
        icon={<Sparkles className="size-4" />}
        title="输出偏好"
        description="这些设置会随原始 Draft 一起保存。低信息输入不会被阻止，Work UP 会用保守策略生成并提示你补资料。"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="英文风格" hint="新手默认推荐自然本地化，英文更像真实 Amazon 卖家写法。">
          <Select {...fieldProps("english_style")}>
            <option value="professional">专业可信</option>
            <option value="direct">简洁直接</option>
            <option value="conversion">高转化营销</option>
            <option value="localized">自然本地化</option>
          </Select>
        </Field>
        <Field label="生成语言">
          <Input {...fieldProps("language")} disabled />
        </Field>
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={needsChineseExplanation}
              onChange={(event) => setNeedsChineseExplanation(event.target.checked)}
              className="mt-1 size-4 accent-black"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">需要中文解释</p>
                <Badge tone="warm">推荐开启</Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                每段英文下方都会有中文参照，方便不懂英文的新手理解。
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={needsImageSuggestions}
              onChange={(event) => setNeedsImageSuggestions(event.target.checked)}
              className="mt-1 size-4 accent-black"
            />
            <div>
              <p className="text-sm font-semibold text-ink">生成图片建议</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                输出主图、场景图、尺寸图、细节图和包装图建议。
              </p>
            </div>
          </div>
        </div>
      </div>
      <GeneratePreview />
    </div>
  );
}

function GeneratePreview() {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-hairline sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">生成前确认</p>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            保存 Draft 后会进入结果页，点击重新生成才会调用 DeepSeek 输出下列 Amazon Listing 模块。
          </p>
        </div>
        <Badge tone="green">Ready</Badge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {generationModules.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex gap-3 rounded-lg bg-paper p-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-ink">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-neutral-600">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg bg-amberSoft p-3 text-sm leading-6 text-[#8a5a1e]">
        小白提示：保存 Draft 不会调用 AI；只有进入结果页并点击重新生成，才会发起正式生成。
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-neutral-50 p-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-ink">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
      </div>
    </div>
  );
}

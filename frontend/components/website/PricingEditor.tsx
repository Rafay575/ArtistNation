// components/admin/website/PricingEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { RepeatingFieldArray } from "@/components/RepeatingFieldArray";
import {
  TextField,
  TextAreaField,
  CheckboxField,
} from "@/components/TextFields";
import type { PricingConfig, PricingPlan } from "@/types/website";

function makeNewPlan(): PricingPlan {
  return {
    name: "",
    description: "",
    price: "",
    period: "/month",
    cta: "",
    popular: false,
    popularLabel: "",
    features: [],
  };
}

function PricingPlanFields({
  plan,
  onChange,
}: {
  plan: PricingPlan;
  onChange: (next: PricingPlan) => void;
}) {
  return (
    <>
      <TextField label="Plan name" value={plan.name} onChange={(v) => onChange({ ...plan, name: v })} />
      <TextAreaField
        label="Description"
        rows={2}
        value={plan.description}
        onChange={(v) => onChange({ ...plan, description: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Price" value={plan.price} onChange={(v) => onChange({ ...plan, price: v })} />
        <TextField
          label="Period (e.g. /month)"
          value={plan.period}
          onChange={(v) => onChange({ ...plan, period: v })}
        />
      </div>
      <TextField label="Button text (CTA)" value={plan.cta} onChange={(v) => onChange({ ...plan, cta: v })} />
      <CheckboxField
        label="Mark as popular / highlighted"
        checked={plan.popular}
        onChange={(v) => onChange({ ...plan, popular: v })}
      />
      {plan.popular && (
        <TextField
          label="Popular badge label"
          value={plan.popularLabel}
          onChange={(v) => onChange({ ...plan, popularLabel: v })}
        />
      )}

      <RepeatingFieldArray<string>
        label="Included features"
        items={plan.features}
        onChange={(features) => onChange({ ...plan, features })}
        itemLabel={(i) => `Line ${i + 1}`}
        makeNewItem={() => ""}
        renderItem={(feature, _i, updateItem) => (
          <TextField label="Feature text" value={feature} onChange={updateItem} />
        )}
      />
    </>
  );
}

export function PricingEditor({ initialValue }: { initialValue: PricingConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "pricing",
    initialValue
  );

  return (
    <SectionEditorShell
      title="Pricing"
      dirty={dirty}
      isSaving={isSaving}
      isSuccess={isSuccess}
      error={error}
      onSave={save}
    >
      <TextField label="Heading" value={value.heading} onChange={(v) => update({ ...value, heading: v })} />
      <TextAreaField
        label="Subtext"
        rows={2}
        value={value.subtext}
        onChange={(v) => update({ ...value, subtext: v })}
      />

      <RepeatingFieldArray<PricingPlan>
        label="Artist plans"
        items={value.artistPlans}
        onChange={(items) => update({ ...value, artistPlans: items })}
        itemLabel={(i) => `Plan ${i + 1}`}
        makeNewItem={makeNewPlan}
        renderItem={(plan, _i, updateItem) => (
          <PricingPlanFields plan={plan} onChange={updateItem} />
        )}
      />

      <RepeatingFieldArray<PricingPlan>
        label="Label plans"
        items={value.labelPlans}
        onChange={(items) => update({ ...value, labelPlans: items })}
        itemLabel={(i) => `Plan ${i + 1}`}
        makeNewItem={makeNewPlan}
        renderItem={(plan, _i, updateItem) => (
          <PricingPlanFields plan={plan} onChange={updateItem} />
        )}
      />
    </SectionEditorShell>
  );
}
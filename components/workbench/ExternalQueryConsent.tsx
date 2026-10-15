"use client";

import { Checkbox } from "antd";
import { useTranslations } from "next-intl";

export function ExternalQueryConsent({
  provider,
  checked,
  onChange,
}: {
  provider: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTranslations("Workbench.toolHeader");
  return (
    <Checkbox
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    >
      {t("externalConsent", { provider })}
    </Checkbox>
  );
}

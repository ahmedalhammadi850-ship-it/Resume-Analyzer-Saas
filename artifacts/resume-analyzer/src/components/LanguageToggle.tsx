import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { SupportedLang } from "@/i18n";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const toggle = () => {
    const next: SupportedLang = isArabic ? "en" : "ar";
    i18n.changeLanguage(next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="font-semibold text-sm px-3"
      data-testid="button-language-toggle"
    >
      {isArabic ? "EN" : "عربي"}
    </Button>
  );
}

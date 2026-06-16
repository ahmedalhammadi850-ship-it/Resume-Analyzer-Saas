import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Upload, ImageIcon, X, CheckCircle2, Building2, User, Hash, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { N8N_WEBHOOK_UPGRADE } from "@/types";


const BANK_INFO = {
  bank: "بنك التضامن — Tadhamon Bank",
  beneficiary: "أحمد عبدالله عقلان الحمادي",
  accountNumber: "00154578",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ description: "تم النسخ!" });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="نسخ">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function Upgrade() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRenewal = userProfile?.plan !== "free" && userProfile?.plan != null;

  const steps = [
    { num: "١", text: t("upgrade.step1") },
    { num: "٢", text: t("upgrade.step2") },
    { num: "٣", text: t("upgrade.step3") },
  ];

  const bankFields = [
    { icon: Building2, label: t("upgrade.bankLabel"), value: BANK_INFO.bank },
    { icon: User, label: t("upgrade.beneficiaryLabel"), value: BANK_INFO.beneficiary },
    { icon: Hash, label: t("upgrade.accountLabel"), value: BANK_INFO.accountNumber },
  ];

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    if (f.size > 10 * 1024 * 1024) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleRemove() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!file || !userProfile) return;
    setLoading(true);

    let n8nSent = false;
    try {
      const form = new FormData();
      form.append("receipt_image", file);
      form.append("user_id", userProfile.id);
      form.append("user_email", userProfile.email ?? "");
      form.append("user_name", userProfile.name ?? "");
      await api.n8nProxyForm(N8N_WEBHOOK_UPGRADE, form);
      n8nSent = true;
    } catch {
      // n8n unreachable — still save request
    }

    try {
      await api.users.createUpgradeRequest(n8nSent);
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: t("upgrade.submitError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-20 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("upgrade.successTitle")}</h2>
            <p className="text-muted-foreground">{t("upgrade.successDesc")}</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-1.5">{t("upgrade.reviewBadge")}</Badge>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {isRenewal ? t("upgrade.renewTitle") : t("upgrade.title")}
          </h1>
          <p className="text-muted-foreground">
            {isRenewal ? t("upgrade.renewSubtitle") : t("upgrade.subtitle")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-5">{t("upgrade.stepsTitle")}</h2>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{s.num}</div>
                  <div className="flex-1 pt-1.5 text-sm">{s.text}</div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">{t("upgrade.bankDetailsTitle")}</h2>
            <div className="space-y-3">
              {bankFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="font-semibold text-sm truncate">{value}</p>
                  </div>
                  <CopyButton text={value} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">{t("upgrade.uploadTitle")}</h2>
            {!file ? (
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{t("upgrade.dragHere")}</p>
                    <p className="text-xs text-muted-foreground">{t("upgrade.orClick")}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">PNG, JPG, WEBP ({t("upgrade.maxSize")})</Badge>
                </div>
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border bg-muted/30">
                <img src={preview!} alt="receipt preview" className="w-full max-h-72 object-contain" />
                <button onClick={handleRemove} className="absolute top-2 end-2 h-8 w-8 rounded-full bg-background/90 border flex items-center justify-center hover:bg-destructive hover:text-white hover:border-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
                <div className="p-3 text-sm text-muted-foreground flex items-center gap-2 border-t">
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="ms-auto flex-shrink-0 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            )}
            <Button className="w-full h-11 text-base font-semibold" disabled={!file || loading} onClick={handleSubmit}>
              {loading
                ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t("upgrade.submitting")}</>
                : <><Upload className="h-4 w-4 me-2" />{isRenewal ? t("upgrade.renewBtn") : t("upgrade.submitBtn")}</>
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

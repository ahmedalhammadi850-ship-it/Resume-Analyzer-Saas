import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Analysis } from "@/types";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fmtDate } from "@/lib/date-utils";
import { FileText, Search, Filter, Calendar, Target, ChevronRight } from "lucide-react";

export default function History() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      if (userProfile?.id) {
        try {
          const allAnalyses = await api.analyses.list();
          setAnalyses(allAnalyses);
        } catch (error) {
          console.error("Failed to load analyses", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [userProfile?.id]);

  const filteredAnalyses = analyses.filter((a) =>
    a.fileName.toLowerCase().includes(search.toLowerCase()) ||
    (a.results.job_title && String(a.results.job_title).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("history.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("history.subtitle")}</p>
          </div>
          <Button onClick={() => setLocation("/analyze")}>{t("history.newAnalysis")}</Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("history.search")}
                  className="ps-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto shrink-0 gap-2">
                <Filter className="h-4 w-4" /> {t("history.filter")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredAnalyses.length > 0 ? (
              <div className="divide-y border rounded-md">
                {filteredAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/analysis/${analysis.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg truncate">{analysis.fileName}</h4>
                        <Badge variant={analysis.analysisType === "jd_match" ? "default" : "secondary"}>
                          {analysis.analysisType === "jd_match" ? t("common.jdMatch") : t("common.general")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {fmtDate(analysis.createdAt, (d) => format(d, "MMM d, yyyy"))}
                        </div>
                        {analysis.analysisType === "jd_match" && analysis.results.job_title != null && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {String(analysis.results.job_title)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:ms-auto">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">{t("history.score")}</div>
                        <div className={`text-xl font-bold ${analysis.score >= 80 ? "text-green-500" : analysis.score >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                          {analysis.score}%
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{search ? t("history.noResultsSearch") : t("history.noResultsDesc")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

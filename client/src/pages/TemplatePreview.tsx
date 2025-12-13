import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Removed tabs; we render preview directly
import { Label } from "@/components/ui/label";

export default function TemplatePreview() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/templates/" + params.id],
    queryFn: () => api.get(`/api/templates/${params.id}`),
    staleTime: 60_000,
  });

  // api.get unwraps to the .data payload already
  const template = data as any;

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => setLocation("/survey/create")}>Back</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading template...</div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">Failed to load template</div>
      ) : !template ? (
        <div className="text-center py-10">Template not found</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-sm text-muted-foreground">
              <div>Type: {template.type}</div>
              <div>Estimated Time: {template.estimatedTime || 10} minutes</div>
              <div>Questions: {template.questions?.length || 0}</div>
            </div>

            <div className="space-y-8 pt-6">
                {(template.questions || []).map((q: any, idx: number) => (
                  <div key={q.id || idx} className="space-y-3">
                    <h3 className="text-base font-medium">
                      {idx + 1}. {q.question} {q.required ? <span className="text-destructive">*</span> : null}
                    </h3>
                    {q.helpText ? <p className="text-sm text-muted-foreground">{q.helpText}</p> : null}

                    {/* Text */}
                    {q.questionType === "text" && (
                      <div className="p-3 border rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Text input field</span>
                      </div>
                    )}

                    {/* Multiple choice */}
                    {q.questionType === "multiple-choice" && (
                      <div className="space-y-2">
                        {(q.options || []).map((opt: any) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input type="radio" disabled className="h-4 w-4" />
                            <Label className="text-sm">{opt.text}</Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Slider */}
                    {q.questionType === "slider" && (
                      <div className="space-y-2">
                        <div className="p-3 border rounded bg-muted/30">
                          <div className="h-2 bg-gray-200 rounded" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{q.sliderConfig?.minLabel ?? "0"}</span>
                          <span>{q.sliderConfig?.maxLabel ?? "100"}</span>
                        </div>
                      </div>
                    )}

                    {/* Ranking */}
                    {q.questionType === "ranking" && (
                      <div className="space-y-2 text-sm">
                        {(q.options || []).map((opt: any, i: number) => (
                          <div key={opt.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{i + 1}</div>
                              <span>{opt.text}</span>
                            </div>
                            <span className="text-muted-foreground">Rank {i + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scenario */}
                    {q.questionType === "scenario" && (
                      <div className="space-y-3">
                        {q.scenarioText && (
                          <div className="p-3 border rounded bg-muted/30 text-sm">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Scenario</div>
                            <div>{q.scenarioText}</div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {(q.options || []).map((opt: any) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input type="radio" disabled className="h-4 w-4" />
                              <Label className="text-sm">{opt.text}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mood board (image grid) */}
                    {(q.questionType === "mood-board" || q.questionType === "image") && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(q.options || []).map((opt: any) => (
                          <div key={opt.id} className="flex flex-col border rounded-md overflow-hidden">
                            {opt.image && (
                              <div className="h-24 bg-muted">
                                <img
                                  src={opt.image}
                                  alt={opt.text}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/200x200?text=Image";
                                  }}
                                />
                              </div>
                            )}
                            <div className="p-2">
                              <p className="text-sm">{opt.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Personality matrix (chips grid) */}
                    {q.questionType === "personality-matrix" && (
                      <div className="flex flex-wrap gap-2">
                        {(q.options || []).map((opt: any) => (
                          <span key={opt.id} className="px-3 py-1 rounded-full text-xs bg-pink-50 text-pink-700 border border-pink-200">{opt.text}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



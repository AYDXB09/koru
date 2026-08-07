"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import type { FittedOpportunity } from "@/server/queries";
import { OPPORTUNITY_CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "fit" | "deadline" | "effort";

export function OpportunitiesFeed({ opportunities }: { opportunities: FittedOpportunity[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("fit");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = opportunities.filter((o) => {
      if (category !== "all" && o.category !== category) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.providerName.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
      );
    });
    list = [...list];
    if (sort === "fit") list.sort((a, b) => b.fitScore - a.fitScore);
    else if (sort === "deadline") {
      list.sort((a, b) => {
        if (a.isRolling && b.isRolling) return b.fitScore - a.fitScore;
        if (a.isRolling) return 1;
        if (b.isRolling) return -1;
        return (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
      });
    } else list.sort((a, b) => a.estimatedHours - b.estimatedHours);
    return list;
  }, [opportunities, query, category, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grants, scholarships, funds"
            className="pl-9"
            aria-label="Search opportunities"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-40" aria-label="Sort opportunities">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit">Best fit first</SelectItem>
              <SelectItem value="deadline">Closest deadline</SelectItem>
              <SelectItem value="effort">Least effort</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {open && (
        <div className="flex flex-wrap gap-2 border bg-card p-3">
          <CategoryChip label="All" active={category === "all"} onClick={() => setCategory("all")} />
          {OPPORTUNITY_CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={CATEGORY_LABELS[c]}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
          {category !== "all" ? ` in ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}` : ""}
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Sorted by{" "}
          <span className="text-foreground">
            {sort === "fit" ? "best fit" : sort === "deadline" ? "closest deadline" : "least effort"}
          </span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="border px-5 py-16 text-center">
          <p className="text-sm text-muted-foreground">No opportunities match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o, i) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              fitScore={o.fitScore}
              likelihood={o.likelihood}
              index={String(i + 1).padStart(2, "0")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

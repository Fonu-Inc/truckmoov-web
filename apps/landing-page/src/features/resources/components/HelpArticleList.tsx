"use client";

import type { HelpArticle } from "@/features/resources/utils/resourceTypes";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { FileText } from "lucide-react";
import { Accordion } from "radix-ui";
import { IconChip } from "@/shared/components/IconChip";

type HelpArticleListProps = { articles: HelpArticle[] };

/** Bordered card of expandable help articles (Figma "Accordions 2"). */
export function HelpArticleList({ articles }: HelpArticleListProps) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      className="overflow-hidden rounded-[30px] border border-border-soft pt-[7px] pb-1.5"
    >
      {articles.map(article => (
        <Accordion.Item
          key={article.title}
          value={article.title}
          className="group border-b border-border last:border-b-0"
        >
          <Accordion.Header>
            <Accordion.Trigger className="flex min-h-[94.5px] w-full cursor-pointer items-center gap-5 py-4 pr-[29px] pl-[29px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:gap-[35px]">
              <IconChip icon={FileText} />
              <span className="relative -top-[3px] min-w-0 flex-1">
                <span className="block text-base leading-5 font-medium text-heading">
                  {article.title}
                </span>
                <span className="mt-[3px] block text-xs leading-[15px] whitespace-pre-wrap text-subtle-foreground">
                  {`Topic: ${article.topic}  •  ${article.readTime} • Updated ${article.updated}`}
                </span>
              </span>
              <CaretDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="pr-[29px] pb-6 pl-[29px] text-sm leading-[21px] text-muted-foreground md:pl-[109px]">
              {article.summary}
            </p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

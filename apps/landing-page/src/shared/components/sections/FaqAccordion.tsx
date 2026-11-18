"use client";

import {
  Minus,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { Accordion } from "radix-ui";
import { cn } from "@/shared/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
  /** Question opened on first render (defaults to the first one). */
  defaultOpen?: number | null;
  className?: string;
  /** Extra classes for each answer paragraph (e.g. a fixed min height). */
  answerClassName?: string;
};

/** Rounded accordion list (Figma "Accordions" component). */
export function FaqAccordion({
  items,
  defaultOpen = 0,
  className,
  answerClassName,
}: FaqAccordionProps) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={defaultOpen === null ? undefined : `item-${defaultOpen}`}
      className={cn(
        "flex flex-col gap-2.5",
        className,
      )}
    >
      {items.map((item, index) => (
        <Accordion.Item
          key={item.question}
          value={`item-${index}`}
          className="group rounded-[30px] border border-border bg-background data-[state=open]:rounded-[35px]"
        >
          <Accordion.Header>
            <Accordion.Trigger className="flex min-h-[78px] w-full cursor-pointer items-center justify-between gap-6 py-[29px] pr-[30px] pl-10 text-left text-sm leading-[17px] font-medium text-heading capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {item.question.trim()}
              <Plus
                aria-hidden="true"
                className="size-5 shrink-0 group-data-[state=open]:hidden"
              />
              <Minus
                aria-hidden="true"
                className="hidden size-5 shrink-0 group-data-[state=open]:block"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="mx-[25px] border-t border-border" />
            <p className={cn(
              "px-8 pt-5 pb-[30px] text-sm leading-[17px] text-muted-foreground",
              answerClassName,
            )}
            >
              {item.answer}
            </p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

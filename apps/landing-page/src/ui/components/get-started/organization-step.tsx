import type { UseFormReturn } from "react-hook-form";
import type {
  FieldKey,
  OrganizationFormValues,
} from "./get-started-data";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/shadcn/form";
import { Input } from "@/ui/shadcn/input";
import { ApplicantTypeCard } from "./applicant-type-card";
import {
  NIGERIAN_STATES,
  ORG_FIELDS,
  ORG_SECTIONS,
  ORG_TYPES,
} from "./get-started-data";
import { StepHeading } from "./step-parts";

const FIELD_CLASS = "h-12 rounded-[15px] border-border-field bg-background px-3 text-sm text-heading shadow-none placeholder:text-faint-foreground";
const LABEL_CLASS = "text-sm font-medium text-heading";

export function OrganizationStep({ form }: { form: UseFormReturn<OrganizationFormValues> }) {
  const applicantType = form.watch("applicantType");
  const applicantError = form.formState.errors.applicantType?.message;

  return (
    <div className="pt-[38px]">
      <StepHeading
        title="What best describes you?"
        description="This Helps Us Set Up The Right Application For You."
        descriptionClassName="text-muted-foreground"
      />
      <div className="mt-[30px] grid gap-[9px] sm:grid-cols-2">
        {ORG_TYPES.map(type => (
          <ApplicantTypeCard
            key={type.id}
            title={type.title}
            description={type.description}
            illustration={type.illustration}
            illustrationClassName={type.illustrationClassName}
            selected={applicantType === type.id}
            onSelect={() => form.setValue(
              "applicantType",
              type.id,
              {
                shouldValidate: true,
                shouldDirty: true,
              },
            )}
          />
        ))}
      </div>
      {applicantError && (
        <p className="mt-2 text-sm text-destructive">{applicantError}</p>
      )}
      <Form {...form}>
        <form
          className="mt-[34px] max-w-[535px] space-y-[34px]"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          {ORG_SECTIONS.map(section => (
            <section key={section.id}>
              <h3 className="mb-6 text-base leading-5 font-semibold text-heading">{section.title}</h3>
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-[19px]">
                {ORG_FIELDS.filter(field => field.section === section.id).map(field => (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={field.key as FieldKey}
                    render={({ field: rhfField }) => (
                      <FormItem className={cn(
                        "gap-1.5",
                        field.half ? "col-span-2 sm:col-span-1" : "col-span-2",
                      )}
                      >
                        <FormLabel className={LABEL_CLASS}>{field.label}</FormLabel>
                        <FormControl>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            className={FIELD_CLASS}
                            {...rhfField}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
                {section.id === "address" && (
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field: rhfField }) => (
                      <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                        <FormLabel className={LABEL_CLASS}>State</FormLabel>
                        <FormControl>
                          <select
                            {...rhfField}
                            value={rhfField.value ?? ""}
                            className={cn(
                              "w-full border outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50 aria-invalid:border-destructive",
                              FIELD_CLASS,
                              !rhfField.value && "text-faint-foreground",
                            )}
                          >
                            <option
                              value=""
                              disabled
                            >
                              Select a state
                            </option>
                            {NIGERIAN_STATES.map(state => (
                              <option
                                key={state}
                                value={state}
                                className="text-heading"
                              >
                                {state}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </section>
          ))}
        </form>
      </Form>
    </div>
  );
}

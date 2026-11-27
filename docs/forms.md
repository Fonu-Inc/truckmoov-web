# Form Handling

Forms use:

- `react-hook-form` for state and submission.
- `zod` for validation schemas.
- shadcn Form primitives for layout and errors.
- Project `Button` loading states for async submission.

## Core Pattern

Every form should:

1. Define a Zod schema.
2. Infer the TypeScript type from the schema.
3. Set `defaultValues`.
4. Export the form id as a named constant.
5. Use `FormField` for fields.
6. Show errors with `FormMessage`.
7. Submit through a React Query mutation when calling the API.

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/shadcn/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form"
import { Input } from "@/components/shadcn/input"

const formSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type FormValues = z.infer<typeof formSchema>

export const SIGN_IN_FORM_ID = "sign-in-form"

export function SignInForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(data: FormValues) {
    // call API mutation here
  }

  return (
    <Form {...form}>
      <form
        id={SIGN_IN_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" form={SIGN_IN_FORM_ID}>
          Sign in
        </Button>
      </form>
    </Form>
  )
}
```

`FormControl` uses Radix `Slot` to clone its child and automatically wire up `id`, `aria-describedby`, and `aria-invalid` — do not set these manually on the input.

## Required Fields

Every field the form will not submit empty gets a red asterisk through the
`required` prop on `FormLabel` / `Label`:

```tsx
<FormLabel required>Email</FormLabel>
<Label htmlFor="licence" required={!initial}>Driver's licence</Label>
```

- The mark must match the validation: a non-optional zod field, an input with
  `required`, or a submit/`disabled` check that rejects an empty value. Optional
  fields, filters, search boxes and always-valued switches get no mark.
- When it depends on state (create vs edit, a conditional field), pass the same
  expression the validation uses.
- Never hand-roll the asterisk (`Name *`, `<span className="text-destructive">*</span>`).
  The span is `aria-hidden`; keep the input's own `required` / `aria-required`
  for screen readers.
- Primitives: `packages/reusables/src/components/shadcn/label.tsx` (main, admin,
  installer) and `apps/landing-page/src/shared/components/shadcn/label.tsx`.

## Field Patterns

### Text Input

```tsx
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormDescription>This is your public display name.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```tsx
import { Textarea } from "@/components/shadcn/textarea"

<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <Textarea rows={4} className="resize-none" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select"

<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="member">Member</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

Note: `FormControl` wraps `SelectTrigger`, not the entire `Select`, because `Select` is not a DOM element.

### Radio Group

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group"

<FormField
  control={form.control}
  name="plan"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Plan</FormLabel>
      <FormControl>
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
        >
          {["basic", "pro"].map(plan => (
            <FormItem key={plan} className="flex items-center gap-2">
              <FormControl>
                <RadioGroupItem value={plan} />
              </FormControl>
              <FormLabel className="capitalize">{plan}</FormLabel>
            </FormItem>
          ))}
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Address (Nigeria lookup)

A free-text address that must be real is not an `<Input>`. Use `AddressField`
(`apps/main/src/features/apply/components/ui/AddressField.tsx`) inside a `<Form>` that has
`streetAddress`, `addressVerification`, `state` and `city`. It wraps `MapLocationInput` with
`embedded` (renders a div, Enter searches instead of submitting the outer form) and `nigeriaOnly`
(Photon with a Nigeria bbox, filtered to `NG`, no browser-location prompt).

- The text only counts as verified while it equals the address that was picked (or confirmed by hand
  while the lookup was down): `isAddressVerified` in `features/apply/utils/addressVerification.ts`. Add
  `refineAddressVerified` from `applySchemas.ts` to the schema; the message is "Select your address from the suggestions".
- A pick prefills State / City only when they are empty, and warns (never blocks) when they disagree.
- The landing page wizard has its own copy (`apps/landing-page/src/features/get-started`: `AddressField`, `AddressLookupInput`, `utils/addressVerification.ts`); keep the pure logic in step.
- `addressVerification` (with coordinates) lives in the form and its drafts only. It is not sent: the
  onboarding DTOs are `forbidNonWhitelisted`.

## API Mutations

Use mutation hooks from the feature API layer.

```tsx
const mutation = useCreateResource()

function onSubmit(data: FormValues) {
  mutation.mutate(data, {
    onSuccess: () => {
      toast.success("Saved")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

<Button
  type="submit"
  form={PROFILE_FORM_ID}
  loading={mutation.isPending}
>
  Save
</Button>
```

See [api.md](api.md) for mutation conventions.

## Form IDs

Export the form id from the form file and reuse the constant anywhere a submit button references the form.

```tsx
export const CATALOG_CARD_FORM_ID = "catalog-card-form"

export default function CatalogCardForm() {
  return (
    <form id={CATALOG_CARD_FORM_ID}>
      {/* fields */}
    </form>
  )
}
```

```tsx
import CatalogCardForm, {
  CATALOG_CARD_FORM_ID,
} from "../forms/catalog-card-form"

<CatalogCardForm />
<Button
  type="submit"
  form={CATALOG_CARD_FORM_ID}
>
  Continue
</Button>
```

## Rules

| Rule | Why |
|------|-----|
| Wrap with `<Form {...form}>` | Provides form context to all FormField children |
| Define `defaultValues` | Prevents uncontrolled-to-controlled warnings |
| Use `FormField` | Wraps Controller with context so FormMessage can read the error |
| Wrap input with `FormControl` | Auto-wires `id`, `aria-describedby`, and `aria-invalid` via Slot |
| Export form ids | Prevents duplicated string ids across files |

## Addresses

Every address is a Nigerian address, and the server enforces it too.

- Every address that carries coordinates is a `MapLocationInput` with `nigeriaOnly` (a lookup limited to Nigeria), embedded (`embedded`) when it sits inside another form. Never a free-text address `Input` for those.
- Street lines inside KYC forms (`TenantKYCVerification` address line 1/2, `OnboardingKYCStep` address line 1) store no coordinates, so they stay plain `Input`s beside the Nigerian state and LGA selects. The server validates them (3 to 200 characters with a letter) and canonicalises the state.
- The picked `lat`/`lng` are checked against the Nigeria box with `isInsideNigeria` from `@truckmoov/app-core/geo/nigeria` (lat 4.2 to 13.9, lng 2.6 to 14.7, the same box as the backend). `(0, 0)` and other countries fail with "Choose an address in Nigeria from the suggestions". It is a floor, not proof the address exists.
- Typing after a pick must clear the picked coordinates: wire `onTextChange` to reset `lat`/`lng` to 0 and pass `value` through `pickerValue` (`components/jobs/jobLocation.ts`) so stale coordinates never ride along with edited text. `locationError` gives the message for a form schema or a dialog.
- The geofence map is bounded to the Nigeria box and refuses points outside it.
- Country fields in KYC are a read-only "Nigeria", always sent as `Nigeria`.
- Do not apply the box to telemetry, device positions or live tracking.

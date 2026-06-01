# Button

The `Button` component lives in `packages/reusables/src/components/shadcn/button.tsx`.

## Import

```tsx
import { Button } from "@/components/shadcn/button"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | see Variants | `"default"` | Visual style |
| `size` | see Sizes | `"default"` | Button size |
| `loading` | `boolean` | `false` | Disables the button and shows a spinner |
| `disabled` | `boolean` | `false` | Disables the button |
| `asChild` | `boolean` | `false` | Renders the child through Radix Slot |

Native `<button>` props are also accepted.

## Variants

| Value | Description |
|-------|-------------|
| `default` | Primary brand color |
| `destructive` | Red, for destructive actions |
| `outline` | Transparent with border |
| `secondary` | Muted background |
| `ghost` | No background, hover only |
| `link` | Underline text style |
| `success` | Green |
| `warning` | Yellow/orange |
| `glass` | Blurred backdrop |
| `gradient` | Gradient primary |
| `mtn` | Bold primary with shadow |

## Sizes

| Value | Description |
|-------|-------------|
| `default` | `h-9 px-4` |
| `sm` | `h-8 px-3` |
| `lg` | `h-10 px-6` |
| `xl` | `h-11 px-8` |
| `icon` | `h-9 w-9` square |
| `icon-sm` | `h-8 w-8` square |
| `icon-lg` | `h-11 w-11` square |

## Loading State

Use `loading` while an async action is pending:

```tsx
<Button loading={mutation.isPending}>Save</Button>
```

`loading` disables the button and replaces its content with a spinner. Do not add a separate spinner and disabled state for the same action.

## Forms

```tsx
<Button type="submit" loading={mutation.isPending}>
  Save
</Button>
```

See [forms.md](forms.md) for the full form pattern.

## Links

Use `asChild` with React Router `Link` when a link should look like a button:

```tsx
import { Link } from "react-router-dom"

<Button asChild variant="outline">
  <Link to="/dashboard">Go to dashboard</Link>
</Button>
```

## Accessibility

- `disabled` and `loading` both disable interaction.
- Focus-visible ring styles are included for keyboard navigation.

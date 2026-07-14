import { Tooltip } from "./Tooltip";
import { Button } from "./Button";

// Table row actions are icon-only to keep rows compact — the tooltip (and
// aria-label, for screen readers / no-hover input) is what tells the admin
// what the icon does.
export function IconButton({ label, icon, variant = "secondary", side, ...props }) {
  const Icon = icon;
  return (
    <Tooltip label={label} side={side}>
      <Button variant={variant} size="icon" aria-label={label} {...props}>
        <Icon size={16} />
      </Button>
    </Tooltip>
  );
}

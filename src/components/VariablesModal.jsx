import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";

// The "User" and "Site" groups have no `scope` — they resolve in every
// template. Every other group is keyed to the eventKey it actually applies
// to (see lib/email/context.js/eventKeys.js on the backend, which this
// mirrors) — a template only ever gets the variables from its own group
// plus the two universal ones, so listing a variable here that doesn't
// apply to the template being edited would just render as literal text.
export const VARIABLE_GROUPS = [
  {
    title: "User",
    variables: [
      { name: "fname", description: "Recipient's first name", example: "Jamie" },
      { name: "lname", description: "Recipient's last name (may be empty)", example: "Doe" },
      { name: "full_name", description: "Recipient's full name", example: "Jamie Doe" },
      { name: "username", description: "Email's local part — there's no separate username field", example: "jamie" },
      { name: "email", description: "Recipient's email address", example: "jamie@example.com" },
      { name: "total_credit", description: "Recipient's current credit balance", example: "250" },
    ],
  },
  {
    title: "Site",
    variables: [
      { name: "site_name", description: "The site's display name", example: "Timeline" },
      { name: "app_url", description: "The main site's base URL", example: "https://example.com" },
      { name: "current_year", description: "Current calendar year", example: "2026" },
    ],
  },
  {
    title: "Welcome email",
    scope: "welcome",
    variables: [
      { name: "signup_bonus_credits", description: "Credits automatically granted on signup (0 if none configured)", example: "50" },
    ],
  },
  {
    title: "Password reset code",
    scope: "password_reset_otp",
    variables: [
      { name: "otp_code", description: "The 6-digit one-time code", example: "482913" },
      { name: "otp_expiry_minutes", description: "How many minutes the code stays valid", example: "10" },
    ],
  },
  {
    title: "Purchase complete",
    scope: "purchase_complete",
    variables: [
      { name: "plan_name", description: "Name of the purchased plan", example: "Pro Plan" },
      { name: "credits_purchased", description: "Credits included in the purchase", example: "500" },
      { name: "amount_paid", description: "Amount charged, formatted", example: "499.00" },
      { name: "currency", description: "Currency code", example: "INR" },
      { name: "order_id", description: "The order's ID", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
    ],
  },
  {
    title: "Credits added",
    scope: "credits_added",
    variables: [
      { name: "credits_amount", description: "Credits just added to the account", example: "100" },
      { name: "credit_reason", description: "Reason the admin entered (may be empty)", example: "Support goodwill credit" },
    ],
  },
  {
    title: "Invitation",
    scope: "invitation",
    variables: [
      { name: "inviter_name", description: "Name of the person who sent the invite", example: "Jordan Lee" },
      { name: "timeline_title", description: "Title of the timeline being shared", example: "Family Memories" },
      { name: "invite_role", description: "Role being granted", example: "editor" },
      { name: "invite_url", description: "Link to accept the invitation", example: "https://example.com/invite/xyz" },
      { name: "invite_expiry_days", description: "Days until the invite link expires", example: "7" },
    ],
  },
  {
    title: "Account locked",
    scope: "account_locked",
    variables: [
      { name: "lock_duration", description: "How long the account is locked for", example: "15 minutes" },
    ],
  },
];

export function VariablesModal({ open, onClose, eventKey, onInsert }) {
  return (
    <Modal open={open} onClose={onClose} title="Available variables" width="560px">
      <p className="mb-4 text-sm text-text-muted">
        Click a variable to insert it into whichever field (subject or body) you last clicked into.
      </p>
      <div className="flex flex-col gap-5">
        {VARIABLE_GROUPS.map((group) => {
          const relevant = !group.scope || group.scope === eventKey;
          return (
            <div key={group.title} className={relevant ? "" : "opacity-50"}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.title}</h3>
                {group.scope === eventKey && <Badge tone="primary">Used here</Badge>}
              </div>
              <div className="flex flex-col gap-1">
                {group.variables.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => onInsert(v.name)}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface-hover"
                  >
                    <div>
                      <code className="text-sm font-medium text-primary">{`{${v.name}}`}</code>
                      <p className="text-xs text-text-muted">{v.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">e.g. {v.example}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

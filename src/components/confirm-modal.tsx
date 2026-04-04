import type { FC, PropsWithChildren } from "hono/jsx";
import { Button } from "./ui/button";

/**
 * ConfirmModal: A type-to-confirm danger zone component.
 * Uses native HTML <dialog> for modal behavior (no JS framework needed).
 *
 * Usage:
 *   <ConfirmModal
 *     id="delete-org"
 *     title="Delete organization"
 *     description="This action cannot be undone."
 *     confirmText="my-org-name"
 *     action="/org/my-org/settings/delete"
 *     buttonLabel="Delete"
 *   />
 *
 * Trigger it from a button: <button data-modal-open="delete-org">
 */
export const ConfirmModal: FC<{
  id: string;
  title: string;
  description: string;
  confirmText: string;
  action: string;
  method?: string;
  buttonLabel?: string;
  inputName?: string;
}> = ({
  id,
  title,
  description,
  confirmText,
  action,
  method = "post",
  buttonLabel = "Confirm",
  inputName = "confirm",
}) => (
  <dialog
    id={id}
    class="cn-dialog"
  >
    <div class="cn-dialog-body">
      <h3 class="cn-dialog-title-destructive">{title}</h3>
      <p class="mt-2 text-sm text-foreground/70">{description}</p>
      <p class="mt-3 text-sm text-foreground">
        Type <code class="rounded-none bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{confirmText}</code> to confirm:
      </p>
      <form method={method as any} action={action} class="mt-3">
        <input
          type="text"
          name={inputName}
          required
          autocomplete="off"
          placeholder={confirmText}
          class="cn-input w-full text-sm"
        />
        <div class="mt-4 flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            class="text-foreground/70"
            data-modal-close
          >
            Cancel
          </Button>
          <Button variant="destructive" size="sm" type="submit">
            {buttonLabel}
          </Button>
        </div>
      </form>
    </div>
  </dialog>
);

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
 * Trigger it from a button: <button onclick="document.getElementById('delete-org').showModal()">
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
    class="m-auto max-w-md rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50"
  >
    <div class="p-6">
      <h3 class="text-base font-semibold font-heading text-red-600 dark:text-red-400">{title}</h3>
      <p class="mt-2 text-sm text-muted-foreground">{description}</p>
      <p class="mt-3 text-sm">
        Type <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{confirmText}</code> to confirm:
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
            // @ts-expect-error onclick is valid HTML
            onclick={`document.getElementById('${id}').close()`}
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

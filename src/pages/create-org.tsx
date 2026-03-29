import type { FC } from "hono/jsx";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Icon } from "../components/ui/icon";

/** Shared with backend: @see api/src/utils/naming.ts */
export const ORG_NAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
export const ORG_NAME_MIN = 2;
export const ORG_NAME_MAX = 39;

export function validateOrgName(name: string): string | null {
  if (!name) return "Organization name is required.";
  if (name.length < ORG_NAME_MIN || name.length > ORG_NAME_MAX)
    return `Name must be between ${ORG_NAME_MIN} and ${ORG_NAME_MAX} characters.`;
  if (!ORG_NAME_REGEX.test(name))
    return "Name can only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number.";
  return null;
}

export const CreateOrgPage: FC<{
  error?: string;
  fieldErrors?: { name?: string };
  values?: { name?: string; display_name?: string };
}> = ({ error, fieldErrors = {}, values = {} }) => {
  const nameVal = values.name ?? "";
  const displayNameVal = values.display_name ?? "";
  const nameError = fieldErrors.name;

  return (
    <Container size="narrow" class="py-8">
      <h1 class="mb-6 text-base font-semibold font-heading">Create Organization</h1>

      {error && (
        <div class="cn-form-banner-error mb-6" role="alert">
          <Icon name="warning" class="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form method="post" action="/orgs/new" data-create-org-form data-name-pattern={ORG_NAME_REGEX.source} data-name-min={String(ORG_NAME_MIN)} data-name-max={String(ORG_NAME_MAX)}>
        {/* Name field */}
        <div class="mb-5">
          <label for="org-name" class="mb-1.5 block text-xs font-medium">
            Name <span class="text-destructive" aria-hidden="true">*</span>
          </label>
          <Input
            id="org-name"
            name="name"
            value={nameVal}
            placeholder="my-team"
            autocomplete="off"
            autofocus
            aria-required="true"
            aria-describedby={`org-name-hint${nameError ? " org-name-error" : ""}`}
            {...(nameError ? { "aria-invalid": "true", class: "cn-input cn-input-size-default cn-input-error" } : {})}
          />
          <p id="org-name-hint" class="cn-form-hint mt-1.5">
            Lowercase letters, numbers, and hyphens. {ORG_NAME_MIN}–{ORG_NAME_MAX} characters.
          </p>
          <p
            id="org-name-preview"
            class={`cn-form-hint mt-1${nameVal ? "" : " hidden"}`}
            aria-live="polite"
          >
            Your packages will be scoped to <strong class="font-mono">@{nameVal || "..."}</strong>
          </p>
          {nameError && (
            <p id="org-name-error" class="cn-form-error mt-1.5" role="alert">
              {nameError}
            </p>
          )}
        </div>

        {/* Display Name field */}
        <div class="mb-6">
          <label for="org-display-name" class="mb-1.5 block text-xs font-medium">
            Display Name
          </label>
          <Input
            id="org-display-name"
            name="display_name"
            value={displayNameVal}
            placeholder="My Team"
            autocomplete="off"
            aria-describedby="org-display-name-hint"
          />
          <p id="org-display-name-hint" class="cn-form-hint mt-1.5">
            Optional. Shown on your organization profile page.
          </p>
        </div>

        {/* Submit */}
        <div class="flex items-center justify-between">
          <Button variant="ghost" size="sm" href="/dashboard?tab=orgs">
            <Icon name="arrow-left" class="size-3" />
            Back to Dashboard
          </Button>
          <Button type="submit" size="sm">
            Create Organization
          </Button>
        </div>
      </form>
    </Container>
  );
};

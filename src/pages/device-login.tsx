import type { FC } from "hono/jsx";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";

export const DeviceLoginPage: FC<{ code?: string }> = ({ code }) => (
  <Container size="narrow" class="py-20 text-center">
    <div class="mx-auto max-w-sm">
      <div class="mb-6">
        <Icon name="robot" class="mx-auto size-8 text-muted-foreground" />
      </div>
      <h1 class="mb-3 text-lg font-semibold font-heading">Authorize Device</h1>
      <p class="mb-8 text-xs text-muted-foreground">
        Enter the code shown in your terminal to grant ctx CLI access to your account.
      </p>

      <form data-device-form class="space-y-4">
        {/* Code input */}
        <div>
          <label for="device-code" class="sr-only">
            Device code
          </label>
          <input
            id="device-code"
            name="user_code"
            type="text"
            class="cn-input cn-input-size-lg w-full text-center font-mono text-base tracking-[0.3em] uppercase"
            placeholder="XXXXXXXX"
            maxlength={8}
            minlength={6}
            pattern="[A-Za-z0-9]+"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck={false}
            required
            value={code ?? ""}
          />
        </div>

        {/* Authorize button */}
        <Button variant="default" size="lg" class="w-full" type="submit">
          Authorize
        </Button>

        {/* Status messages (managed by client JS) */}
        <div data-device-status class="text-xs" aria-live="polite">
          <p data-device-msg="loading" class="hidden text-muted-foreground">
            Authorizing...
          </p>
          <p data-device-msg="success" class="hidden text-green-600 dark:text-green-400">
            Device authorized. You can close this tab and return to your terminal.
          </p>
          <p data-device-msg="error" class="hidden text-red-600 dark:text-red-400">
            {/* Error text set by JS */}
          </p>
        </div>
      </form>

      <p class="mt-8 text-xs text-muted-foreground leading-relaxed">
        By authorizing, you grant <code class="bg-muted px-1.5 py-0.5 font-mono">ctx</code> CLI
        read and write access to your getctx.org account.
      </p>
    </div>
  </Container>
);

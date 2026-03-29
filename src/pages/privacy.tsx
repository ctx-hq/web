import type { FC } from "hono/jsx";
import { Container } from "../components/ui/container";
import { SITE_NAME } from "../lib/constants";

export const PrivacyPage: FC = () => (
  <Container size="narrow" class="py-8">
    <h1 class="mb-6 text-base font-semibold font-heading">Privacy Policy</h1>

    <div class="prose prose-sm max-w-none space-y-6 text-xs text-muted-foreground">
      <p class="text-foreground">
        Last updated: March 2026
      </p>

      <section>
        <h2 class="mb-2 text-sm font-semibold font-heading text-foreground">What we collect</h2>
        <p>
          When you sign in with GitHub, we receive and store your <strong>GitHub username</strong>,{" "}
          <strong>avatar URL</strong>, and <strong>email address</strong>. This information is used
          solely to identify your account and display your profile on {SITE_NAME}.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold font-heading text-foreground">What we do not collect</h2>
        <ul class="list-disc space-y-1 pl-5">
          <li>No analytics or tracking scripts</li>
          <li>No third-party advertising or marketing pixels</li>
          <li>No fingerprinting or cross-site tracking</li>
          <li>No sale or sharing of personal data with third parties</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold font-heading text-foreground">Cookies</h2>
        <p>We use three cookies, all strictly necessary for the site to function:</p>
        <ul class="list-disc space-y-1 pl-5">
          <li>
            <strong>__Host-ctx_session</strong> — your authentication session token (HTTP-only, secure,
            30-day expiry)
          </li>
          <li>
            <strong>__Host-oauth_state</strong> — CSRF protection during GitHub sign-in (HTTP-only,
            secure, 10-minute expiry)
          </li>
          <li>
            <strong>__Host-oauth_redirect</strong> — preserves your destination page during sign-in
            (HTTP-only, secure, 10-minute expiry, cleared after use)
          </li>
        </ul>
        <p>
          We also store your theme preference (light/dark) in <code>localStorage</code>, which never
          leaves your browser.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold font-heading text-foreground">Third-party services</h2>
        <p>
          We use <strong>GitHub OAuth</strong> for authentication. When you sign in, your browser
          communicates directly with GitHub per their{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            class="underline hover:text-foreground"
          >
            privacy statement
          </a>
          . We revoke the temporary GitHub access token immediately after sign-in completes.
        </p>
        <p>
          All fonts are self-hosted. No requests are made to Google or other third-party CDNs during
          normal browsing.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold font-heading text-foreground">Data retention &amp; deletion</h2>
        <p>
          Your account data is retained as long as your account exists. To request deletion of your
          data, contact us at{" "}
          <a href="mailto:privacy@getctx.org" class="underline hover:text-foreground">
            privacy@getctx.org
          </a>
          .
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold font-heading text-foreground">Open source</h2>
        <p>
          This website is open source. You can audit exactly what data we collect by reviewing the{" "}
          <a
            href="https://github.com/ctx-hq/web"
            class="underline hover:text-foreground"
          >
            source code
          </a>
          .
        </p>
      </section>
    </div>
  </Container>
);

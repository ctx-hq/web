// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";

/**
 * DOM-level interaction tests for install-tabs.
 * Verifies that clicking tabs toggles active class, panel visibility,
 * and aria-selected — mirroring the logic in public/static/client.js.
 */

function createTabsHTML() {
  return `
    <div class="install-tabs cn-card">
      <nav class="flex gap-4" role="tablist" aria-label="Installation method">
        <button data-tab="agent" id="tab-agent" role="tab" aria-selected="true" aria-controls="panel-agent"
                class="cn-install-tab cn-install-tab-active">Agent</button>
        <button data-tab="human" id="tab-human" role="tab" aria-selected="false" aria-controls="panel-human"
                class="cn-install-tab">Human</button>
      </nav>
      <div data-panel="agent" id="panel-agent" role="tabpanel" aria-labelledby="tab-agent" class="p-3">Agent content</div>
      <div data-panel="human" id="panel-human" role="tabpanel" aria-labelledby="tab-human" class="hidden p-3">Human content</div>
    </div>`;
}

/** Re-implement the click handler from client.js so we can test it in isolation. */
function attachTabHandler(root: HTMLElement) {
  root.addEventListener("click", (e: Event) => {
    const btn = (e.target as HTMLElement)?.closest?.("[data-tab]") as HTMLElement | null;
    if (!btn || !btn.closest(".install-tabs")) return;
    const tab = btn.dataset.tab!;
    const container = btn.closest(".install-tabs")!;
    container.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) => {
      const isInstall = b.classList.contains("cn-install-tab");
      const cls = isInstall ? "cn-install-tab-active" : "cn-tabbed-input-tab-active";
      const isActive = b.dataset.tab === tab;
      b.classList.toggle(cls, isActive);
      if (b.hasAttribute("role")) b.setAttribute("aria-selected", String(isActive));
    });
    container.querySelectorAll<HTMLElement>("[data-panel]").forEach((p) => {
      p.classList.toggle("hidden", p.dataset.panel !== tab);
    });
  });
}

describe("install-tabs interaction", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = createTabsHTML();
    container = document.body;
    attachTabHandler(container);
  });

  it("agent tab is active by default", () => {
    const agentTab = container.querySelector<HTMLElement>('[data-tab="agent"]')!;
    const humanTab = container.querySelector<HTMLElement>('[data-tab="human"]')!;
    const agentPanel = container.querySelector<HTMLElement>('[data-panel="agent"]')!;
    const humanPanel = container.querySelector<HTMLElement>('[data-panel="human"]')!;

    expect(agentTab.classList.contains("cn-install-tab-active")).toBe(true);
    expect(agentTab.getAttribute("aria-selected")).toBe("true");
    expect(humanTab.classList.contains("cn-install-tab-active")).toBe(false);
    expect(humanTab.getAttribute("aria-selected")).toBe("false");
    expect(agentPanel.classList.contains("hidden")).toBe(false);
    expect(humanPanel.classList.contains("hidden")).toBe(true);
  });

  it("clicking human tab activates it and hides agent panel", () => {
    const humanTab = container.querySelector<HTMLElement>('[data-tab="human"]')!;
    humanTab.click();

    const agentTab = container.querySelector<HTMLElement>('[data-tab="agent"]')!;
    const agentPanel = container.querySelector<HTMLElement>('[data-panel="agent"]')!;
    const humanPanel = container.querySelector<HTMLElement>('[data-panel="human"]')!;

    expect(humanTab.classList.contains("cn-install-tab-active")).toBe(true);
    expect(humanTab.getAttribute("aria-selected")).toBe("true");
    expect(agentTab.classList.contains("cn-install-tab-active")).toBe(false);
    expect(agentTab.getAttribute("aria-selected")).toBe("false");
    expect(humanPanel.classList.contains("hidden")).toBe(false);
    expect(agentPanel.classList.contains("hidden")).toBe(true);
  });

  it("clicking agent tab after human restores original state", () => {
    const humanTab = container.querySelector<HTMLElement>('[data-tab="human"]')!;
    const agentTab = container.querySelector<HTMLElement>('[data-tab="agent"]')!;

    humanTab.click();
    agentTab.click();

    const agentPanel = container.querySelector<HTMLElement>('[data-panel="agent"]')!;
    const humanPanel = container.querySelector<HTMLElement>('[data-panel="human"]')!;

    expect(agentTab.classList.contains("cn-install-tab-active")).toBe(true);
    expect(agentTab.getAttribute("aria-selected")).toBe("true");
    expect(agentPanel.classList.contains("hidden")).toBe(false);
    expect(humanPanel.classList.contains("hidden")).toBe(true);
  });

  it("clicking already-active tab is a no-op", () => {
    const agentTab = container.querySelector<HTMLElement>('[data-tab="agent"]')!;
    agentTab.click();

    expect(agentTab.classList.contains("cn-install-tab-active")).toBe(true);
    expect(agentTab.getAttribute("aria-selected")).toBe("true");
  });

  it("aria-controls matches panel id", () => {
    const agentTab = container.querySelector<HTMLElement>('[data-tab="agent"]')!;
    const humanTab = container.querySelector<HTMLElement>('[data-tab="human"]')!;

    expect(agentTab.getAttribute("aria-controls")).toBe("panel-agent");
    expect(humanTab.getAttribute("aria-controls")).toBe("panel-human");
    expect(container.querySelector("#panel-agent")).not.toBeNull();
    expect(container.querySelector("#panel-human")).not.toBeNull();
  });

  it("tabpanel aria-labelledby matches tab id", () => {
    const agentPanel = container.querySelector<HTMLElement>('[data-panel="agent"]')!;
    const humanPanel = container.querySelector<HTMLElement>('[data-panel="human"]')!;

    expect(agentPanel.getAttribute("aria-labelledby")).toBe("tab-agent");
    expect(humanPanel.getAttribute("aria-labelledby")).toBe("tab-human");
  });
});

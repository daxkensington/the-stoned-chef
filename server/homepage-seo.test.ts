import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildSitemap, SITE_BASE_URL } from "../app/sitemap";
import {
  HOMEPAGE_TITLE,
  MENU_PAGE_FAQS,
  MENU_PAGE_TITLE,
  RESTAURANT_JSON_LD,
  buildHomepageFaqJsonLd,
  buildMenuFaqJsonLd,
  getHomepageDescription,
  getHomepageFaqs,
  getMenuPageDescription,
  serializeJsonLd,
} from "../shared/homepage-seo";

const ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

interface RobotsGroup {
  agents: string[];
  allow: string[];
  disallow: string[];
}

function parseRobotsTxt(raw: string): { groups: RobotsGroup[]; sitemaps: string[] } {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let seenRuleInGroup = false;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      current = null;
      seenRuleInGroup = false;
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (field === "user-agent") {
      if (!current || seenRuleInGroup) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
        seenRuleInGroup = false;
      }
      current.agents.push(value);
    } else if (field === "allow" && current) {
      current.allow.push(value);
      seenRuleInGroup = true;
    } else if (field === "disallow" && current) {
      current.disallow.push(value);
      seenRuleInGroup = true;
    } else if (field === "sitemap") {
      sitemaps.push(value);
    }
  }

  return { groups, sitemaps };
}

test("homepage and /menu titles and descriptions stay within SERP character limits", () => {
  assert.ok(
    HOMEPAGE_TITLE.length > 20 && HOMEPAGE_TITLE.length <= 60,
    `Expected HOMEPAGE_TITLE <= 60 chars, got ${HOMEPAGE_TITLE.length}: "${HOMEPAGE_TITLE}"`,
  );
  assert.ok(
    MENU_PAGE_TITLE.length > 20 && MENU_PAGE_TITLE.length <= 60,
    `Expected MENU_PAGE_TITLE <= 60 chars, got ${MENU_PAGE_TITLE.length}: "${MENU_PAGE_TITLE}"`,
  );
  assert.match(MENU_PAGE_TITLE, /Menu & Prices/);
  assert.match(MENU_PAGE_TITLE, /Deseronto/);

  for (const enabled of [true, false]) {
    const homeDesc = getHomepageDescription(enabled);
    assert.ok(
      homeDesc.length >= 100 && homeDesc.length <= 158,
      `Expected getHomepageDescription(${enabled}) <= 158 chars, got ${homeDesc.length}: "${homeDesc}"`,
    );
    assert.match(homeDesc, /45 Dundas St, Deseronto/);
    assert.match(homeDesc, /Hwy 401/);
    assert.match(homeDesc, /Napanee/);

    const menuDesc = getMenuPageDescription(enabled);
    assert.ok(
      menuDesc.length >= 100 && menuDesc.length <= 158,
      `Expected getMenuPageDescription(${enabled}) <= 158 chars, got ${menuDesc.length}: "${menuDesc}"`,
    );
    assert.match(menuDesc, /menu & prices/i);
    assert.match(menuDesc, /Deseronto/);
    assert.match(menuDesc, /5 mins from Napanee off Hwy 401/);

    if (!enabled) {
      assert.doesNotMatch(homeDesc, /order online|prepaid pickup/i);
      assert.doesNotMatch(menuDesc, /order online|prepaid pickup/i);
    }
  }
});

test("SEO and AEO source files contain clean UTF-8 with zero mojibake", () => {
  const files = [
    "shared/homepage-seo.ts",
    "app/layout.tsx",
    "app/page.tsx",
    "app/menu/page.tsx",
    "app/sitemap.ts",
    "client/src/components/Navbar.tsx",
    "public/llms.txt",
    "public/robots.txt",
  ];

  for (const file of files) {
    const content = readRepoFile(file);
    assert.ok(!content.includes("â"), `${file} contains UTF-8 mojibake ("â")`);
    assert.ok(!content.includes("\uFFFD"), `${file} contains replacement char U+FFFD`);
    assert.ok(!content.startsWith("\uFEFF"), `${file} starts with UTF-8 BOM`);
  }
});

test("JSON-LD helpers serialize valid Restaurant and FAQPage structured data", () => {
  const restaurantRaw = serializeJsonLd(RESTAURANT_JSON_LD);
  assert.ok(!restaurantRaw.includes("<"));
  const restaurant = JSON.parse(restaurantRaw) as Record<string, unknown>;
  assert.equal(restaurant["@context"], "https://schema.org");
  assert.equal(restaurant.name, "The Stoned Chef");
  assert.equal(restaurant.telephone, "+1-343-337-5810");
  assert.equal(restaurant.hasMenu, "https://thestonedchef.ca/menu");

  for (const enabled of [true, false]) {
    const faqs = getHomepageFaqs(enabled);
    assert.ok(faqs.length >= 4);
    const faqRaw = serializeJsonLd(buildHomepageFaqJsonLd(enabled));
    const parsed = JSON.parse(faqRaw) as {
      "@context": string;
      "@type": string;
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    assert.equal(parsed["@context"], "https://schema.org");
    assert.equal(parsed["@type"], "FAQPage");
    assert.equal(parsed.mainEntity.length, faqs.length);
    parsed.mainEntity.forEach((entry, idx) => {
      assert.equal(entry.name, faqs[idx].question);
      assert.equal(entry.acceptedAnswer.text, faqs[idx].answer);
    });
  }

  const menuFaqParsed = JSON.parse(serializeJsonLd(buildMenuFaqJsonLd())) as {
    "@type": string;
    mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
  };
  assert.equal(menuFaqParsed["@type"], "FAQPage");
  assert.equal(menuFaqParsed.mainEntity.length, MENU_PAGE_FAQS.length);

  // XSS-safe escaping of script-closing tags
  const xssAttempt = serializeJsonLd({ note: "</script><script>alert(1)</script>" });
  assert.ok(!xssAttempt.includes("</script>"));
  assert.equal(
    (JSON.parse(xssAttempt) as { note: string }).note,
    "</script><script>alert(1)</script>",
  );
});

test("homepage, layout, menu, navbar, and next.config wire visible FAQs, crawlable /menu links, and htmlLimitedBots", () => {
  const pageSource = readRepoFile("app/page.tsx");
  const layoutSource = readRepoFile("app/layout.tsx");
  const menuSource = readRepoFile("app/menu/page.tsx");
  const navbarSource = readRepoFile("client/src/components/Navbar.tsx");
  const nextConfigSource = readRepoFile("next.config.ts");

  assert.match(layoutSource, /RESTAURANT_JSON_LD/);
  assert.match(pageSource, /HOMEPAGE_FAQ_JSON_LD/);
  assert.match(pageSource, /HOMEPAGE_FAQS\.map/);
  assert.match(pageSource, /href="\/menu"/);
  assert.doesNotMatch(pageSource, /Pay online or at pickup/i);

  assert.match(menuSource, /MENU_PAGE_TITLE/);
  assert.match(menuSource, /MENU_PAGE_FAQS\.map/);
  assert.match(navbarSource, /href="\/menu"/);
  assert.match(nextConfigSource, /htmlLimitedBots:\s*\/\.\*\//);
});

test("robots.txt allows AI search/answer bots and explicitly blocks CCBot and Bytespider", () => {
  const raw = readRepoFile("public/robots.txt");
  const { groups, sitemaps } = parseRobotsTxt(raw);

  assert.ok(sitemaps.includes("https://thestonedchef.ca/sitemap.xml"));

  const allowedAiBots = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "GPTBot",
    "Claude-SearchBot",
    "Claude-Web",
    "ClaudeBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "DuckAssistBot",
    "YouBot",
  ];

  for (const bot of allowedAiBots) {
    const matchingGroup = groups.find((g) => g.agents.includes(bot));
    assert.ok(matchingGroup, `Expected explicit User-agent rule for ${bot}`);
    assert.ok(matchingGroup.allow.includes("/"), `Expected ${bot} allowed on /`);
    assert.ok(matchingGroup.allow.includes("/menu"), `Expected ${bot} allowed on /menu`);
    assert.ok(matchingGroup.allow.includes("/llms.txt"), `Expected ${bot} allowed on /llms.txt`);
    assert.ok(!matchingGroup.disallow.includes("/"), `${bot} must not be disallowed on /`);
  }

  for (const blockedBot of ["CCBot", "Bytespider"]) {
    const blockedGroup = groups.find((g) => g.agents.includes(blockedBot));
    assert.ok(blockedGroup, `Expected explicit User-agent block for ${blockedBot}`);
    assert.deepEqual(
      blockedGroup.disallow,
      ["/"],
      `Expected ${blockedBot} to have Disallow: /`,
    );
    assert.equal(blockedGroup.allow.length, 0, `Expected ${blockedBot} to have zero Allow rules`);
  }
});

test("llms.txt and storefront surfaces maintain strict brand isolation and accurate facts", () => {
  const llms = readRepoFile("public/llms.txt");
  assert.match(llms, /45 Dundas Street, Deseronto, ON K0K 1X0/);
  assert.match(llms, /5 minutes west of Napanee off Hwy 401 Exit 570/);
  assert.match(llms, /\+1-343-337-5810/);
  assert.match(llms, /11:00 AM – 7:00 PM daily/);
  assert.match(llms, /https:\/\/thestonedchef\.ca\/menu/);
  assert.match(llms, /Smash Burgers/i);
  assert.match(llms, /Hand-Cut Fries/i);
  assert.match(llms, /Cheese-Curd Poutines/i);
  assert.match(llms, /Beer-Battered Fish & Chips/i);

  const publicFiles = [
    "public/llms.txt",
    "shared/homepage-seo.ts",
    "app/layout.tsx",
    "app/page.tsx",
    "app/menu/page.tsx",
  ];
  const forbiddenBrandPatterns = [
    /mohawk\s*medibles/i,
    /mohawkmedibles/i,
    /lnmenterprises/i,
    /l\s*(?:&|&amp;)\s*m\s+enterprises/i,
    /sago\s+gas/i,
    /spiritfire/i,
    /northlucid/i,
    /borealvapes/i,
    /7ohnorth/i,
    /goldenclimax/i,
    /puritynorth/i,
  ];

  for (const file of publicFiles) {
    const content = readRepoFile(file);
    for (const forbidden of forbiddenBrandPatterns) {
      assert.doesNotMatch(
        content,
        forbidden,
        `Forbidden cross-site brand reference (${forbidden}) found in ${file}`,
      );
    }
  }
});

test("sitemap includes public https://thestonedchef.ca routes and respects ONLINE_ORDERING_ENABLED", () => {
  const closedUrls = buildSitemap(false).map((entry) => entry.url);
  assert.deepEqual(closedUrls, [SITE_BASE_URL, `${SITE_BASE_URL}/menu`]);

  const openUrls = buildSitemap(true).map((entry) => entry.url);
  assert.deepEqual(openUrls, [
    SITE_BASE_URL,
    `${SITE_BASE_URL}/menu`,
    `${SITE_BASE_URL}/order`,
  ]);

  for (const url of openUrls) {
    assert.ok(url.startsWith("https://thestonedchef.ca"));
    assert.doesNotMatch(url, /\/admin|\/confirmation|\/api/);
  }
});

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const REDDIT_URL =
  "https://www.reddit.com/r/popular/top.json?limit=10&t=day&raw_json=1";
const GITHUB_TRENDING = "https://github.com/trending?since=daily";

const HEADERS = {
  "User-Agent": "pulse-board/1.0 (trending dashboard; contact: dev@example.com)",
};

function timeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

async function getHackerNews() {
  const t = timeout(6000);
  try {
    const idsRes = await fetch(HN_TOP, { signal: t.signal, headers: HEADERS });
    const ids = (await idsRes.json()).slice(0, 8);
    const items = await Promise.all(
      ids.map(async (id) => {
        const r = await fetch(HN_ITEM(id), { headers: HEADERS });
        return r.json();
      })
    );
    return items
      .filter(Boolean)
      .map((item, i) => ({
        rank: i + 1,
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        meta: `${item.score ?? 0} pts · ${item.descendants ?? 0} comments`,
        source: "Hacker News",
        channel: "tech",
      }));
  } catch (e) {
    return [];
  } finally {
    t.clear();
  }
}

async function getReddit() {
  const t = timeout(6000);
  try {
    const res = await fetch(REDDIT_URL, { signal: t.signal, headers: HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.children ?? [];
    return posts.slice(0, 8).map((p, i) => {
      const d = p.data;
      return {
        rank: i + 1,
        title: d.title,
        url: `https://reddit.com${d.permalink}`,
        meta: `${(d.ups ?? 0).toLocaleString()} upvotes · r/${d.subreddit}`,
        source: "Reddit",
        channel: "social",
      };
    });
  } catch (e) {
    return [];
  } finally {
    t.clear();
  }
}

async function getGithubTrending() {
  const t = timeout(6000);
  try {
    const res = await fetch(GITHUB_TRENDING, {
      signal: t.signal,
      headers: HEADERS,
    });
    if (!res.ok) return [];
    const html = await res.text();

    const repoBlocks = html.split('<article class="Box-row">').slice(1, 9);
    return repoBlocks.map((block, i) => {
      const nameMatch = block.match(
        /href="\/([^"]+)"\s*>\s*<span[^>]*>\s*([^<]+?)\s*<\/span>\s*([^<]+?)\s*<\/a>/s
      );
      const hrefMatch = block.match(/href="\/([^"?"]+)"/);
      const fullName = hrefMatch ? hrefMatch[1].trim() : `repo-${i + 1}`;

      const descMatch = block.match(
        /<p class="col-9[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/p>/
      );
      const desc = descMatch
        ? descMatch[1].replace(/\s+/g, " ").trim()
        : "";

      const starsMatch = block.match(
        /stargazers"[^>]*>\s*<svg[\s\S]*?<\/svg>\s*([\d,]+)/
      );
      const stars = starsMatch ? starsMatch[1] : "—";

      const langMatch = block.match(
        /<span[^>]*itemprop="programmingLanguage"[^>]*>\s*([^<]+?)\s*<\/span>/
      );
      const lang = langMatch ? langMatch[1].trim() : null;

      return {
        rank: i + 1,
        title: fullName,
        url: `https://github.com/${fullName}`,
        meta: [lang, `★ ${stars} today`].filter(Boolean).join(" · "),
        desc,
        source: "GitHub",
        channel: "code",
      };
    });
  } catch (e) {
    return [];
  } finally {
    t.clear();
  }
}

export async function GET() {
  const [hn, reddit, github] = await Promise.all([
    getHackerNews(),
    getReddit(),
    getGithubTrending(),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    channels: {
      tech: hn,
      social: reddit,
      code: github,
    },
  });
}

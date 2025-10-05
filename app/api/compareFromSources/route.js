import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const MODEL = "llama-3.1-8b-instant";
const TEMP = 0.3;
const CHAR_LIMIT = 400;
const MAX_SECTIONS = 1;
const TOKENS_SUMMARY = 220;
const TOKENS_COMPARE = 320;

const BOOK_DIRS = [
  path.join(process.cwd(), "data"),
  path.join(process.cwd(), "public", "data"),
];

function safe(s) {
  return (s ?? "").toString();
}
function truncate(s, n = CHAR_LIMIT) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "...(truncated)" : s;
}
function textMatchesTopic(text, topic) {
  return safe(text).toLowerCase().includes(topic.toLowerCase());
}

async function findBooksDir() {
  for (const d of BOOK_DIRS) {
    try {
      const st = await fs.promises.stat(d);
      if (st.isDirectory()) return d;
    } catch {}
  }
  return null;
}

async function loadBooks(dir) {
  const files = await fs.promises.readdir(dir);
  const results = [];
  for (const f of files) {
    if (!f.toLowerCase().endsWith(".json")) continue;
    const full = path.join(dir, f);
    try {
      const raw = await fs.promises.readFile(full, "utf8");
      results.push({ fileName: f, data: JSON.parse(raw) });
    } catch {}
  }
  return results;
}

// normalize different data structures
function normalize(fileRec) {
  const { fileName, data } = fileRec;
  let sections = [];

  if (Array.isArray(data)) {
    sections = data;
  } else if (Array.isArray(data?.chunks)) {
    sections = data.chunks;
  } else if (Array.isArray(data?.sections)) {
    sections = data.sections;
  } else if (data && data.content) {
    sections = [data];
  } else if (typeof data === "object") {
    const nestedArray = Object.values(data).find((v) => Array.isArray(v));
    if (nestedArray) sections = nestedArray;
  }

  return {
    bookId: fileName,
    title: data?.title ?? fileName.replace(".json", ""),
    sections: sections.map((s, i) => ({
      sectionId: `${fileName}::${i}`,
      title: s.title ?? s.full_title ?? "",
      content: s.content ?? "",
    })),
  };
}

async function callGroq(messages, max_tokens) {
  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens,
      temperature: TEMP,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Groq call failed: ${txt}`);
  }
  return await resp.json();
}

export async function POST(req) {
  try {
    const { topic } = await req.json();
    if (!topic)
      return NextResponse.json(
        { success: false, error: "Topic is required" },
        { status: 400 }
      );

    const dir = await findBooksDir();
    if (!dir)
      return NextResponse.json(
        { success: false, error: "Books directory not found" },
        { status: 500 }
      );

    const files = await loadBooks(dir);
    const books = files.map(normalize);

    const matched = [];
    for (const b of books) {
      const hits = b.sections.filter((s) => textMatchesTopic(s.content, topic));
      if (hits.length > 0)
        matched.push({ ...b, matches: hits.slice(0, MAX_SECTIONS) });
    }

    // fallback: if exact match not found, include all books
    if (matched.length === 0) {
      matched.push(
        ...books.map((b) => ({ ...b, matches: b.sections.slice(0, 1) }))
      );
    }

    // === per-book summaries ===
    const summaries = [];
    for (const b of matched) {
      const section = b.matches[0];
      const content = truncate(section.content);

      const prompt = `
Summarize how the concept "${topic}" relates to or appears within this section from "${b.title}". 
- Focus on meaning, principles, processes, and context relevant to the topic.
- Even if the topic word is not used, summarize any related ideas or guidance that align conceptually.
- Do NOT say that the topic is missing or not mentioned.
- Write as an authoritative summary (max 100 words).
`;

      const res = await callGroq(
        [
          {
            role: "system",
            content: "You are a precise technical summarizer.",
          },
          { role: "user", content: prompt + "\n\nSection:\n" + content },
        ],
        TOKENS_SUMMARY
      );

      const summary =
        res?.choices?.[0]?.message?.content?.trim() ?? "(no summary)";
      summaries.push({ bookId: b.bookId, title: b.title, summary });
    }

    // === aggregate comparison ===
    const comparePrompt = `
Compare how the topic "${topic}" is treated across the following project management sources.
Use only the information in the summaries. 
Never mention missing data or absence. Focus on conceptual, structural, and methodological aspects.

Provide output in **three sections**, each with clear bullet points:

**Similarities:**
- ...

**Differences:**
- ...

**Unique Points:**
- ...

Sources:
${summaries.map((s) => `- ${s.title}: ${s.summary}`).join("\n")}
`;

    const agg = await callGroq(
      [
        {
          role: "system",
          content:
            "You are an expert in comparative project management standards.",
        },
        { role: "user", content: comparePrompt },
      ],
      TOKENS_COMPARE
    );

    const finalComparison =
      agg?.choices?.[0]?.message?.content?.trim() ?? "No comparison available.";

    return NextResponse.json({
      success: true,
      matchedBooks: matched.length,
      summaries,
      comparison: finalComparison,
    });
  } catch (e) {
    console.error("compareFromSources error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

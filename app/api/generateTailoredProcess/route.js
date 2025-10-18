import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "llama-3.1-8b-instant";
const TEMP = 0.4;
const MAX_TOKENS = 1800;

const BOOK_DIRS = [
  path.join(process.cwd(), "data"),
  path.join(process.cwd(), "public", "data"),
];

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
      const parsed = JSON.parse(raw);
      results.push({ fileName: f, data: parsed });
    } catch (e) {
      console.error(`Error loading ${f}:`, e.message);
    }
  }
  return results;
}

function extractRelevantSections(books, keywords) {
  console.log(`\n🔍 Searching for keywords: ${keywords.join(", ")}`);
  const relevant = [];

  for (const fileRec of books) {
    const { fileName, data } = fileRec;
    const sections = Array.isArray(data) ? data : [];
    console.log(
      `\n📚 Processing ${fileName}: ${sections.length} sections found`
    );

    if (sections.length === 0) {
      console.log(`  ⚠️  No sections found in ${fileName}`);
      continue;
    }

    let matchCount = 0;
    for (const section of sections) {
      const content = section.content || "";
      const title = section.title || section.full_title || "";
      const chapter = section.chapter || "";
      const mainChapter = section.main_chapter || "";
      const sectionNumber = section.section_number || "";

      const searchText = (title + " " + content + " " + chapter).toLowerCase();
      const matchedKeywords = keywords.filter((kw) =>
        searchText.includes(kw.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        matchCount++;
        relevant.push({
          book: mainChapter || fileName.replace(".json", ""),
          bookId: fileName,
          sectionNumber: sectionNumber,
          title: title || "(Untitled)",
          chapter: chapter,
          content: content.substring(0, 400),
          matchedKeywords: matchedKeywords,
          relevanceScore: matchedKeywords.length,
          wordCount: section.word_count || 0,
        });
      }
    }
    console.log(`  ✅ Found ${matchCount} matching sections in ${fileName}`);
  }

  relevant.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.wordCount - a.wordCount;
  });

  console.log(`\n📊 Total relevant sections found: ${relevant.length}`);
  return relevant.slice(0, 12);
}

async function callGroq(messages, max_tokens = MAX_TOKENS) {
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
    throw new Error(`Groq API failed: ${txt}`);
  }
  return await resp.json();
}

const scenarioDefinitions = {
  software: {
    name: "Custom Software Development Project",
    context:
      "Well-defined requirements, less than 6 months duration, fewer than 7 team members",
    deliverable: "A lightweight process optimized for speed and flexibility",
    keywords: [
      "agile",
      "sprint",
      "iteration",
      "incremental",
      "adaptive",
      "scrum",
      "kanban",
      "backlog",
      "velocity",
      "retrospective",
      "user story",
      "continuous",
      "delivery",
      "integration",
      "planning",
      "estimation",
      "requirements",
      "development",
    ],
    characteristics: [
      "Small, co-located team",
      "Clear, well-defined requirements",
      "Short timeline requiring rapid delivery",
      "Need for flexibility and adaptability",
      "Frequent stakeholder engagement",
    ],
  },
  innovation: {
    name: "Innovative Product Development Project",
    context:
      "R&D-heavy project with uncertain outcomes, approximately 1 year duration",
    deliverable:
      "A hybrid or adaptive process balancing innovation, iteration, and stakeholder management",
    keywords: [
      "innovation",
      "research",
      "prototype",
      "experiment",
      "learning",
      "risk",
      "uncertainty",
      "stakeholder",
      "adaptive",
      "iteration",
      "discovery",
      "exploratory",
      "feasibility",
      "validation",
      "change",
      "progressive",
      "knowledge",
      "benefits",
      "value",
    ],
    characteristics: [
      "High uncertainty in outcomes",
      "Research and development focus",
      "Need for experimentation and learning",
      "Multiple prototyping cycles",
      "Strong stakeholder communication required",
    ],
  },
  government: {
    name: "Large Government Project",
    context:
      "Multi-component project (civil, electrical, IT) with 2-year duration",
    deliverable:
      "A comprehensive process covering governance, compliance, procurement, risk management, and reporting",
    keywords: [
      "governance",
      "compliance",
      "procurement",
      "contract",
      "supplier",
      "documentation",
      "reporting",
      "control",
      "audit",
      "regulatory",
      "quality",
      "assurance",
      "baseline",
      "change control",
      "approval",
      "stage",
      "tollgate",
      "review",
      "authorization",
      "business case",
    ],
    characteristics: [
      "Multiple contractors and suppliers",
      "Strict regulatory compliance requirements",
      "Complex governance structure",
      "Extensive documentation needs",
      "Long timeline with multiple phases",
    ],
  },
};

export async function POST(req) {
  try {
    const { scenario } = await req.json();

    if (!scenario || !scenarioDefinitions[scenario]) {
      return NextResponse.json(
        { success: false, error: "Invalid scenario specified" },
        { status: 400 }
      );
    }

    const scenarioDef = scenarioDefinitions[scenario];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 Generating process for: ${scenarioDef.name}`);
    console.log(`${"=".repeat(60)}`);

    const dir = await findBooksDir();
    let contextSections = [];
    let booksLoaded = [];

    if (dir) {
      const books = await loadBooks(dir);
      booksLoaded = books.map((b) => b.fileName);
      console.log(`\n📚 Loaded books: ${booksLoaded.join(", ")}`);
      contextSections = extractRelevantSections(books, scenarioDef.keywords);
    } else {
      console.log("⚠️  Books directory not found!");
    }

    // Build reference map for citations
    const referenceMap = contextSections.map((s, idx) => ({
      id: idx + 1,
      book: s.book,
      section: s.sectionNumber,
      title: s.title,
      keywords: s.matchedKeywords,
    }));

    const contextText =
      contextSections.length > 0
        ? contextSections
            .map(
              (s, idx) =>
                `[${idx + 1}] ${s.book} Section ${s.sectionNumber}: ${s.title}
Keywords: ${s.matchedKeywords.join(", ")}
${s.content.substring(0, 300)}...`
            )
            .join("\n\n")
        : `Limited context. Use general PM principles from PMBOK 7, PRINCE2, ISO 21500/21502.`;

    const systemPrompt = `You are an expert project management consultant with deep knowledge of PMBOK 7, PRINCE2, and ISO 21500/21502. You create tailored, evidence-based project processes with accurate citations using ONLY the section numbers provided in the context.`;

    const userPrompt = `Create a tailored project process for:

SCENARIO: ${scenarioDef.name}
Context: ${scenarioDef.context}
Characteristics: ${scenarioDef.characteristics.join("; ")}

STANDARDS CONTEXT:
${contextText}

IMPORTANT CITATION RULES:
- When citing, use EXACT section numbers from the context above (e.g., "PMBOK Section 3.12" or "PRINCE2 Section 1.2")
- Format citations as: [Standard Name Section X.X: Topic]
- Only cite sections that are actually provided in the context
- Every major recommendation must have at least one citation

CREATE THIS DOCUMENT (plain text, no markdown formatting):

# ${scenarioDef.name} - Process Design Document

1. Executive Summary
Brief overview of the tailored approach and why it fits this scenario.

2. Methodology Rationale
Explain the chosen approach and cite relevant performance domains, themes, or guidance from the standards context.

3. Project Lifecycle Phases
Define 4-6 phases. For each phase:

Phase [N]: [Phase Name]
Objective: [Goal]
Duration: [Estimate]
Key Activities:
- [Activity 1] - Responsible: [Role]
- [Activity 2] - Responsible: [Role]
- [Activity 3] - Responsible: [Role]

Key Deliverables:
- [Deliverable 1]
- [Deliverable 2]

Decision Gate [N]:
Criteria: [What must be achieved]
Approvers: [Who decides]

Standards References:
- [Citation with exact section number from context]
- [Citation with exact section number from context]

4. Team Structure and Roles
List 5-6 key roles with responsibilities and RACI level.
Standards Reference: [Cite team/organization sections from context]

5. Key Artifacts and Deliverables
List 8-10 major deliverables with purpose, owner, phase, and standards reference.

6. Decision Gates and Governance
Define gate structure, criteria, and approval bodies.
Standards Reference: [Cite governance/progress sections from context]

7. Risk Management Strategy
Tailored risk approach for this scenario.
Standards Reference: [Cite risk/uncertainty sections from context]

8. Stakeholder Engagement Plan
Communication and engagement strategy.
Standards Reference: [Cite stakeholder sections from context]

9. Quality Management Approach
Quality standards and review processes.
Standards Reference: [Cite quality/measurement sections from context]

10. Tailoring Justification

Practices INCLUDED (5-6 practices):
- [Practice]: Why included, how applied, source with exact section number

Practices OMITTED (3-4 practices):
- [Practice]: Why not needed for this scenario, typical source reference

Adaptations MADE (2-3 adaptations):
- [Practice]: How modified from standard approach and why

11. Process Flow Diagram
Simple text-based flow showing phases and gates.

12. Success Metrics and KPIs
5-6 specific metrics for measuring success in this scenario.

13. Standards Citations Summary
List all section references used:
- PMBOK 7: [Section X.X: Topic, Section Y.Y: Topic, ...]
- PRINCE2: [Section A.B: Topic, Section C.D: Topic, ...]
- ISO 21500/21502: [Section M.N: Topic, ...]

Use actual phase names appropriate for the scenario. Be specific and actionable. Cite exact section numbers from the provided context.`;

    const result = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      MAX_TOKENS
    );

    const process = result?.choices?.[0]?.message?.content?.trim();

    if (!process) {
      return NextResponse.json(
        { success: false, error: "Failed to generate process" },
        { status: 500 }
      );
    }

    // Extract citations with section numbers
    const citations = [];

    // Pattern: "PMBOK Section X.X" or "PMBOK 7 Section X.X"
    const pmbokMatches =
      process.match(/PMBOK\s*7?\s*Section\s+[\d.]+[:\s]+[^\n]+/gi) || [];
    pmbokMatches.forEach((m) => {
      const sectionMatch = m.match(/Section\s+([\d.]+)/i);
      if (sectionMatch) {
        citations.push({
          standard: "PMBOK 7",
          section: sectionMatch[1],
          reference: m.trim(),
        });
      }
    });

    // Pattern: "PRINCE2 Section X.X" or "PRINCE2 Chapter X"
    const prince2Matches =
      process.match(/PRINCE2\s*(Section|Chapter)\s+[\d.]+[:\s]+[^\n]+/gi) || [];
    prince2Matches.forEach((m) => {
      const sectionMatch = m.match(/(Section|Chapter)\s+([\d.]+)/i);
      if (sectionMatch) {
        citations.push({
          standard: "PRINCE2",
          section: sectionMatch[2],
          reference: m.trim(),
        });
      }
    });

    // Pattern: "ISO 21500 Section X.X" or "ISO 21502 Section X.X"
    const isoMatches =
      process.match(/ISO\s*\d+\s*Section\s+[\d.]+[:\s]+[^\n]+/gi) || [];
    isoMatches.forEach((m) => {
      const sectionMatch = m.match(/Section\s+([\d.]+)/i);
      if (sectionMatch) {
        citations.push({
          standard: "ISO 21500/21502",
          section: sectionMatch[1],
          reference: m.trim(),
        });
      }
    });

    // Deduplicate citations
    const uniqueCitations = Array.from(
      new Map(citations.map((c) => [c.reference, c])).values()
    ).slice(0, 30);

    console.log(`\n✅ Process generated successfully`);
    console.log(
      `📝 Extracted ${uniqueCitations.length} unique citations with section numbers`
    );

    return NextResponse.json({
      success: true,
      scenario: scenario,
      scenarioName: scenarioDef.name,
      process,
      citations: uniqueCitations,
      referenceMap: referenceMap,
      metadata: {
        context: scenarioDef.context,
        deliverable: scenarioDef.deliverable,
        characteristics: scenarioDef.characteristics,
        sectionsUsed: contextSections.length,
        booksLoaded: booksLoaded.length,
      },
    });
  } catch (error) {
    console.error("❌ Generate tailored process error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

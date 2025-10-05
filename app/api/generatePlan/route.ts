import { NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "llama-3.1-8b-instant";
const TEMP = 0.5;
const MAX_TOKENS = 1500;

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

export async function POST(req) {
  try {
    const {
      teamSize,
      projectName,
      department,
      projectType,
      duration,
      budget,
      methodology,
      additionalDetails,
    } = await req.json();

    // Validation
    if (!teamSize || !projectName || !department) {
      return NextResponse.json(
        {
          success: false,
          error: "Team size, project name, and department are required",
        },
        { status: 400 }
      );
    }

    // Build context for the AI
    const projectContext = `
Project Details:
- Project Name: ${projectName}
- Team Size: ${teamSize} members
- Department: ${department}
${projectType ? `- Project Type: ${projectType}` : ""}
${duration ? `- Duration: ${duration} months` : ""}
${budget ? `- Budget: ${budget}` : ""}
${methodology ? `- Preferred Methodology: ${methodology}` : ""}
${additionalDetails ? `- Additional Details: ${additionalDetails}` : ""}
`;

    const prompt = `
You are an expert project management consultant. Based on the following project details, create a comprehensive project management plan.

${projectContext}

Generate a detailed project plan that includes:

1. **Executive Summary** - Brief overview of the project
2. **Project Objectives** - Clear, measurable goals
3. **Scope Definition** - What's included and excluded
4. **Team Structure** - Roles and responsibilities for the ${teamSize}-person team
5. **Timeline & Milestones** - Key phases and deliverables${duration ? ` over ${duration} months` : ""}
6. **Resource Allocation** - How team members and resources will be utilized${budget ? ` within the budget of ${budget}` : ""}
7. **Risk Management** - Potential risks and mitigation strategies
8. **Communication Plan** - How the team will collaborate and report progress
9. **Success Metrics** - How to measure project success

Format the plan in markdown with clear headings and bullet points. Make it practical and actionable for the ${department} department.
`;

    const systemPrompt = `You are an experienced project management consultant specializing in creating practical, actionable project plans. You understand various methodologies (Agile, Waterfall, Scrum, etc.) and can adapt plans to different team sizes, budgets, and project types. Provide detailed, realistic plans that teams can actually implement.`;

    const result = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      MAX_TOKENS
    );

    const plan = result?.choices?.[0]?.message?.content?.trim();

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Failed to generate plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      projectDetails: {
        teamSize,
        projectName,
        department,
        projectType,
        duration,
        budget,
        methodology,
      },
    });
  } catch (error) {
    console.error("Generate plan error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
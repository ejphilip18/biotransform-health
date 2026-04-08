import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert PDF to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Call Gemini API with vision capabilities
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a medical data analyst. Analyze this bloodwork PDF and extract the following information in JSON format:
{
  "biomarkers": [
    {
      "name": "Vitamin D",
      "value": 28,
      "unit": "ng/mL",
      "status": "low" | "optimal" | "high",
      "optimalRange": "30-100"
    }
  ],
  "summary": "Brief summary of findings",
  "recommendations": [
    {
      "supplement": "Vitamin D3 + K2",
      "dosage": "5000 IU",
      "timing": "morning",
      "reason": "Low vitamin D levels"
    }
  ],
  "riskAreas": ["Vitamin D deficiency", "..."],
  "nextSteps": ["Retest in 90 days", "..."]
}

Extract ALL biomarkers found in the report. Be thorough and accurate.`,
              },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse analysis" };

    // Store analysis in memory (in production, use a database)
    const id = Date.now().toString();
    
    return NextResponse.json({
      id,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

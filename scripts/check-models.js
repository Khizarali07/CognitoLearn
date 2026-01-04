const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // For listing models, we might need to use the API directly or a specific method if the SDK doesn't expose it easily on the main class
    // The SDK usually has a model manager or similar, but let's try to just use a known model to see if it works, 
    // or use the REST API if SDK fails.
    // Actually, the SDK doesn't have a direct listModels method on the client instance in some versions.
    // Let's try to use the REST API for listing.
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
             console.log(`- ${m.name} (${m.displayName})`);
        }
      });
    } else {
      console.log("No models found or error:", data);
    }
    
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();

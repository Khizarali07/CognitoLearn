const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  console.log("Checking models with key ending in: ..." + process.env.GOOGLE_API_KEY.slice(-4));

  try {
    // For listing models, we might need a model instance or use a specific admin API, 
    // but the SDK usually exposes a way or acts as a client.
    // Actually, usually we test by trying a few known ones if list is hard.
    // But let's try to just generate content with 'gemini-pro' and catch error specifically.
    // Wait, the error message literally says "Call ListModels to see...".
    // The SDK might not expose listModels directly on the main class easily in all versions.
    // Let's try a direct fetch to the endpoint if the SDK doesn't help, 
    // but first let's try a simple generation script with multiple candidates.

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
    
    for (const modelName of modelsToTry) {
      console.log(`\nTesting ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`✅ SUCCESS: ${modelName} worked!`);
        console.log("Response:", response.text());
        return; // Found a working one
      } catch (e) {
        console.log(`❌ FAILED: ${modelName}`);
        console.log(e.message.split('\n')[0]); // Print first line of error
      }
    }
    
    console.log("\nNo models worked.");

  } catch (error) {
    console.error("Fatal error:", error);
  }
}

listModels();

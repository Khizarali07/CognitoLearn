const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        const valid = json.models
          .filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'))
          .map(m => m.name.replace('models/', ''));
        console.log("VALID_MODELS: " + valid.join(", "));
      } else {
        console.log("ERROR: " + JSON.stringify(json));
      }
    } catch (e) { console.log("PARSE_ERROR"); }
  });
});

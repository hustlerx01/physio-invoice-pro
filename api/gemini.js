// api/gemini.js

export default async function handler(req, res) {
  // 1. We only want to handle POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Get the API key securely from Vercel's environment variables.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'API key is not configured.' });
  }

  try {
    // 3. Get the prompt and other data from the frontend's request.
    const { prompt, isJson } = req.body;
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    // 4. Build the payload to send to the Google Gemini API.
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (isJson) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: { type: "ARRAY", items: { type: "STRING" } },
      };
    }

    // 5. Call the Google Gemini API from the server.
    const googleApiResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!googleApiResponse.ok) {
      const errorText = await googleApiResponse.text();
      console.error("Google API Error:", errorText);
      throw new Error(`Google API responded with status: ${googleApiResponse.status}`);
    }

    const result = await googleApiResponse.json();

    // 6. Extract the text and send it back to the frontend.
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const textResponse = result.candidates[0].content.parts[0].text.trim();
      res.status(200).json({ response: textResponse });
    } else {
      throw new Error("Could not extract text from Gemini response.");
    }

  } catch (error) {
    console.error('Error in serverless function:', error);
    res.status(500).json({ message: 'An error occurred on the server.' });
  }
}

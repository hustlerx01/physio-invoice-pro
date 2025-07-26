// api/gemini.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY is not configured in your Vercel environment variables.' });
  }

  try {
    const { prompt, isJson } = req.body;
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (isJson) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: { type: "ARRAY", items: { type: "STRING" } },
      };
    }

    const googleApiResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // If the response from Google is not OK, forward the specific error message
    if (!googleApiResponse.ok) {
      const errorBody = await googleApiResponse.json();
      const errorMessage = errorBody.error?.message || 'An unknown error occurred when contacting the Google API.';
      console.error("Google API Error:", errorMessage);
      return res.status(googleApiResponse.status).json({ message: errorMessage });
    }

    const result = await googleApiResponse.json();

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const textResponse = result.candidates[0].content.parts[0].text.trim();
      res.status(200).json({ response: textResponse });
    } else {
      throw new Error("Could not extract text from Gemini response.");
    }

  } catch (error) {
    console.error('Error in serverless function:', error.message);
    res.status(500).json({ message: 'An error occurred on the server.' });
  }
}

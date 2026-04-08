export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query' });

  const prompt = `You are a precise nutrition database for Indian foods.
The user wants macro info for: "${query}"

Respond ONLY with valid JSON, no explanation, no markdown, no extra text. Format:
{
  "name": "clean food name",
  "emoji": "single relevant emoji",
  "serving_description": "e.g. 2 idli (100g) or 1 cup (200g)",
  "per_serving": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  },
  "note": "one short line e.g. values per 2 medium idli with sambar"
}

Rules:
- Use realistic Indian food nutrition values
- If quantity is mentioned, use that exact quantity as serving
- If no quantity, use a standard single serving
- Round all numbers to nearest integer
- Be accurate for common Indian foods: idli, dosa, sambar, upma, pongal, poha, rice, dal, roti, chapati, paratha, chana, rajma, chole, biryani, chicken curry, egg curry, boiled eggs, oats, banana, milk, curd, paneer, aloo, brinjal, bhindi, palak, fish curry, mutton, keema, pesarattu, vada, uttapam, appam, puttu`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 400 }
      })
    });

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition data' });
  }
}

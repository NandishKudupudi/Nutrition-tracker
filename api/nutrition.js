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
- If quantity is mentioned (e.g. "2 idli"), use that exact quantity as serving
- If no quantity, use a standard single serving
- Round all numbers to nearest integer
- Be accurate for these common Indian foods: idli, dosa, sambar, upma, pongal, poha, rice, dal, roti, chapati, paratha, chana, rajma, chole, biryani, chicken curry, egg curry, boiled eggs, oats, banana, milk, curd, paneer, aloo, brinjal, bhindi, palak, fish curry, mutton, keema, pesarattu, vada, uttapam, appam, puttu`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw = data.content?.map(b => b.text || '').join('').trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition data' });
  }
}

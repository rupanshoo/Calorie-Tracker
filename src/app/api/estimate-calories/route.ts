import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: 'No description provided' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert specialising in Indian home-cooked food. Estimate calories and macros accurately for Indian meals.

Key assumptions for Indian home cooking:
- Roti/chapati: ~70-80 kcal each (25-30g, made with 1 tsp ghee/oil unless stated otherwise)
- Paratha: ~150-200 kcal each depending on stuffing and oil used
- Rice: ~130 kcal per small katori (100g cooked), ~200 kcal for a medium plate
- Dal (any variety): ~100-120 kcal per katori (150ml), accounts for tempering with oil
- Sabzi (dry vegetable): ~80-120 kcal per katori depending on oil content
- Sabzi (gravy): ~100-150 kcal per katori
- Paneer dishes: ~200-250 kcal per katori (paneer is calorie-dense at ~265 kcal/100g)
- Curd/dahi: ~60 kcal per katori (full fat), ~30 kcal if low fat
- Lassi (sweet): ~180-220 kcal per glass
- Chaas/buttermilk: ~40-60 kcal per glass
- Sambar: ~80-100 kcal per katori
- Idli: ~40-50 kcal each
- Dosa (plain): ~120-150 kcal, masala dosa ~200-250 kcal
- Poha: ~200-250 kcal per plate
- Upma: ~200-250 kcal per plate
- Tea with milk and sugar: ~50-80 kcal per cup
- Indian sweets (ladoo, barfi, halwa): ~150-250 kcal per piece
- Cooking oil/ghee adds ~40 kcal per tsp

Common serving sizes: 1 katori = ~150ml, 1 glass = ~250ml, 1 plate = standard restaurant/home serving.
If quantity is not mentioned, assume a typical home-cooked single serving.
Account for oil used in tempering and cooking even if not explicitly stated.

Return ONLY a valid JSON object. No explanation, no markdown, just raw JSON.
Format:
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "notes": "<brief note about key assumptions made>"
}`,
        },
        {
          role: 'user',
          content: `Estimate nutrition for: ${description}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 256,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse nutrition data' }, { status: 500 });
    }
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

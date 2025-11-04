
import { GoogleGenAI, Type } from "@google/genai";
import { Rod, CuttingPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stockRodLength: { type: Type.NUMBER },
          cuts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                length: { type: Type.NUMBER },
              },
            },
          },
          totalCutsLength: { type: Type.NUMBER },
          kerfWaste: { type: Type.NUMBER },
          offcutWaste: { type: Type.NUMBER },
        },
      },
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        totalStockUsedLength: { type: Type.NUMBER },
        totalCutPiecesLength: { type: Type.NUMBER },
        totalKerfWaste: { type: Type.NUMBER },
        totalOffcutWaste: { type: Type.NUMBER },
        totalWaste: { type: Type.NUMBER },
        wastePercentage: { type: Type.NUMBER },
        unfulfilledCuts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    length: { type: Type.NUMBER },
                    quantity: { type: Type.NUMBER }
                }
            }
        }
      },
    },
  },
};

export const generateCuttingPlan = async (
  bladeThickness: number,
  stockRods: Rod[],
  requiredCuts: Rod[]
): Promise<CuttingPlan> => {
  const cleanStockRods = stockRods.map(({ length, quantity }) => ({ length, quantity }));
  const cleanRequiredCuts = requiredCuts.map(({ length, quantity }) => ({ length, quantity }));

  const prompt = `
    You are an expert in industrial optimization, specifically for solving the cutting stock problem to minimize material waste. Your goal is to provide a clear, actionable cutting plan for a workshop.

    Here is the situation:
    - A workshop has a set of stock aluminum rods of various lengths.
    - They need to cut a list of smaller pieces from this stock.
    - The cutting process uses a saw blade with a specific thickness (kerf). Each cut turns this thickness into waste.

    Here is the data for the current job (all units are in centimeters):
    - Blade Thickness (Kerf): ${bladeThickness} cm
    - Available Stock Rods: ${JSON.stringify(cleanStockRods)}
    - Required Cut Pieces: ${JSON.stringify(cleanRequiredCuts)}

    Your task is to:
    1.  Develop an optimal cutting plan that uses the available stock rods to produce the required cut pieces.
    2.  The primary objective is to MINIMIZE the total material waste. Waste is the sum of all blade kerfs and all final leftover rod pieces (offcuts). For each piece cut, one kerf amount of waste is generated.
    3.  Calculate a summary of the operation, including total waste and waste percentage.
    4.  If not all required cuts can be fulfilled from the available stock, list the unfulfilled pieces.
    5.  Provide the output in a structured JSON format according to the provided schema. Do not add any commentary, explanations, or markdown formatting outside of the JSON structure.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as CuttingPlan;
  } catch (error) {
    console.error("Error generating cutting plan:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get a valid plan from the AI. Details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};

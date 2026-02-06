
import { GoogleGenAI, Type } from "@google/genai";
import { Earthquake, AIExplanation, Plate, Volcano } from "../types";

const systemInstruction = `Te egy középiskolai földrajz és földtudomány tanári segéd vagy. 
A feladatod, hogy földtani eseményekről és szerkezetekről adj rövid, pontos és közérthető magyarázatot 14-18 éves diákok számára.

Szigorú szakmai szabályok:
1. Kizárólag magyar nyelven válaszolj.
2. Rövid, pontos, közérthető magyarázatot adj.
3. Különítsd el az eseményadatot/szerkezetet és az általános földtani értelmezést.
4. Tilos bármilyen előrejelzést (predikciót) adni a jövőre nézve.
5. Szigorúan kerüld a pánikkeltő nyelvezetet.
6. Minden következtetésnél jelezd a bizonytalanság mértékét.
7. Tárgyszerű, tanári stílust használj.

A válaszodat szigorúan a megadott JSON sémában add meg.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summaryHu: { 
      type: Type.STRING, 
      description: "Rövid, közérthető összefoglaló az eseményről vagy szerkezetről magyarul." 
    },
    scientificNotesHu: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista a földtani értelmezésekről és megfigyelésekről." 
    },
    uncertainty: { 
      type: Type.STRING, 
      enum: ["low", "medium", "high"],
      description: "A tudományos következtetések bizonytalansági szintje." 
    },
    classroomQuestion: { 
      type: Type.STRING, 
      description: "Egy gondolatébresztő kérdés az osztálytermi vitához." 
    }
  },
  required: ["summaryHu", "scientificNotesHu", "uncertainty", "classroomQuestion"]
};

export const getAIExplanation = async (eq: Earthquake): Promise<AIExplanation> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userPrompt = `Magyarázd el ezt a földrengést tanári szempontból:
Helyszín: ${eq.place}
Magnitúdó: ${eq.mag}
Mélység: ${eq.coordinates[2]} km
Időpont: ${new Date(eq.time).toLocaleString('hu-HU')}
Koordináták: [${eq.coordinates[1]}, ${eq.coordinates[0]}]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Üres válasz az AI-tól.");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Nem sikerült lekérni a tanári magyarázatot.");
  }
};

export const getPlateExplanation = async (plate: Plate): Promise<AIExplanation> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userPrompt = `Magyarázd el a következő tektonikus lemezt középiskolásoknak:
Név: ${plate.name} (${plate.rawName})
A magyarázat térjen ki a lemez típusára (óceáni/kontinentális), szomszédos lemezeire és jellemző határaira (divergens, konvergens, táguló).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Üres válasz az AI-tól.");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Nem sikerült lekérni a lemez magyarázatot.");
  }
};

export const getVolcanoExplanation = async (volcano: Volcano): Promise<AIExplanation> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userPrompt = `Magyarázd el ezt a vulkánt tanári szempontból:
Név: ${volcano.name}
Ország: ${volcano.country}
Típus: ${volcano.type}
Magasság: ${volcano.elevation} m
Koordináták: [${volcano.coordinates[1]}, ${volcano.coordinates[0]}]
A magyarázat térjen ki a vulkán kialakulására (pl. szubdukció vagy forrópont), és ha ismert, a legutóbbi jelentős aktivitására.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Üres válasz az AI-tól.");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Nem sikerült lekérni a vulkán magyarázatot.");
  }
};

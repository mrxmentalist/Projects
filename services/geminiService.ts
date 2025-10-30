import { GoogleGenAI } from "@google/genai";

// The API key is injected from environment variables, no need for manual setup.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Sends a document and a prompt to the Gemini API for analysis.
 * @param documentText The text content of the document.
 * @param prompt The user's query about the document.
 * @returns The generated response text from Gemini.
 */
export async function queryDocument(documentText: string, prompt: string): Promise<string> {
    try {
        const fullPrompt = `
Here is a document:
---
${documentText}
---

Based on the document, please answer the following question: ${prompt}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error querying Gemini API:", error);
        if (error instanceof Error) {
            return `An error occurred while contacting the AI: ${error.message}`;
        }
        return "An unknown error occurred while contacting the AI.";
    }
}

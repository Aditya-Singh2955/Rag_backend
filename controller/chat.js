const ai = require("../gemini");
const getEmedding = require("../getEmbedding");
const index = require("../pinecone");

exports.chat = async (req, res) => {
  try {
    const { question } = req.body;

    const questionEmbedding = await getEmedding(question);

    const result = await index.query({
      vector: questionEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    const context = result.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are AuraAI.

Answer ONLY using the context below.

If the answer is not present, reply:

"I could not find that information in the uploaded document."

Context:
${context}

Question:
${question}
      `,
    });

    res.json({
      answer: response.text,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

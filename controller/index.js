const { PDFParse } = require("pdf-parse");
const getEmbedding = require("../getEmbedding");
const index = require("../pinecone");

const splitTextInChunks = (text, chunkSize = 500) => {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
};

exports.uploadPdf = async (req, res) => {
  /** @type {import('pdf-parse').PDFParse | null} */
  let parser = null;
  try {
    const file = req.file;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    parser = new PDFParse({ data: file.buffer });
    const data = await parser.getText();
    const text = data.text;
    const chunks = splitTextInChunks(text);

    const embeddedChunks = [];
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);

      embeddedChunks.push({
        text: chunk,
        embedding,
      });
    }
    const vectors = embeddedChunks.map((chunk, i) => ({
      id: `chunk-${i}`,
      values: chunk.embedding,
      metadata: {
        text: chunk.text,
      },
    }));
    await index.upsert({ records: vectors });

    res.status(200).json({
      message: "PDF parsed successfully",
      totalChunks: chunks.length,
      totalEmbeddings: embeddedChunks.length,
      sampleChunk: embeddedChunks[0],
    });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    res.status(500).json({ message: "Error uploading PDF" });
  } finally {
    try {
      await parser?.destroy();
    } catch {
      // best-effort cleanup
    }
  }
};

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

(async () => {
  const asst = await client.beta.assistants.retrieve(process.env.ASSISTANT_ID!);
  console.log("Assistant:", asst.id, "-", asst.name);
  const vs = asst.tool_resources?.file_search?.vector_store_ids?.[0];
  if (vs) {
    const files = await client.vectorStores.files.list(vs, { limit: 10 });
    console.log("Vector store:", vs, "files:", files.data.length);
  }
})();

import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";
import { fetchAgentPrompt } from "./prompts/fetch-agent.js";

const chatModel = loadChatModel();

const fetchAgent = async (state: typeof MessagesAnnotation.State) => {

  const prompt = await fetchAgentPrompt.format({
    system_time: new Date().toISOString(),
  });

  const agent = createReactAgent({
    llm: chatModel,
    prompt,
    tools: [],
  });

  const response = await agent.invoke(state);

  return { messages: [response] };
}


const canvasAgent = async () => {
  
}

// Define a new graph. We use the prebuilt MessagesAnnotation to define state:
// https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation
const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  // Define the two nodes we will cycle between
  .addNode("fetchAgent", fetchAgent)
  .addNode("canvasAgent", canvasAgent)
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge("__start__", "fetchAgent")

  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("fetchAgent", "canvasAgent");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});

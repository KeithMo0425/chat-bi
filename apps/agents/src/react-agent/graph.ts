import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, END, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";
import { AnalysisOfIntentionsPrompt, fetchAgentPrompt } from "./prompts/fetch-agent.js";
import { apis } from "./config/apis.js";
import * as z from 'zod'
import { ApiExecutor } from "./tools/apiExecutor.js";

const chatModel = loadChatModel();



interface AnalysisOfIntentionsOutput {
  user_intent: string;
  analysis_details: string;
  matched_apis: {
    api_name: string;
    relevance_score: number;
    match_reason: string;
  }[];
  primary_recommendation: string;
  confidence_level: "high" | "medium" | "low";
}

const structuredOutput = z.object({
  user_intent: z.string().describe("用户意图的简洁描述"),
  analysis_details: z.string().describe("详细的需求分析过程"),
  matched_apis: z.array(z.object({
    api_name: z.string().describe("匹配的API名称"),
    relevance_score: z.number().describe("相关性评分(1-10)"),
    match_reason: z.string().describe("匹配原因说明"),
  })).describe("匹配的API列表"),
  primary_recommendation: z.string().describe("最主要推荐的API名称"),
  confidence_level: z.enum(["high", "medium", "low"]).describe("匹配置信度"),
})

// Graph state
const StateAnnotation = Annotation.Root({
  apiInfo: Annotation<AnalysisOfIntentionsOutput>,
});

const callLLM = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ callLLM ~ state:", state)
  const response = await chatModel.invoke([
    // {
    //   role: 'system',
    //   content: state.messages
    // },
    // {
    //   role: 'user',
    //   content: state.messages[0]?.content ?? '',
    // }
  ]);

  return { messages: [response] };
}

const apiExecutor = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ apiExecutor ~ state:", state)

  const apiInfo = state.apiInfo
  const api = ApiExecutor.getApi(apiInfo.primary_recommendation)
  if (!api) {
    throw new Error(`Api ${apiInfo.primary_recommendation} not found`)
  }

  const result = await new ApiExecutor(api).execute({})

  return { messages: [new AIMessage(result)] };
}

const analysisOfIntentions = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ analysisOfIntentions ~ state:", state)

  const parser = new JsonOutputParser<AnalysisOfIntentionsOutput>();

  const response = await AnalysisOfIntentionsPrompt
    .pipe(chatModel)
    .pipe(parser)
    .invoke({
      format_instructions: z.toJSONSchema(structuredOutput),
      api_list: apis.map(it => ({
        name: it.name,
        description: it.description,
        parameters: z.toJSONSchema(it.parameters),
        response: it.response ? z.toJSONSchema(it.response) : undefined,
      })),
      user_query: state.messages[0] as HumanMessage,
    });

  console.log('response', response)

  return { apiInfo: response }
}

// const fetchAgent = async (state: typeof MessagesAnnotation.State) => {

//   const prompt = await fetchAgentPrompt.format({
//     system_time: new Date().toISOString(),
//   });

//   const agent = createReactAgent({
//     llm: chatModel,
//     prompt,
//     tools: [],
//   });

//   const response = await agent.invoke(state);

//   return { messages: [response] };
// }


// const canvasAgent = async () => {
  
// }

// Define a new graph. We use the prebuilt MessagesAnnotation to define state:
// https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation
const workflow = new StateGraph(StateAnnotation)
  .addNode("callLLM", callLLM)
  .addNode("input", (state) => {
    console.log("🚀 ~ input state:", state)
    return {
      input: state.input,
    }
  })
  // Define the two nodes we will cycle between
  // .addNode("fetchAgent", fetchAgent)
  // .addNode("canvasAgent", canvasAgent)
  .addNode("analysisOfIntentions", analysisOfIntentions)
  .addNode("apiExecutor", apiExecutor)
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge("__start__", "input")
  .addEdge("input", "analysisOfIntentions")
  .addEdge("analysisOfIntentions", "apiExecutor")
  .addEdge("apiExecutor", "callLLM")
  .addEdge("callLLM", "__end__");

  // // This means that after `tools` is called, `callModel` node is called next.
  // .addEdge("analysisOfIntentions", "__end__");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});

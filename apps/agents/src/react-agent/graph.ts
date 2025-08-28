import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, Command, END, MemorySaver, START, StateGraph, interrupt, messagesStateReducer } from "@langchain/langgraph";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ConfigurationSchema } from "./configuration.js";
import { loadChatModel, loadModal } from "./utils.js";
import { AnalysisOfIntentionsPrompt, ExtractParametersPrompt, AnalysisAgentPrompt } from "./prompts/fetch-agent.js";
import { apis } from "./config/apis.js";
import * as z from 'zod'
import { ApiExecutor } from "./utils/apiExecutor.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getMarketingPlan } from "./tools/getMarketingPlan.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const chatModel = loadChatModel();

const analysisModal = loadModal()

interface AnalysisOfIntentionsOutput {
  user_intent: string;
  analysis_details: string;
  matched_apis: {
    api_name: string;
    relevance_score: number;
    match_reason: string;
  }[];
  primary_recommendation: string;
  api_params: Record<string, any>;
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
  api_params: z.record(z.string(), z.any()).describe("API参数"),
  confidence_level: z.enum(["high", "medium", "low"]).describe("匹配置信度"),
})


// Graph state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  apiInfo: Annotation<AnalysisOfIntentionsOutput>,
  apiResult: Annotation<any>,
  secondExtract: Annotation<{
    sourceState: AnalysisOfIntentionsOutput['api_params']
    schema: z.ZodObject<any>
    userInput: string
  }>,
});

const callChatModal = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ callChatModal ~ state:", state)
  const response = await chatModel.invoke(state.messages);

  return { messages: [response] };
}


const client = new MultiServerMCPClient({
  mcpServers: {
    "mcp-server-chart": {
      "command": "npx",
      "args": [
        "-y",
        "@antv/mcp-server-chart"
      ],
      "env": {
        "DISABLED_TOOLS": "generate_district_map,generate_flow_diagram,generate_mind_map,generate_organization_chart"
      }
    }
  }
})

const analysisAgent = async (state: typeof StateAnnotation.State) => {
  const model = loadChatModel();
  // Here we only save in-memory
  const memory = new MemorySaver();


  const agent = createReactAgent({
    llm: model,
    tools: [getMarketingPlan, ...(await client.getTools())],
    checkpointSaver: memory,
    prompt: new SystemMessage(await AnalysisAgentPrompt.format({}))
  });
  // 修复类型不匹配：agent.invoke 期望的参数类型不是 BaseMessage[]，而是 state 或 null
  // 这里直接传递 state 以符合类型要求
  const response = await agent.invoke({ messages: state.messages });
  console.log("🚀 ~ analysisAgent ~ response:", response)

  return response
}

const apiExecutor = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ apiExecutor ~ state:", state)

  const apiInfo = state.apiInfo
  const api = ApiExecutor.getApi(apiInfo.primary_recommendation)
  if (!api) {
    throw new Error(`Api ${apiInfo.primary_recommendation} not found`)
  }

  try {

    const result = await new ApiExecutor(api).execute(apiInfo.api_params)
    return {
      messages: [new SystemMessage({ content: `接口查询结果: ${JSON.stringify(result)}` })],
      secondExtract: null
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      const userInput: string = interrupt({
        questions: error.issues.map(it => it.message),
      });

      console.log("🚀 ~ ApiExecutor ~ execute ~ userInput:", z.toJSONSchema(z.object(api.parameters)))

      return {
        secondExtract: {
          sourceState: apiInfo.api_params ?? {},
          schema: z.toJSONSchema(z.object(api.parameters)),
          userInput
        }
      }
    }
  }

}

const analysisOfIntentions = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ analysisOfIntentions ~ state:", state.secondExtract)

  const parser = new JsonOutputParser<AnalysisOfIntentionsOutput>();

  const response = await AnalysisOfIntentionsPrompt
    .pipe(analysisModal)
    .pipe(parser)
    .invoke({
      format_instructions: z.toJSONSchema(structuredOutput),
      system_time: new Date(),
      api_list: apis.map(it => ({
        name: it.name,
        description: it.description,
        parameters: it.parameters ? z.toJSONSchema(z.object(it.parameters)) : undefined,
        response: it.response ? z.toJSONSchema(z.object(it.response)) : undefined,
      })),
      user_query: state.messages[0] as HumanMessage,
    });

  console.log('response', response)

  return { apiInfo: response }
}

const extractParameters = async (state: typeof StateAnnotation.State) => {
  console.log("🚀 ~ extractParameters ~ state:", state)

  if (!state.secondExtract) {
    return new Command({
      goto: "analysisAgent",
      update: {
        messages: []
      }
    })
  }

  const { schema, userInput } = state.secondExtract ?? {}

  const parser = new JsonOutputParser<AnalysisOfIntentionsOutput>();
  const response = await (await ExtractParametersPrompt)
    .pipe(analysisModal)
    .pipe(parser)
    .invoke({
      format_instructions: schema,
      system_time: new Date(),
      user_input: userInput,
    });
  console.log("🚀 ~ extractParameters ~ response:", response)

  return new Command({
    goto: "apiExecutor",
    update: {
      apiInfo: {
        ...state.apiInfo,
        api_params: {
          ...state.apiInfo.api_params,
          ...(response ?? {}),
        },
      }
    }
  })
  
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
const workflow = new StateGraph(StateAnnotation, ConfigurationSchema)
  .addNode("analysisAgent", analysisAgent)
  // Define the two nodes we will cycle between
  // .addNode("fetchAgent", fetchAgent)
  // .addNode("canvasAgent", canvasAgent)
  .addNode("analysisOfIntentions", analysisOfIntentions)
  .addNode("apiExecutor", apiExecutor)
  .addNode("extractParameters", extractParameters, { ends: [
    "analysisAgent",
    "apiExecutor"
  ] })
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge(START, "analysisOfIntentions")
  .addEdge("analysisOfIntentions", "apiExecutor")
  .addEdge("apiExecutor", "extractParameters")
  .addEdge("analysisAgent", END);

  // // This means that after `tools` is called, `callModel` node is called next.
  // .addEdge("analysisOfIntentions", "__end__");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});

import { BaseMessage, HumanMessage, SystemMessage, AIMessage, isSystemMessage, isHumanMessage, isAIMessage, isToolMessage, ToolMessage } from "@langchain/core/messages";
import { Annotation, Command, END, MemorySaver, START, StateGraph, interrupt, messagesStateReducer, type LangGraphRunnableConfig } from "@langchain/langgraph";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ConfigurationSchema } from "./configuration.js";
import { typedUi, uiMessageReducer } from "@langchain/langgraph-sdk/react-ui/server";
import { loadChatModel, loadModal } from "./utils.js";
import { AnalysisOfIntentionsPrompt, ExtractParametersPrompt, AnalysisAgentPrompt } from "./prompts/fetch-agent.js";
import { apis } from "./config/apis.js";
import * as z from 'zod'
import { ApiExecutor } from "./utils/apiExecutor.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getMarketingPlan, ChartTools } from "./tools/index.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { v4 as uuidv4 } from 'uuid';

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
  thoughtChain: Annotation<{
    key: 'analysisOfIntentions' | 'matchApis' | 'apiExecutor' | 'result' | 'extractParameters'
    title?: string
    status: 'success' | 'error' | 'pending'
    content?: string
  }[]>,
  thoughtProcessId: Annotation<string>,
  // Add the 'ui' field to the state annotation for handling UI messages
  ui: Annotation({ reducer: uiMessageReducer, default: () => [] }),
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


const pushThoughtProcess = async (items: any[], state: typeof StateAnnotation.State, config: LangGraphRunnableConfig) => {
  const ui = typedUi<any>(config);
  // Find the associated message to link the UI update
  const associatedMessage = state.messages.find(
    (msg) => msg.id === state.thoughtProcessId,
  );
  ui.push({
    id: state.thoughtProcessId,
    name: 'ThoughtProcess',
    props: { items },
    metadata: {
      type: 'header'
    }
  }, { message: associatedMessage });
}


const analysisAgent = async (state: typeof StateAnnotation.State) => {
  
  const model = loadChatModel();
  // Here we only save in-memory
  const memory = new MemorySaver();


  const agent = createReactAgent({
    llm: model,
    tools: [getMarketingPlan, ...(ChartTools)],
    checkpointSaver: memory,
    version: 'v2',
    prompt: await AnalysisAgentPrompt.format({ result_data: JSON.stringify(state.apiResult) })
  });
  // 修复类型不匹配：agent.invoke 期望的参数类型不是 BaseMessage[]，而是 state 或 null
  // 这里直接传递 state 以符合类型要求
  const response = await agent.invoke(
    {
      messages:  state.messages
    }
  );

  // 只返回最终的AI分析结果，过滤掉中间处理消息
  // 保留原始用户消息和最终AI回复
  const originalUserMessage = state.messages.find(msg => isHumanMessage(msg));
  const finalAIMessages = response.messages.filter((msg: BaseMessage) => isAIMessage(msg));
  
  // 构建只包含用户消息和最终AI回复的消息数组
  const filteredMessages: BaseMessage[] = [];
  if (originalUserMessage) {
    filteredMessages.push(originalUserMessage);
  }
  // 只取最后一条AI消息作为最终结果
  if (finalAIMessages.length > 0) {
    const lastMessage = finalAIMessages[finalAIMessages.length - 1];
    lastMessage.id = state.thoughtProcessId
    filteredMessages.push(lastMessage);
  }

  return {
    ...response,
    messages: filteredMessages
  }
}

const apiExecutor = async (state: typeof StateAnnotation.State, config: LangGraphRunnableConfig) => {
  console.log("🚀 ~ apiExecutor ~ state:", state)

  const apiInfo = state.apiInfo
  const api = ApiExecutor.getApi(apiInfo.primary_recommendation)
  if (!api) {
    throw new Error(`Api ${apiInfo.primary_recommendation} not found`)
  }

  try {
    void pushThoughtProcess(
      [
        ...(state.thoughtChain ?? []),
        {
          key: 'apiExecutor' as const,
          title: '接口查询',
          status: 'pending' as const,
          content: '查询中...',
        },
      ],
      state,
      config
    )

    // // Find the associated message to link the UI update
    // const associatedMessage = state.messages.find(
    //   (msg) => msg.id === state.thoughtProcessId,
    // );

    // ui.push({
    //   id: state.thoughtProcessId, // Use the same ID to update the existing UI element
    //   name: 'ThoughtProcess',
    //   props: { items: [
    //     ...(state.thoughtChain ?? []),
    //     {
    //       key: 'apiExecutor' as const,
    //       title: '接口查询',
    //       status: 'pending' as const,
    //       content: '查询中...',
    //     },
    //   ]},
    // }, { message: associatedMessage });

    const result = await new ApiExecutor(api).execute(apiInfo.api_params)

    const updatedThoughtChain = [
      ...(state.thoughtChain ?? []),
      {
        key: 'apiExecutor' as const,
        title: '接口查询',
        status: 'success' as const,
        content: `接口查询成功，结果为：\n\`\`\`json\n${JSON.stringify(
          result,
          null,
          2,
        )}\n\`\`\``,
      },
      {
        key: 'done',
        title: '完成',
        status: 'success' as const,
        content: '分析思考完成！',
      }
    ];

    void pushThoughtProcess(
      updatedThoughtChain,
      state,
      config
    )

    return {
      secondExtract: null,
      apiResult: result,
      thoughtChain: updatedThoughtChain,
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      const userInput: string = interrupt({
        questions: error.issues.map(it => `${it.path}:${it.message}`),
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

const analysisOfIntentions = async (state: typeof StateAnnotation.State, config: LangGraphRunnableConfig) => {
  console.log("🚀 ~ analysisOfIntentions ~ state:", state.secondExtract)
  const ui = typedUi<any>(config);

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

  const thoughtProcessId = uuidv4()

  const initialThoughtChain = [
    {
      key: 'analysisOfIntentions' as const,
      title: '用户意图分析',
      content: response.analysis_details,
      status: 'success' as const,
    },
    {
      key: 'matchApis' as const,
      title: 'API 匹配',
      status: 'success' as const,
      content: `
        匹配成功API： ${response.matched_apis?.[0]?.api_name};
        匹配原因： ${response.matched_apis?.[0]?.match_reason};
        匹配得分： ${response.matched_apis?.[0]?.relevance_score};
      `,
    }
  ];

  // Create the AIMessage first to establish a link
  const aiMessage = new AIMessage({
    content: '我正在分析您的请求...',
    id: thoughtProcessId,
  }, {
    status: 'pending',
  });

  // Push the initial state of the thought process UI and associate it with the AIMessage
  ui.push(
    {
      id: thoughtProcessId,
      name: 'ThoughtProcess',
      props: { items: initialThoughtChain },
      metadata: {
        type: 'header'
      }
    },
    { message: aiMessage },
  );

  return {
    // We no longer send the thought chain in the AIMessage content.
    // Instead, we send a simple introductory message.
    messages: [aiMessage],
    apiInfo: response,
    thoughtProcessId,
    thoughtChain: initialThoughtChain,
  };
}

const done = async (state: typeof StateAnnotation.State, config: LangGraphRunnableConfig) => {
  const ui = typedUi<any>(config);
  const doneMessage = new SystemMessage({
    content: '',
    id: 'done:' + uuidv4(),
    response_metadata: {
      status: 'finished',
    }
  }, {
    status: 'success',
  });
  ui.push(
    {
      name: 'DoneDivider',
      props: { },
      metadata: {
        type: 'content'
      }
    },
    { message: doneMessage }
  );
  return {
    messages: doneMessage,
  }
}

const extractParameters = async (state: typeof StateAnnotation.State, config: LangGraphRunnableConfig) => {
  const ui = typedUi<any>(config);

  if (!state.secondExtract) {
    return new Command({
      goto: "analysisAgent",
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

  const params = {
    ...state.apiInfo.api_params,
    ...(response ?? {}),
  }

  const updatedThoughtChain = [
    ...(state.thoughtChain ?? []).filter(
      (step) => step.key !== 'apiExecutor', // Remove the old pending/failed apiExecutor step
    ),
    {
      key: 'extractParameters' as const,
      title: '参数提取',
      status: 'success' as const,
      content: `参数提取成功，参数为：\n\`\`\`json\n${JSON.stringify(
        params,
        null,
        2,
      )}\n\`\`\``,
    },
  ];

  // Find the associated message to link the UI update
  const associatedMessage = state.messages.find(
    (msg) => msg.id === state.thoughtProcessId,
  );

  // Push an update to the ThoughtProcess UI component
  ui.push({
    id: state.thoughtProcessId, // Use the same ID to update
    name: 'ThoughtProcess',
    props: { items: updatedThoughtChain },
    metadata: {
      type: 'header'
    }
  }, { message: associatedMessage });

  return new Command({
    goto: "apiExecutor",
    update: {
      // The AIMessage is no longer needed to display the thought process
      apiInfo: {
        ...state.apiInfo,
        api_params: params,
      },
      thoughtChain: updatedThoughtChain,
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
  .addNode("done", done)
  .addNode("extractParameters", extractParameters, { ends: [
    "analysisAgent",
    "apiExecutor"
  ] })
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge(START, "analysisOfIntentions")
  .addEdge("analysisOfIntentions", "apiExecutor")
  .addEdge("apiExecutor", "extractParameters")
  .addEdge("analysisAgent", "done")
  .addEdge("done", END);

  // // This means that after `tools` is called, `callModel` node is called next.
  // .addEdge("analysisOfIntentions", "__end__");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});

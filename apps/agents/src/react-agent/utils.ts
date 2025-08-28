import { initChatModel } from "langchain/chat_models/universal";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { ChatOpenAI, OpenAI } from "@langchain/openai";

const providerUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1"

/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
export function loadChatModel(): ChatOpenAI {
  // const index = fullySpecifiedName.indexOf("/");
  // const model = fullySpecifiedName.slice(index + 1);
  // return new ChatAlibabaTongyi({
  //   // 此处以qwen-plus为例，您可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
  //   model: "qwen-plus",
  //   temperature: 1,
  //   alibabaApiKey: process.env.ALIBABA_API_KEY,
  //   // other params...
  // });

  return new ChatOpenAI({
    // 此处以qwen-plus为例，您可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    model: "qwen-plus",
    apiKey: process.env.ALIBABA_API_KEY,
    configuration: {
      baseURL: providerUrl,
      // other params...
    },
    // other params...
  });
}

export function loadModal() {
  return new ChatOpenAI({
    model: "qwen-turbo",
    apiKey: process.env.ALIBABA_API_KEY,
    configuration: {
      baseURL: providerUrl,
      // other params...
    },
  })
}
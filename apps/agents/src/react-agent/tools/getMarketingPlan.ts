import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { loadModal } from "../utils.js";
import { GetMarketingPlanPrompt } from "../prompts/fetch-agent.js";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { marketingPlan } from "../config/marketing-plan.js";

const getMarketingPlanParams = z.object({
  requirement: z.string().describe("存在问题。从分析结果中总结需求，并生成营销方案"),
});

const planOutput = z.object({
  ids: z.array(z.string()).describe("营销方案ID"),
})

interface PlanOutput {
  ids: string[]
}

export const getMarketingPlan = tool(
  async (input: { requirement: string }): Promise<Record<string, any>> => {

    const modal = loadModal()
    const parser = new JsonOutputParser<PlanOutput>();

    const response = await GetMarketingPlanPrompt
      .pipe(modal)
      .pipe(parser)
      .invoke({
        user_input: input.requirement,
        marketing_plan_list: marketingPlan,
        format_instructions: z.toJSONSchema(planOutput),
      })

    return response
  },
  {
    name: "getMarketingPlan",
    description: `
      获取营销方案
      - 根据上下文内容提取需要解决的问题，用于匹配相关方案
    `,
    schema: getMarketingPlanParams,
  }
);
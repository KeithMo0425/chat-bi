import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChartPrompt } from '../../prompts/fetch-agent.js'
import { title } from "process";

// Pie chart data schema
const data = z.object({
  category: z.string(),
  value: z.number(),
});

const inputSchema = z.object({
  data: z
    .array(data)
    .describe(
      "Data for pie chart, it should be an array of objects, each object contains a `category` field and a `value` field, such as, [{ category: '分类一', value: 27 }].",
    )
    .nonempty({ message: "Pie chart data cannot be empty." }),
  innerRadius: z
    .number()
    .default(0)
    .describe(
      "Set the innerRadius of pie chart, the value between 0 and 1. Set the pie chart as a donut chart. Set the value to 0.6 or number in [0 ,1] to enable it.",
    ),
  title: z
    .string()
    .optional()
    .describe('chart title'),
});

interface InputType {
  title?: string
  data: {
    category: string
    value: number
  }[],
  innerRadius: number
}

export const generatePie = tool(
  async (input) => {

    const { data, innerRadius, title = '饼图' } = input as InputType
    const reutrnData = {
      type: 'pie',
      data,
      innerRadius
    }

    return ChartPrompt.format({ chart_data: JSON.stringify(reutrnData), title: title })
  },
  {
    name: "generate_pie_chart",
    description: "Generate a pie chart to show the proportion of parts, such as, market share and budget allocation.",
    schema: inputSchema,
    returnDirect: true,
  }
);
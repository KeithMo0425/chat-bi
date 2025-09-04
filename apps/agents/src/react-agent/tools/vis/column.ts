import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChartPrompt } from '../../prompts/fetch-agent.js'

const data = z.object({
  category: z.string(),
  value: z.number(),
  group: z.string().optional(),
});

const inputSchema = z.object({
  data: z
    .array(data)
    .describe(
      "Data for column chart, such as, [{ category: '分类一', value: 10 }, { category: '分类二', value: 20 }], when grouping or stacking is needed for column, the data should contain a `group` field, such as, when [{ category: '北京', value: 825, group: '油车' }, { category: '北京', value: 1000, group: '电车' }].",
    )
    .nonempty({ message: "Column chart data cannot be empty." }),
  group: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Whether grouping is enabled. When enabled, column charts require a 'group' field in the data. When `group` is true, `stack` should be false.",
    ),
  title: z
    .string()
    .optional()
    .describe('chart title'),
});

interface InputType {
  data: {
    time: string
    value: string | number
    group?: string
  }[],
  group?: boolean
  title?: string
}

export const generateColumn = tool(
  async (input) => {

    const { data, group, title = '柱状图' } = input as InputType
    const reutrnData = {
      type: 'column',
      data,
      group,
    }

    return ChartPrompt.format({ chart_data: JSON.stringify(reutrnData), title })
  },
  {
    name: "generate_column_chart",
    description: "Generate a column chart, which are best for comparing categorical data, such as, when values are close, column charts are preferable because our eyes are better at judging height than other visual elements like area or angles.",
    schema: inputSchema,
  }
);
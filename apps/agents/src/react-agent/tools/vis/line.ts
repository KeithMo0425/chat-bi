import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChartPrompt } from '../../prompts/fetch-agent.js'

const data = z.object({
  time: z.string(),
  value: z.number(),
});


const inputSchema = z.object({
  data: z
  .array(data)
  .describe(
    "Data for line chart, it should be an array of objects, each object contains a `time` field and a `value` field, such as, [{ time: '2015', value: 23 }, { time: '2016', value: 32 }].",
  )
  .nonempty({ message: "Line chart data cannot be empty." }),
  title: z
    .string()
    .optional()
    .describe('chart title'),
});

interface InputType {
  data: {
    time: string
    value: number
  }[],
  title?: string
}

export const generateLine = tool(
  async (input) => {

    const { data, title = '折线图' } = input as InputType
    const reutrnData = {
      type: 'line',
      data,
    }

    return ChartPrompt.format({ chart_data: JSON.stringify(reutrnData), title })
  },
  {
    name: "generate_line_chart",
    description: "Generate a line chart to show trends over time, such as, the ratio of Apple computer sales to Apple's profits changed from 2000 to 2016.",
    schema: inputSchema,
    returnDirect: true,
  }
);
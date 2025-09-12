import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChartPrompt } from '../../prompts/fetch-agent.js'


const inputSchema = z.object({
  data: z
    .array(z.number())
    .describe(
      "Data for histogram chart, it should be an array of numbers, such as, [78, 88, 60, 100, 95].",
    )
    .nonempty({ message: "Histogram chart data cannot be empty." }),
  binNumber: z
    .number()
    .optional()
    .describe(
      "Number of intervals to define the number of intervals in a histogram, when not specified, a built-in value will be used.",
    ),
  title: z
    .string()
    .optional()
    .describe('chart title'),
});

interface InputType {
  data: number[],
  binNumber?: number
  title?: string
}

export const generateHistogram = tool(
  async (input) => {

    const { data, binNumber, title = '直方图' } = input as InputType
    const reutrnData = {
      type: 'histogram',
      data,
      binNumber,
    }

    return ChartPrompt.format({ chart_data: JSON.stringify(reutrnData), title })
  },
  {
    name: "generate_histogram_chart",
    description: "Generate a histogram chart to show the frequency of data points within a certain range. It can observe data distribution, such as, normal and skewed distributions, and identify data concentration areas and extreme points.",
    schema: inputSchema,
    returnDirect: true,
  }
);
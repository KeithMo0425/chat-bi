import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChartPrompt } from '../../prompts/fetch-agent.js'

const data = z.object({
  time: z.string(),
  value: z.number(),
  group: z.string().optional(),
});


const inputSchema = z.object({
  data: z
    .array(data)
    .describe("Data for area chart, such as, [{ time: '2018', value: 99.9 }].")
    .nonempty({ message: "Area chart data cannot be empty." }),
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
  title?: string
}

export const generateArea = tool(
  async (input) => {

    const { data, title = '区域图'} = input as InputType
    const reutrnData = {
      type: 'area',
      data,
    }
    
    return ChartPrompt.format({ chart_data: JSON.stringify(reutrnData), title })
  },
  {
    name: "generate_area_chart",
    description: "Generate a area chart to show data trends under continuous independent variables and observe the overall data trend, such as, displacement = velocity (average or instantaneous) × time: s = v × t. If the x-axis is time (t) and the y-axis is velocity (v) at each moment, an area chart allows you to observe the trend of velocity over time and infer the distance traveled by the area's size.",
    schema: inputSchema,
  }
);
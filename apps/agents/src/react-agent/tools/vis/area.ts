import { tool } from "@langchain/core/tools";
import * as z from "zod";

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
});

interface InputType {
  data: {
    time: string
    value: string | number
    group?: string
  }[]
}


export const generateArea = tool(
  async (input: InputType) => {

    const { data } = input
    const reutrnData = {
      type: 'area',
      data,
    }
    
    return `
      \`\`\`vis-chart
        ${JSON.stringify(reutrnData, null, 2)}
      \`\`\`
    `
  },
  {
    name: "generate_area_chart",
    description: "Generate a area chart to show data trends under continuous independent variables and observe the overall data trend, such as, displacement = velocity (average or instantaneous) × time: s = v × t. If the x-axis is time (t) and the y-axis is velocity (v) at each moment, an area chart allows you to observe the trend of velocity over time and infer the distance traveled by the area's size.",
    schema: inputSchema,
  }
);
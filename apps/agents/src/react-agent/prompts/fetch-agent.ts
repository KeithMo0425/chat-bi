import { PromptTemplate } from "@langchain/core/prompts";

export const ChartPrompt = PromptTemplate.fromTemplate(
`
### {title}
\`\`\`vis-chart
  {chart_data}
\`\`\`
`
)
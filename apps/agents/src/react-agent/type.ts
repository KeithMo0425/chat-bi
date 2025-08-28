import * as zod from "zod";

export interface Api {
  name: string;
  apiUrl: string;
  apiMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters?: Record<string, zod.ZodTypeAny>
  response?: Record<string, zod.ZodTypeAny>
  mockData?: () => any
}

export interface MarketingPlan {
  id: string
  /* 方案名称 */
  name: string
  /* 方案描述 */
  description: string
  /* 触发条件 */
  triggeringCondition: string
  /* 示例 */
  example?: string
}
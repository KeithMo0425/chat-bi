import * as zod from "zod";

export interface Api {
  name: string;
  apiUrl: string;
  apiMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: zod.ZodObject<any>
  response?: zod.ZodObject<any>
  mockData?: () => any
}
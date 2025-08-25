import * as zod from "zod";
import { Api } from "../type.js";
import { apis } from "../config/apis.js";

const enableMock = true

export class ApiExecutor {
  constructor(private readonly api: Api) {
  }

  static getApi(name: string) {
    return apis.find(it => it.name === name)
  }

  async execute(params: zod.z.infer<typeof this.api.parameters>) {
    const schema = this.api.parameters
    const validatedParams = schema.parse(params)

    if (enableMock) {
      return this.api.mockData?.()
    }

    const response = await fetch(this.api.apiUrl, {
      method: this.api.apiMethod,
      body: JSON.stringify(validatedParams),
    })

    const data = await response.json()
    return data
  }
}

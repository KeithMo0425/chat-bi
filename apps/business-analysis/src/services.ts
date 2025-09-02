import { ACCESS_TOKEN_KEY } from "./config";

export const getAnalyzeData = async (data: Record<string, any>) => {
  const res = await fetch(`${import.meta.env.PUBLIC_SERVER_HOST}/AIServer/api/v1/DataAnalyze/AnalyzeDataTask`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? '',
    },
  }).then(res => res.json())

  if (res?.ResponseStatus?.ErrorCode !== '0') {
    throw new Error(res?.ResponseStatus?.Message)
  }

  return res?.Data?.Content
}
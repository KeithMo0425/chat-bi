import { Divider, Typography } from 'antd'

export function DoneDivider() {
console.log("🚀 ~ DoneDivider ~ DoneDivider:")

  return (
    <Divider plain>
      <Typography.Text type='secondary'>完成</Typography.Text>
    </Divider>
  )
}
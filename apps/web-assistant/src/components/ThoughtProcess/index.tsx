import { CheckCircleOutlined, InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import { ThoughtChain, ThoughtChainProps } from "@ant-design/x"
import { Markdown } from "../Markdown"
import { Collapse } from "antd"
import { createStyles } from "antd-style"
import { useEffect, useState } from "react"

const useStyles = createStyles(({ css }) => {
  return {
    collapse: css`
      .ant-collapse-header {
        padding: 0;
      }
    `
  }
})


export function ThoughtProcess(props: ThoughtChainProps) {
  const { items, ...restProps } = props

  const { styles } = useStyles()
  const [open, setOpen] = useState(true)

  const iconMap = {
    pending: <LoadingOutlined />,
    success: <CheckCircleOutlined />,
    error: <InfoCircleOutlined />,
  }

  const formatItems = items?.map((it) => {
    return {
      ...it,
      icon: iconMap[it.status as keyof typeof iconMap],
      content: <div style={{ width: '400px' }}><Markdown content={it.content || ''} /></div>,
    }
  })

  useEffect(() => {
    const done = !!formatItems?.find((it) => it.key === 'done')
   
    if (done) {
      setTimeout(() => {
        setOpen(false)
      }, 2000)
    }
    
  }, [items])
  


  return (
    <Collapse
      ghost
      // defaultActiveKey={[1]}
      activeKey={open ? [1] : []}
      className={styles.collapse}
      onChange={(key) => {
        console.log("🚀 ~ key:", key)
        if (key.length > 0) {
          setOpen(true)
        } else {
          setOpen(false)
        }
      }}
      items={[
        {
          key: 1,
          label: '思考过程',
          style: {
            padding: 0
          },
          children: (
            <div>
              <ThoughtChain {...restProps} size="small"  items={formatItems}/>
            </div>
          )
        }
      ]}
    />
  )
}
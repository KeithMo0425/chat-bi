import { CheckCircleOutlined, CopyOutlined, DislikeOutlined, InfoCircleOutlined, LikeOutlined, LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { Bubble, BubbleProps, ThoughtChain, ThoughtChainProps } from "@ant-design/x";
import type { BubbleDataType } from "@ant-design/x/es/bubble/BubbleList";
import type { MessageInfo } from "@ant-design/x/es/use-x-chat";
import { ChartType, Line, withChartCode, Area, Bar, Column, Histogram, Pie, withDefaultChartCode, GPTVis } from "@antv/gpt-vis";
import { Button, Space, Spin, Image, Avatar, Collapse } from "antd";
import { createStyles } from "antd-style";
import { useStreamContext } from '@/providers/Stream';
import { LoadExternalComponent } from '@langchain/langgraph-sdk/react-ui';
import { Markdown } from '@/components/Markdown';
import { ThoughtProcess } from '@/components/ThoughtProcess';

import { useThreads } from "@/providers/Thread";
import { useEffect } from "react";

const clientComponents = {
  ThoughtProcess,
};


const AGENT_PLACEHOLDER = '生成内容中，请稍等...';

const useStyles = createStyles(({ css }) => {

  return {

    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,

    bubbleItem: css`
      padding: 0;
    `,
   
    collapse: css`
      .ant-collapse-header {
        padding: 0 !important;
      }
    `
  }
});



export function List({
  messages,
}: {
  messages: MessageInfo<BubbleDataType>[];
}) {
  const { getThreads } = useThreads();
  const { styles } = useStyles();
  const stream = useStreamContext()
  
  useEffect(() => {
    getThreads().then((threads) => {
      console.log("🚀 ~ List ~ threads:", threads)
    })
  }, [])


  const renderHeader = (content: string, message: any) => {
    // Find all UI messages associated with this regular message
    const associatedUis = stream.values?.ui?.filter((ui) => ui.metadata?.message_id === message.key) ?? [];
    if (associatedUis.length <= 0) {
    return null;
    }


    return associatedUis.map((ui) => (
      <div key={ui.id} style={{ marginTop: '8px' }}>
        <LoadExternalComponent
          stream={stream}
          message={ui}
          components={clientComponents}
          fallback={<div>Loading UI Component...</div>}
        />
      </div>
    ))

    
    // return (
    //   <Collapse
    //     ghost
    //     defaultActiveKey={[1]}
    //     className={styles.collapse}
    //     items={[
    //       {
    //         key: 1,
    //         label: '思考过程',
    //         style: {
    //           padding: 0
    //         },
    //         children: (
    //           <div>
    //             {associatedUis.map((ui) => (
    //               <div key={ui.id} style={{ marginTop: '8px' }}>
    //                 <LoadExternalComponent
    //                   stream={stream}
    //                   message={ui}
    //                   components={clientComponents}
    //                   fallback={<div>Loading UI Component...</div>}
    //                 />
    //               </div>
    //             ))}
    //           </div>
    //         )
    //       }
    //     ]}
    //   />
    // );
  };


  return (
    <Bubble.List
      style={{ height: '100%', paddingInline: 16 }}
      items={messages?.map((i) => ({
        ...i,
        id: String(i.id), // Fix: Ensure ID is a string
        messageRender: (content) => <Markdown content={content} />,
        header: renderHeader,
        className: styles.bubbleItem,
        style: {
          padding: 0
        },
        variant: "outlined",
      }))}
      roles={{
        ai: {
          placement: 'start',
          footer: (
            <div style={{ display: 'flex' }}>
              <Button type="text" size="small" icon={<ReloadOutlined />} />
              <Button type="text" size="small" icon={<CopyOutlined />} />
              <Button type="text" size="small" icon={<LikeOutlined />} />
              <Button type="text" size="small" icon={<DislikeOutlined />} />
            </div>
          ),
          avatar: <Avatar>AI</Avatar>,
          loadingRender: () => (
            <Space>
              <Spin size="small" />
              {AGENT_PLACEHOLDER}
            </Space>
          ),
        },
        system: { placement: 'start', avatar: <Avatar>sys</Avatar> },
        human: { placement: 'end', avatar: <Avatar>humn</Avatar> },
      }}
    />
  )
}
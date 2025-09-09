import { CheckCircleOutlined, CopyOutlined, DislikeOutlined, InfoCircleOutlined, LikeOutlined, LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { Bubble, BubbleProps, ThoughtChain, ThoughtChainProps } from "@ant-design/x";
import type { BubbleDataType } from "@ant-design/x/es/bubble/BubbleList";
import type { MessageInfo } from "@ant-design/x/es/use-x-chat";
import { ChartType, Line, withChartCode, Area, Bar, Column, Histogram, Pie, withDefaultChartCode, GPTVis } from "@antv/gpt-vis";
import { Button, Space, Spin, Image, Avatar, Collapse } from "antd";
import { createStyles } from "antd-style";
import { useStreamContext } from '@/providers/Stream';
import { Markdown } from '@/components/Markdown';
import { LoadExternalComponent } from '@/components/client';

import { useThreads } from "@/providers/Thread";
import { useCallback, useEffect, useMemo } from "react";
import { UIMessage } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";


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
      .ant-collapse-header {
        padding: 0;
      }
    `,
   
    collapse: css`
      .ant-collapse-header {
        padding: 0 !important;
      }
    `,

    systemBubbleItem: css`
      .ant-bubble-content {
        padding: 0;
        border: none;
        width: 100%;
      }
    `,
  }
});

type UIPosition = 'header' | 'content' | 'footer';

export function List() {
  const { styles } = useStyles();
  const stream = useStreamContext()
  const { messages, values } = stream

  const uiGroups: Record<UIPosition, UIMessage[]> | undefined = useMemo(() => {
    return values?.ui?.reduce((acc, ui) => {
      acc[ui.metadata?.type as UIPosition] = acc[ui.metadata?.type as UIPosition] ?? [];
      acc[ui.metadata?.type as UIPosition].push(ui);
      return acc;
    }, {} as Record<UIPosition, UIMessage[]>);
  }, [values])
  
  const renderHeader = useCallback((content: string, message: any) => {
    // Find all UI messages associated with this regular message
    const associatedUis = uiGroups?.['header']?.filter((ui) => ui.metadata?.message_id === message.key) ?? [];
    if (associatedUis.length <= 0) {
      return null;
    }

    return associatedUis.map((ui) => (
      <div key={ui.id} style={{ marginTop: '8px' }}>
        <LoadExternalComponent ui={ui} />
      </div>
    ))
  }, [uiGroups]);

  const renderAiContent = useCallback((info: Message) => {
    const associatedUis = uiGroups?.['content']?.filter((ui) => ui.metadata?.message_id === info.id) ?? [];
    if (associatedUis.length <= 0) {
      return <Markdown content={info.content as string} />;
    }
    return associatedUis.map((ui) => (
      <LoadExternalComponent ui={ui} />
    ))
  }, [uiGroups]);

  const renderSysContent = useCallback((info: Message) => {
    const associatedUis = uiGroups?.['content']?.filter((ui) => ui.metadata?.message_id === info.id) ?? [];
    if (associatedUis.length <= 0) {
      return info.content
    }
    return associatedUis.map((ui) => (
      <LoadExternalComponent ui={ui} />
    ))
  }, [uiGroups]);

  const messagesFormated = useMemo(() => {
    return messages?.filter((i) => i.type !== 'tool').map((i) => {

      const commons = {
        ...i,
        role: i.type,
        key: i.id,
        id: String(i.id), // Fix: Ensure ID is a string
        className: styles.bubbleItem,
        variant: "outlined",
      }

      if (i.type === 'ai') {
        return {
          ...commons,
          content: i,
          messageRender: renderAiContent,
          header: renderHeader,
        }
      } else if (i.type === 'human') {
        return {
          ...commons,
        }
      } else if (i.type === 'system') {
        return {
          ...commons,
          className: styles.systemBubbleItem,
          content: i,
          messageRender: renderSysContent,
        }
      }

    }) ?? []
  }, [messages, renderHeader, renderSysContent, renderAiContent])


  return (
    <Bubble.List
      style={{ height: '100%', paddingInline: 16 }}
      items={messagesFormated}
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
        // system: { placement: 'start', avatar: <Avatar>sys</Avatar> },
        human: { placement: 'end', avatar: <Avatar>humn</Avatar> },
      }}
    />
  )
}
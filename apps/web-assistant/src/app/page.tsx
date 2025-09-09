'use client'

import { StreamProvider, useStreamContext } from '@/providers/Stream';
import { ThreadProvider, useThreads } from '@/providers/Thread';
import {
  AppstoreAddOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DislikeOutlined,
  LikeOutlined,
  OpenAIFilled,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  ReloadOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  type AttachmentsProps,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Suggestion,
  Welcome,
  useXAgent,
  useXChat,
} from '@ant-design/x';
import type { Conversation } from '@ant-design/x/es/conversations';
import { Message, Interrupt } from '@langchain/langgraph-sdk';
import { Button, GetProp, GetRef, Image, Popover, Space, Spin, message, Input, Form, type FormProps } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { BubbleList } from '@/components/BubbleList';
import { useQueryState } from 'nuqs';
import { ChatSender } from './ChatSender';
import { sleep } from "../utils/tools";

import {
  ensureToolCallsHaveResponses,
} from "@/utils/ensure-tool-responses";

type BubbleDataType = {
  role: string;
  content: string;
};

const MOCK_SESSION_LIST = [
  {
    key: '5',
    label: 'New session',
    group: 'Today',
  },
  {
    key: '4',
    label: 'What has Ant Design X upgraded?',
    group: 'Today',
  },
  {
    key: '3',
    label: 'New AGI Hybrid Interface',
    group: 'Today',
  },
  {
    key: '2',
    label: 'How to quickly install and import components?',
    group: 'Yesterday',
  },
  {
    key: '1',
    label: 'What is Ant Design X?',
    group: 'Yesterday',
  },
];


const MOCK_QUESTIONS = [
  '查询今天的商品销售数据',
  '查询今天的新增会员数据',
  '查询今天的会员统计数据',
  '查询今天的币单价',
  '查询今天的行业平均币单价',
  '查询今天的商品销售数据按分类分组',
  '查询今天的商品销售数据按商品分类分组',
];

const useCopilotStyle = createStyles(({ token, css }) => {
  return {
    copilotChat: css`
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: ${token.colorBgContainer};
      color: ${token.colorText};
    `, 
    // chatHeader 样式
    chatHeader: css`
      height: 52px;
      box-sizing: border-box;
      border-bottom: 1px solid ${token.colorBorder};
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px 0 16px;
    `,
    headerTitle: css`
      font-weight: 600;
      font-size: 15px;
    `,
    headerButton: css`
      font-size: 18px;
    `,
    conversations: css`
      width: 300px;
      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    // chatList 样式
    chatList: css`
      overflow: auto;
      padding-block: 16px;
      flex: 1;
    `,
    chatWelcome: css`
      margin-inline: 16px;
      padding: 12px 16px;
      border-radius: 2px 12px 12px 12px;
      background: ${token.colorBgTextHover};
      margin-bottom: 16px;
    `,
    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
   
  };
});

interface CopilotProps {
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
}

type FieldType = {
  userInput?: string;
};

const InterruptPrompt = ({ questions, onSubmit }: { questions: string[], onSubmit: (values: FieldType) => void }) => {
  console.log("🚀 ~ InterruptPrompt ~ questions:", questions)
  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    onSubmit(values)
  };

  return <div style={{ marginBottom: 12, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
    <p>{ questions?.join(', ')}</p>
    <Form
      name="basic"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        name="userInput"
        rules={[{ required: true, message: 'Please provide the required information!' }]}
      >
        <Input.TextArea autoSize={{ minRows: 2 }} placeholder="Please provide the required information..." />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Submit
        </Button>
      </Form.Item>
    </Form>
  </div>
}


const Chat = () => {
  const [copilotOpen, setCopilotOpen] = useState(true);
  const { styles } = useCopilotStyle();
  const abortController = useRef<AbortController>(null);
  const [threadId, setThreadId] = useQueryState("threadId");

  // ==================== State ====================

  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});

  const [sessionList, setSessionList] = useState<Conversation[]>(MOCK_SESSION_LIST);
  const [curSession, setCurSession] = useState(sessionList[0].key);

  /**
   * 🔔 Please replace the BASE_URL, PATH, MODEL, API_KEY with your own values.
   */

  // ==================== Runtime ====================

  const stream = useStreamContext();
  const { messages } = stream

  

  const loading = stream.isLoading;


  const handleUserSubmit = async (input: string) => {
    if (!input.trim() || loading) return;

    if (stream.messages[stream.messages.length - 1]?.response_metadata?.status === 'finished') {
      const thread = await stream.client.threads.create()
      console.log("🚀 ~ handleUserSubmit ~ thread:", thread)
      await setThreadId(thread.thread_id);
      await sleep();
    }
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

  };


  // ==================== Event ====================
  // const handleUserSubmit = (val: string) => {
  //   onRequest({
  //     stream: true,
  //     assistantId: "agent",
  //     threadId: threadId,
  //     message: { id: uuidv4(), type: "human", content: val },
  //   });

  //   // session title mock
  //   if (sessionList.find((i) => i.key === curSession)?.label === 'New session') {
  //     setSessionList(
  //       sessionList.map((i) => (i.key !== curSession ? i : { ...i, label: val?.slice(0, 20) })),
  //     );
  //   }
  // };


  // ==================== Nodes ====================
  const chatHeader = (
    <div className={styles.chatHeader}>
      <div className={styles.headerTitle}>✨ AI Copilot</div>
      <Space size={0}>
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={() => {
            if (messages?.length) {
              const timeNow = dayjs().valueOf().toString();
              abortController.current?.abort();
              // The abort execution will trigger an asynchronous requestFallback, which may lead to timing issues.
              // In future versions, the sessionId capability will be added to resolve this problem.
              setTimeout(() => {
                setSessionList([
                  { key: timeNow, label: 'New session', group: 'Today' },
                  ...sessionList,
                ]);
                setCurSession(timeNow);
                // setMessages([]);
              }, 100);
            } else {
              message.error('It is now a new conversation.');
            }
          }}
          className={styles.headerButton}
        />
        <Popover
          placement="bottom"
          styles={{ body: { padding: 0, maxHeight: 600 } }}
          content={
            <Conversations
              items={sessionList?.map((i) =>
                i.key === curSession ? { ...i, label: `[current] ${i.label}` } : i,
              )}
              activeKey={curSession}
              groupable
              onActiveChange={async (val) => {
                abortController.current?.abort();
                // The abort execution will trigger an asynchronous requestFallback, which may lead to timing issues.
                // In future versions, the sessionId capability will be added to resolve this problem.
                setTimeout(() => {
                  setCurSession(val);
                  // setMessages(messageHistory?.[val] || []);
                }, 100);
              }}
              styles={{ item: { padding: '0 8px' } }}
              className={styles.conversations}
            />
          }
        >
          <Button type="text" icon={<CommentOutlined />} className={styles.headerButton} />
        </Popover>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => setCopilotOpen(false)}
          className={styles.headerButton}
        />
      </Space>
    </div>
  );
  const chatList = (
    <div className={styles.chatList}>
      {messages?.length ? (
        /** 消息列表 */
        <BubbleList />
      ) : (
        /** 没有消息时的 welcome */
        <>
          <Welcome
            variant="borderless"
            title="👋 Hello, 我是油菜花 AI 问数助手"
            description="我可以帮你快速获取数据，并进行分析"
            className={styles.chatWelcome}
          />

          <Prompts
            title="我可以帮您："
            items={MOCK_QUESTIONS.map((i) => ({ key: i, description: i }))}
            onItemClick={(info) => handleUserSubmit(info?.data?.description as string)}
            wrap
            style={{
              marginInline: 16,
            }}
            styles={{
              title: { fontSize: 14 },
            }}
          />
        </>
      )}
    </div>
  );
 

  useEffect(() => {
    // history mock
    if (messages?.length) {
      setMessageHistory((prev) => ({
        ...prev,
        [curSession]: messages,
      }));
    }
  }, [messages]);

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f0f2f5' }}>
      <div className={styles.copilotChat} style={{ width: copilotOpen ? 600 : 0 }}>
        {/** 对话区 - header */}
        {chatHeader}

        {/** 对话区 - 消息列表 */}
        {chatList}

        {/** 对话区 - 输入框 */}
        <ChatSender onSubmit={handleUserSubmit}/>
      </div>
    </div>
  );
}


const Home = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <Chat />
      </StreamProvider>
    </ThreadProvider>
  );
};



export default Home;

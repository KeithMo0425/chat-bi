import { AppstoreAddOutlined, OpenAIFilled, PaperClipOutlined, ProductOutlined, ScheduleOutlined } from "@ant-design/icons";
import { Sender, Suggestion } from "@ant-design/x";
import { Button } from "antd";
import { useStreamContext } from '@/providers/Stream';
import { createStyles } from "antd-style";
import { useRef, useState } from "react";
import { InterruptPrompt } from "./InterruptPrompt";


const MOCK_SUGGESTIONS = [
  { label: 'Write a report', value: 'report' },
  { label: 'Draw a picture', value: 'draw' },
  {
    label: 'Check some knowledge',
    value: 'knowledge',
    icon: <OpenAIFilled />,
    children: [
      { label: 'About React', value: 'react' },
      { label: 'About Ant Design', value: 'antd' },
    ],
  },
];

const useStyles = createStyles(({ css, token }) => {
  return {
    // chatSend 样式
    chatSend: css`
     padding: 12px;
   `,
   sendAction: css`
     display: flex;
     align-items: center;
     margin-bottom: 12px;
     gap: 8px;
   `,
   speechButton: css`
     font-size: 18px;
     color: ${token.colorText} !important;
   `,
  }
})

export function ChatSender({
  onSubmit,
}: {
  onSubmit: (message: string) => void;
}) {
  const stream = useStreamContext();
  const loading = stream.isLoading;

  const { styles } = useStyles()

  const [inputValue, setInputValue] = useState('');
  const abortController = useRef<AbortController>(null);

  return (
    <div className={styles.chatSend}>
      <div className={styles.sendAction}>
        <Button
          icon={<ScheduleOutlined />}
          onClick={() => onSubmit('What has Ant Design X upgraded?')}
        >
          Upgrades
        </Button>
        <Button
          icon={<ProductOutlined />}
          onClick={() => onSubmit('What component assets are available in Ant Design X?')}
        >
          Components
        </Button>
        <Button icon={<AppstoreAddOutlined />}>More</Button>
      </div>


      <InterruptPrompt />

      {/** 输入框 */}
      <Suggestion items={MOCK_SUGGESTIONS} onSelect={(itemVal) => setInputValue(`[${itemVal}]:`)}>
        {({ onTrigger, onKeyDown }) => (
          <Sender
            loading={loading}
            value={inputValue}
            onChange={(v) => {
              onTrigger(v === '/');
              setInputValue(v);
            }}
            onSubmit={(message) => {
              if (!message.trim()) return;

              onSubmit(inputValue);
              setInputValue('');
            }}
            onCancel={() => {
              abortController.current?.abort();
            }}
            allowSpeech
            placeholder="Ask or input / use skills"
            onKeyDown={onKeyDown}
            // header={sendHeader}
            // prefix={
            //   <Button
            //     type="text"
            //     icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            //     onClick={() => setAttachmentsOpen(!attachmentsOpen)}
            //   />
            // }
            // onPasteFile={onPasteFile}
            actions={(_, info) => {
              const { SendButton, LoadingButton, SpeechButton } = info.components;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SpeechButton className={styles.speechButton} />
                  {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
                </div>
              );
            }}
          />
        )}
      </Suggestion>
    </div>
  )
}
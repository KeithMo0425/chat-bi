import { CopyOutlined, DislikeOutlined, LikeOutlined, ReloadOutlined } from "@ant-design/icons";
import { Bubble, BubbleProps } from "@ant-design/x";
import type { BubbleDataType } from "@ant-design/x/es/bubble/BubbleList";
import type { MessageInfo } from "@ant-design/x/es/use-x-chat";
import { Button, Space, Spin, Image } from "antd";
import { createStyles } from "antd-style";
// import markdownit from 'markdown-it';

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// const md = markdownit({ html: true, breaks: true });

const mdComponents = {
  img(props: any) {
    const {node, ...rest} = props
    return <Image {...rest} />
  }
}

const renderMarkdown = (styles: any): BubbleProps['messageRender'] => (content) => {
  console.log('content', content);
  return (
    <div
      className={styles.markdownContent}
    >
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={mdComponents}
    >
      {content}
    </Markdown>
    </div>

    // <Typography>
    //   {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
    //   <div 
    //     className={styles.markdownContent}
    //     dangerouslySetInnerHTML={{ __html: md.render(content) }} 
    //   />
    // </Typography>
  );
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
    
    markdownContent: css`
      img {
        max-width: 100%;
        height: auto;
        width: auto;
        display: block;
        margin: 8px 0;
      }
      
      /* 可选：固定宽度样式 */
      .fixed-width img {
        width: 300px;
        max-width: 100%;
      }
      
      .small img {
        width: 150px;
        max-width: 100%;
      }
      
      .medium img {
        width: 400px;
        max-width: 100%;
      }
      
      .large img {
        width: 600px;
        max-width: 100%;
      }
    `,
  }
});


export function List({
  messages,
}: {
  messages: MessageInfo<BubbleDataType>[];
}) {

  const { styles } = useStyles();

  return (
    <Bubble.List
      style={{ height: '100%', paddingInline: 16 }}
      items={messages?.map((i) => ({
        ...i,
        messageRender: renderMarkdown(styles),
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
          loadingRender: () => (
            <Space>
              <Spin size="small" />
              {AGENT_PLACEHOLDER}
            </Space>
          ),
        },
        system: { placement: 'start' },
        human: { placement: 'end' },
      }}
    />
  )
}
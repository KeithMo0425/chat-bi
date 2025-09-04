import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Image } from 'antd'
import { Area, Bar, ChartType, Column, Histogram, Line, Pie, withChartCode } from '@antv/gpt-vis';
import { createStyles } from 'antd-style';
import 'github-markdown-css/github-markdown-light.css'

const CodeBlock = withChartCode({
  components: {
    [ChartType.Line]: Line,
    [ChartType.Area]: Area,
    [ChartType.Bar]: Bar,
    [ChartType.Column]: Column,
    [ChartType.Histogram]: Histogram,
    [ChartType.Pie]: Pie
  },
});

const mdComponents = {
  img(props: any) {
    const {node, ...rest} = props
    return <Image {...rest} />
  },
  code: CodeBlock
}

const useStyles = createStyles(({ css }) => {

  return {
    markdownContent: css`
      width: 100%;
      /* background-color: rgba(0,0,0,0.06); */

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
    `
  }
})

export function Markdown({ content }: { content: string }) {
  const { styles, cx } = useStyles();
  return (
    <div className={cx(styles.markdownContent, 'markdown-body')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={mdComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
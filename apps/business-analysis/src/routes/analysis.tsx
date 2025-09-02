import { createFileRoute } from '@tanstack/react-router'

import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { PageContainer } from '../components'
import dayjs from 'dayjs'
import { getAnalyzeData } from '../services'
// 移除与本地 Skeleton 组件冲突的导入
import { Skeleton } from "../components/ui/skeleton"
import { ACCESS_TOKEN_KEY } from '../config';

const dateMap = {
  yesterday: [dayjs().subtract(1, 'day').startOf('day').unix(), dayjs().subtract(1, 'day').endOf('day').unix()],
  month: [dayjs().startOf('month').unix(), dayjs().endOf('month').unix()],
  lastweek: [dayjs().subtract(1, 'week').startOf('week').unix(), dayjs().subtract(1, 'week').endOf('week').unix()],
  lastmonth: [dayjs().subtract(1, 'month').startOf('month').unix(), dayjs().subtract(1, 'month').endOf('month').unix()],
}

const titleMap = {
  yesterday: '昨日',
  month: '本月',
  lastweek: '上周',
  lastmonth: '上月',
}

export const Route = createFileRoute('/analysis')({
  component: RouteComponent,
  search: {
  }
})

const SkeletonComponent = () => {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[20px] w-[800px]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-[200px] w-[800px] rounded-xl" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-[200px] w-[800px] rounded-xl" />
      </div>
    </div>
  )
}

function RouteComponent() {
  
  // 获取路由参数 type
  const { type } = Route.useSearch();
  
  console.log("🚀 ~ Analysis ~ type:", type)

  const [finalSource, setFinalSource] = useState('')
  const [displayedSource, setDisplayedSource] = useState('')
  const [loading, setLoading] = useState(true)
  const firstRef = useRef(true)


  useEffect(() => {
    if (finalSource && displayedSource.length < finalSource.length) {
      const timer = setTimeout(() => {
        setDisplayedSource(finalSource.substring(0, displayedSource.length + 1));
      }, 10); // 控制打字速度
      return () => clearTimeout(timer);
    }
  }, [finalSource, displayedSource]);


  useEffect(() => {
    const [start, end] = dateMap[type as keyof typeof dateMap ?? 'yesterday']
    console.log("🚀 ~ Analysis ~ loading:", loading)
    if (!firstRef.current) return
    firstRef.current = false
    
    const sseUrl = `${import.meta.env.PUBLIC_SERVER_HOST}/AIServer/api/v1/SSEStream/Events?access_token=${sessionStorage.getItem(ACCESS_TOKEN_KEY)}`
    console.log("🚀 ~ RouteComponent ~ sseUrl:", sseUrl)
    console.log('sessionStorage.getItem(ACCESS_TOKEN_KEY)', sessionStorage.getItem(ACCESS_TOKEN_KEY))

    let eventSource: EventSource | null = null

    function connect() {  
      try {
        
        console.log("🚀 ~ connect ~ connect:")
        eventSource = new EventSource(sseUrl);
        console.log("🚀 ~ connect ~ connect:2")

        eventSource.onopen = function (e) {
            console.log("🚀 ~ RouteComponent ~ e:", e)
            console.log('SSE 连接已打开');
            
        };

        eventSource.addEventListener('scene', (e) => {
          console.log("🚀 ~ connect ~ update:", e)
        })

        let firstFrame = true
        eventSource.onmessage = function (e) {
            console.log("🚀 ~ connect onmessage ~ e:", e)
            const data = e.data;
            console.log("🚀 ~ connect ~ data:", data)

            if (e.type === 'message' && firstFrame) {
              firstFrame = false
              console.log("🚀 ~ connect ~ message:", e)
              getAnalyzeData({
                StartTime: start,
                StreamRequestID: (data ?? '').trim(),
                EndTime: end,
              }).then(res => {
                // setSource(res)
                console.log("🚀 ~ useEffect ~ res:", res)
              }).finally(() => {
                setLoading(false)
              })
              return
            }
            

            if (data === '[DONE]' || data.includes('[END]')) {
                console.log('\n🔚 服务端通知：流式输出结束。');
                closeConnection();
                return;
            }

            setFinalSource((prev) => {
              return prev + data
            })

            // 正常消息输出
            console.log(data,false,true);
        };

        eventSource.onerror = function (e) {
            console.error('SSE 错误:', e);
            console.log('❌ SSE 连接出错或已断开。', true);

            // 自动重连判断（浏览器会自动尝试重连）
            if (eventSource?.readyState === EventSource.CLOSED) {
                console.log('🔄 正在尝试重新连接...');
                setTimeout(() => {
                    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
                      connect();
                    }
                }, 3000);
            }
        };
      } catch (error) {
          console.error('SSE 错误:', error);
      }
    }
   
    function closeConnection() {
      if (eventSource) {
          eventSource.close();
      }
    }
    setTimeout(() => {
      connect()
    }, 1000)

    return () => {
      closeConnection()
    }

  }, [])

  return (
    <PageContainer title={titleMap[type as keyof typeof titleMap] + '经营分析报告'}>
      {loading ? <SkeletonComponent /> : (
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{displayedSource}</Markdown>
      )}
    </PageContainer>
  );
}

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

const md = `
  # AI数据分析简报

## 一、门店数据分析
| 指标               | 当月数据       | 同比   | 环比   |
|--------------------|----------------|--------|--------|
| 营业额             | 1,011,074.88   | +11%   | +31%   |
| 订单数             | 10,806         | +10%   | +32%   |
| 耗币数             | 4,144,490      | -9%    | +33%   |
| 存彩票             | 58,103,328     | +21%   | +13%   |
| 线上彩票兑换次数   | 5,304,391      | -15%   | +17%   |
| 线下彩票兑换次数   | 30,808,272     | +18%   | +22%   |
| 新会员数           | 5,004          | +100%  | +60%   |
| 活跃会员数         | 21,163         | -23%   | +27%   |
| 复购会员数         | 4,780          | -32%   | +39%   |
| 复购金额           | 641,526.9      | -28%   | +21%   |
| 流失会员           | 168,440        | -35%   | +42%   |

> 注：  
> 1. 行业均值对比：8月营业额1,031,074.88（+1.9%）、耗币数4,144,490（持平）  
> 2. 增长率超过20%标红，下降超20%标绿；数据单位已统一处理

---

## 二、简报分析
1. **营收增长但消费转化下降**：营业额环比增长31%，但耗币数仅增33%，订单数增长32%，显示客单价稳定但消费频次提升
2. **彩票业务异常波动**：存彩票环比增长13%但线下兑换增长22%，线上兑换下降15%，存在渠道转化失衡
3. **会员结构失衡加剧**：青铜会员占比30%未改善，白银会员占比60%持续高位，高价值黄金会员流失
4. **营销活动效果显著**：新会员增长60%但复购率下降32%，活动拉新效果明显但留存不足
5. **假日效应待释放**：临近国庆黄金周，当前存票量达5,810万具备消费潜力

---

## 三、推荐营销方案

### 方案一：盲盒抽奖（刺激储值消耗）
| 功能    | 内容                                                                 |
|---------|----------------------------------------------------------------------|
| 名称    | 国庆抽盲盒                                                           |
| 介绍    | 通过储值兑换抽奖券在线开启盲盒，支持获得图鉴和图鉴大奖               |
| 设置方法 | 【门店】→【小程序】→【盲盒抽奖】                                     |
| 操作指引 | [操作文档](https://ychylb.yuque.com/staff-gcg8pk/ylgj/eulhv3szef6rgf8o) |
| 数据佐证 | 湖南客户活动期间耗票量↑15%，营业额↑2%                                |
| 参考案例 | **国庆限定**：充值满300元赠盲盒券，集齐5款图鉴可兑换限量周边（需配合公众号推送触达青铜会员） |

---

### 方案二：彩票竞技赛（提升指定机台消耗）
| 功能    | 内容                                                                 |
|---------|----------------------------------------------------------------------|
| 名称    | 国庆彩票王争霸赛                                                   |
| 介绍    | 创建彩票竞技赛，玩家投币获取彩票排名，按名次发放苹果手机等大奖     |
| 设置方法 | 【门店】→【营销】→【彩票竞技赛】→【新增】                            |
| 操作指引 | [操作文档](https://ychylb.yuque.com/staff-gcg8pk/ylgj/cp2maxhggb3xkssx) |
| 数据佐证 | 九江客户活动期间彩票机投币量↑20%，营业额↑5%                          |
| 参考案例 | **国庆挑战赛**：指定机型投币达标送代币，全国排行前100名获限量彩票（需设置机台专属任务） |

---

### 方案三：核销加购（提升客单价）
| 功能    | 内容                                                                 |
|---------|----------------------------------------------------------------------|
| 名称    | 国庆囤票礼包                                                       |
| 介绍    | 购买指定套餐赠送代币，叠加使用折扣券提升客单价                       |
| 设置方法 | 【门店】→【营销】→【优惠券】→【兑换折扣券】                          |
| 操作指引 | [操作文档](https://ychylb.yuque.com/staff-gcg8pk/ylgj/xlnpdu3b89ek1rx9) |
| 数据佐证 | 浙江客户活动期间兑换订单↑20%，耗票率↑18%                             |
| 参考案例 | **国庆囤票计划**：充值500元送100代币+8折券，引导白银会员升级黄金会员（需结合会员等级体系） |

---

## 四、总结建议
1. **优先执行方案一**：利用盲盒抽奖快速消耗存票，同步提升图鉴收集类奖品库存
2. **重点优化方案三**：针对青铜会员设计阶梯式充值奖励，通过公众号推送激活沉默用户
3. **风险预警**：警惕线上彩票兑换持续下滑趋势，建议增加移动端兑换入口
4. **长期策略**：建立国庆专项会员成长体系，达标用户自动升级黄金会员享专属福利
`

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
      }, 40); // 控制打字速度
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

        setTimeout(() => {
          setDisplayedSource(md)
        }, 1000)

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
        <Markdown remarkPlugins={[remarkGfm]} skipHtml>{displayedSource}</Markdown>
      )}
    </PageContainer>
  );
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react';
import { ACCESS_TOKEN_KEY } from '../config';
import BgImage from '../assets/bg.png?url';
import AILogo from '../assets/ai-logo.gif?url';
import AITitle from '../assets/ai-title.png?url';

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  // 获取路由参数 type
  const { access_token } = Route.useSearch();

  useEffect(() => {
    console.log("🚀 ~ Home ~ access_token:", access_token)
    if (access_token) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token)
    }
  }, [access_token])

  return (
    <div
      className="font-sans grid grid-rows-[20px_1fr_20px] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${BgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: 0,
      }}
    >
      <div className="absolute top-8 left-8 bg-red-100 border border-red-500 text-red-500 text-sm px-4 py-1 rounded">
        免费体验至 2025-12-31
      </div>
      <main
        style={{
          width: "100%",
        }}
      >
        {/* 上方标题和装饰区域 */}  
        <div className="title-container">
          {/* 主标题 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            <img src={AILogo} alt="AI Logo" className="h-20" />
            <img src={AITitle} alt="AI Title" className="h-20" />
          </div>
          
          {/* 副标题 */}
          <p className="text-gray-600 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            基于AI的智能经营分析：精准定位运营短板，定制营销活动推荐
          </p>
        </div>
        
        {/* 下方功能按钮区域 */}
        <div className="button-container">
          <div className="grid grid-cols-2 gap-5">
            <Link
              to="/analysis"
              search={{ type: 'yesterday' }}
              className="button bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-4 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              昨日经营分析
            </Link>
            <Link
              to="/analysis"
              search={{ type: 'month' }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-4 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              本月经营分析
            </Link>
            <Link
              to="/analysis"
              search={{ type: 'lastweek' }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-4 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              上周经营分析
            </Link>
            <Link
              to="/analysis"
              search={{ type: 'lastmonth' }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-4 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              上月经营分析
            </Link>
          </div>
        </div>
      </main>
      
    </div>
  );
}
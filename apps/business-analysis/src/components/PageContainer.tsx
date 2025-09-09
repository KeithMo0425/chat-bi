import { Link } from "@tanstack/react-router";

import ArrowLeftIcon from '../assets/arrow-left.svg?react'

export function PageContainer({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="page-container">
      <div className="page-container-header">
        <div className="page-container-header-back">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4"/>
            <span>返回</span>
          </Link>
        </div>
        <div className="divider"/>
        <h1>{title}</h1>
      </div>
      <div className="page-container-content">
        {children}
      </div>
    </div>
  )
}
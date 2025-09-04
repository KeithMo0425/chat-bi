import * as zod from "zod";
import { Api } from "../type.js";

export const apis: Api[] = [
  {
    name: "get_goods_sales_data_by_category",
    description: "按分类分组获取商品销售数据",
    apiUrl: '/api/v1/goods/sales/category',
    apiMethod: 'GET',
    parameters: {
      category: zod.optional(zod.string().describe("商品分类")),
      start_date: zod.iso.datetime({ local: true, error: '开始时间不能为空'}).describe("统计币单价 开始时间"),
      end_date: zod.iso.datetime({ local: true, error: '结束时间不能为空'}).describe("统计币单价 结束时间"),
    },
    response: {
      list:  zod.array(zod.object({
        text: zod.string().describe("商品分类"),
        value: zod.number().describe("商品销售数量"),
      }))
    },
    mockData: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            list: [
              {
                text: '手机',
                value: 100,
              },
              {
                text: '电脑',
                value: 200,
              },
              {
                text: '平板',
                value: 300,
              },
              {
                text: '耳机',
                value: 400,
              },
              {
                text: '盲盒',
                value: 20
              },
              {
                text: '汽车玩具',
                value: 30
              },
              {
                text: '饮料',
                value: 50
              },
              {
                text: '零食',
                value: 40
              },
              {
                text: '玩具',
                value: 60
              },
              {
                text: '其他',
                value: 10
              }
            ]
          })
        }, 20000)
      })
    }
  },
  {
    name: "get_goods_sales_data",
    description: "获取商品销售数据",
    apiUrl: '/api/v1/goods/sales',
    apiMethod: 'GET',
    parameters: {
      start_date: zod.iso.datetime({ local: true, error: '开始时间不能为空'}).describe("统计币单价 开始时间"),
      end_date: zod.iso.datetime({ local: true, error: '结束时间不能为空'}).describe("统计币单价 结束时间"),
    },
    response: {
      list:  zod.array(zod.object({
        text: zod.string().describe("商品名称"),
        value: zod.number().describe("商品销售数量"),
      }))
    },
    mockData: () => {

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            list: [
              {
                text: '商品 1',
                value: 100,
              },
              {
                text: '商品 2',
                value: 200,
              },
              {
                text: '商品 3',
                value: 300,
              },
              {
                text: '商品 4',
                value: 400,
              },
              {
                text: '商品 5',
                value: 500,
              },
              {
                text: '商品 6',
                value: 600,
              },
              {
                text: '商品 7',
                value: 700,
              },
              {
                text: '商品 8',
                value: 800,
              }
            ]
          })
        }, 5000)
      })
    }
  },
  {
    name: "get_member_statistics_data",
    description: "获取会员统计数据",
    parameters: {
      dateTimeRange: zod.tuple([
        zod.iso.datetime().describe("开始时间"),
        zod.iso.datetime().describe("结束时间"),
      ]).describe("时间范围"),
    },
    apiUrl: '/api/v1/goods/sales/category1',
    apiMethod: 'POST',
    response: {
      comeln: zod.object({
        value: zod.number().describe("会员数量"),
        ratio: zod.number().describe("会员环比"),
      }),
      newMember: zod.number().describe("新增会员数量"),
      repurchaseMoney: zod.number().describe("复购金额"),
      repurchaseMember: zod.number().describe("复购会员数"),
      totalMember: zod.number().describe("总会员数"),
    },
    mockData: () => {
      return {
        comeln: {
          value: 100,
          ratio: 0.1,
        },
        newMember: 102,
        repurchaseMoney: 103,
        repurchaseMember: 104,
        totalMember: 105,
      }
    }
  },
  {
    name: 'query_coin_price',
    description: '查询币单价 和 行业平均币单价',
    apiUrl: '/api/v1/coin/price',
    apiMethod: 'GET',
    response: {
      coin_price: zod.number().describe('币单价'),
      industry_average_coin_price: zod.number().describe('行业平均币单价'),
    },
    parameters: {
      start_date: zod.iso.datetime({ local: true, error: '开始时间不能为空'}).describe("统计币单价 开始时间"),
      end_date: zod.iso.datetime({ local: true, error: '结束时间不能为空'}).describe("统计币单价 结束时间"),
    },
    mockData: () => {
      return {
        coin_price: 0.2,
        industry_average_coin_price: 0.4,
      }
    }
  }
]
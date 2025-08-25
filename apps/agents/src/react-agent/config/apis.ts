import * as zod from "zod";
import { Api } from "../type.js";

export const apis: Api[] = [
  {
    name: "get_goods_sales_data_by_category",
    description: "按分类分组获取商品销售数据",
    apiUrl: '/api/v1/goods/sales/category',
    apiMethod: 'GET',
    parameters: zod.object({
      category: zod.optional(zod.string().describe("商品分类")),
      dateTimeRange: zod.tuple([
        zod.iso.datetime().describe("开始时间"),
        zod.iso.datetime().describe("结束时间"),
      ]).describe("时间范围"),
    }),
    response: zod.object({
      list:  zod.array(zod.object({
        text: zod.string().describe("商品分类"),
        value: zod.number().describe("商品销售数量"),
      }))
    }),
    mockData: () => {
      return {
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
        ]
      }
    }
  },
  {
    name: "get_member_statistics_data",
    description: "获取会员统计数据",
    parameters: zod.object({
      dateTimeRange: zod.tuple([
        zod.iso.datetime().describe("开始时间"),
        zod.iso.datetime().describe("结束时间"),
      ]).describe("时间范围"),
    }),
    apiUrl: '/api/v1/goods/sales/category1',
    apiMethod: 'POST',
    response: zod.object({
      comeln: zod.object({
        value: zod.number().describe("会员数量"),
        ratio: zod.number().describe("会员环比"),
      }),
      newMember: zod.number().describe("新增会员数量"),
      repurchaseMoney: zod.number().describe("复购金额"),
      repurchaseMember: zod.number().describe("复购会员数"),
      totalMember: zod.number().describe("总会员数"),
    }),
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
  }
]
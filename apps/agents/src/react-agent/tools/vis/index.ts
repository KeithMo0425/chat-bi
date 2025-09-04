import { generateArea } from './area.js'
import { generateBar } from './bar.js'
import { generateColumn } from './column.js'
import { generateHistogram } from './histogram.js'
import { generateLine } from './line.js'
import { generatePie } from './pie.js'

export const ChartTools = [
  generateArea,
  generateBar,
  generateColumn,
  generateHistogram,
  generateLine,
  generatePie
]

export {
  generateArea,
  generateBar,
  generateColumn,
  generateHistogram,
  generateLine,
  generatePie
}
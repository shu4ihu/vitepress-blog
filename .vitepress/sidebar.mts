import path from "path";
import fs from 'fs'

const baseDir = path.resolve(__dirname, '../docs')

const configArr = [
  {
    key: 'handwrite',
    titleText: '手写题',
    prefixText: '手写'
  },
  {
    key: 'js',
    titleText: 'JavaScript'
  },
  {
    key: 'react',
    titleText: 'React'
  },
  {
    key: 'vue',
    titleText: 'Vue'
  },
  {
    key: '其他',
    titleText: ''
  }
]

function resolvePath(configArr) {
  const res = {}
  configArr.forEach(async config => {
    const baseUrl = `/${config.key}`
    res[baseUrl] = [{
      text: config.titleText,
      items: []
    }]
    const dir = path.resolve(baseDir, config.key)
    const files = await fs.promises.readdir(dir)
    files.forEach(file => {
      if (file === 'image') return
      if (file.includes('index')) {
        return
      }
      res[baseUrl][0].items.push({
        text: (config.prefixText ? config.prefixText : '') + file.replace('.md', ''),
        link: path.resolve(baseUrl, file)
      })
    })
  })

  return res
}

const config = resolvePath(configArr)

export default config
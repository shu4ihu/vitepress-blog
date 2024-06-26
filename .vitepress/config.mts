import { defineConfig } from 'vitepress'
import nav from './nav.mts'
import sidebar from './sidebar.mts'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "博客",
  description: "Something should be wrote down",
  srcDir: 'docs',
  base: '/vitepress-blog/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav,
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shu4ihu/vitepress-blog' }
    ]
  }
})

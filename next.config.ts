// next.config.js
module.exports = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    return config; // 你可以添加自定义的 Webpack 配置
  },
  experimental: {
    turboPack: false // 禁用 TurboPack
  }
};
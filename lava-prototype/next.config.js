/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle WASM files for tiktoken on server-side
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      }

      // Ensure WASM files are treated as assets
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      })
    }

    return config
  },
}

module.exports = nextConfig

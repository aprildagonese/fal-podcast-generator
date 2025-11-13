/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT,
    DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET,
  },
}

module.exports = nextConfig

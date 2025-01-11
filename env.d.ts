declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DEEPSEEK_API_KEY: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

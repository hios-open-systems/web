import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

const baseTokens = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14,
  borderRadius: 6,
};

export const lightTheme: ThemeConfig = {
  token: {
    ...baseTokens,
    colorPrimary: '#0066cc',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorText: '#1a1a1a',
    colorTextSecondary: '#666666',
  },
  components: {
    Layout: {
      bodyBg: '#ffffff',
      headerBg: 'rgba(255, 255, 255, 0.8)',
    },
    Card: {
      colorBgContainer: '#ffffff',
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...baseTokens,
    colorPrimary: '#4096ff',
    colorSuccess: '#73d13d',
    colorWarning: '#ffc53d',
    colorError: '#ff7875',
    colorInfo: '#69b1ff',
    colorBgContainer: '#1a1a1a',
    colorBgLayout: '#0d0d0d',
    colorText: '#e6e6e6',
    colorTextSecondary: '#999999',
  },
  components: {
    Layout: {
      bodyBg: '#0d0d0d',
      headerBg: 'rgba(13, 13, 13, 0.8)',
    },
    Card: {
      colorBgContainer: '#1a1a1a',
    },
  },
};

// Legacy export for compatibility
export const theme = lightTheme;

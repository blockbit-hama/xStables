import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Sentry 초기화
export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Error filtering
    beforeSend(event) {
      // 민감한 정보 필터링
      if (event.exception) {
        event.exception.values?.forEach((exception) => {
          if (exception.value?.includes('PRIVATE_KEY')) {
            exception.value = exception.value.replace(/PRIVATE_KEY=[^\s]+/g, 'PRIVATE_KEY=***');
          }
        });
      }
      return event;
    },
  });
}

// 커스텀 에러 추적
export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}

// 커스텀 메트릭 추적
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  Sentry.addBreadcrumb({
    category: 'metric',
    message: `${name}: ${value}`,
    level: 'info',
    data: tags,
  });
}

// 거래 추적
export function trackTransaction(
  type: 'swap' | 'quote' | 'error',
  data: {
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: string;
    amountOut?: string;
    ttvUsd?: number;
    savingsUsd?: number;
    chainId?: number;
    userAddress?: string;
    partnerId?: string;
    error?: string;
  }
) {
  Sentry.addBreadcrumb({
    category: 'transaction',
    message: `${type} transaction`,
    level: type === 'error' ? 'error' : 'info',
    data,
  });

  // 중요한 거래는 별도 이벤트로 추적
  if (type === 'swap' && data.ttvUsd && data.ttvUsd > 10000) {
    Sentry.captureMessage('Large transaction detected', 'info', {
      tags: {
        type: 'large_transaction',
        chainId: data.chainId?.toString(),
      },
      extra: data,
    });
  }
}

// 디페그 알림 추적
export function trackDepegAlert(
  token: string,
  currentPrice: number,
  targetPrice: number,
  deviationBps: number,
  severity: number
) {
  Sentry.captureMessage('KRW Stablecoin Depeg Detected', 'warning', {
    tags: {
      type: 'depeg_alert',
      token,
      severity: severity.toString(),
    },
    extra: {
      token,
      currentPrice,
      targetPrice,
      deviationBps,
      severity,
    },
  });
}

// API 성능 추적
export function trackAPIPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  userAgent?: string
) {
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${method} ${endpoint} - ${statusCode}`,
    level: statusCode >= 400 ? 'error' : 'info',
    data: {
      endpoint,
      method,
      duration,
      statusCode,
      userAgent,
    },
  });

  // 느린 API 호출 추적
  if (duration > 5000) { // 5초 이상
    Sentry.captureMessage('Slow API response detected', 'warning', {
      tags: {
        type: 'slow_api',
        endpoint,
        method,
      },
      extra: {
        endpoint,
        method,
        duration,
        statusCode,
      },
    });
  }
}

// 수익화 메트릭 추적
export function trackRevenue(
  type: 'service_fee' | 'partner_revenue' | 'premium_feature',
  amount: number,
  currency: string = 'USD',
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'revenue',
    message: `${type}: ${amount} ${currency}`,
    level: 'info',
    data: {
      type,
      amount,
      currency,
      ...metadata,
    },
  });
}

export default Sentry;
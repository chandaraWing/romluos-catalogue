/**
 * Server-side terminal logger for Next.js API Routes and Upstream Requests
 */

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function safeStringify(data: any, maxLen = 3000): string {
  if (data === undefined || data === null) return '';
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    if (str.length > maxLen) {
      return str.substring(0, maxLen) + `\n... (${str.length - maxLen} more characters)`;
    }
    return str;
  } catch {
    return String(data);
  }
}

export function logApiRequest(method: string, route: string, details?: Record<string, any>) {
  const time = new Date().toLocaleTimeString();
  console.log(`\n${colors.cyan}${colors.bold}┌── [API REQUEST] ${colors.yellow}${method} ${colors.cyan}${route}${colors.reset} ${colors.gray}at ${time}${colors.reset}`);
  if (details && Object.keys(details).length > 0) {
    Object.entries(details).forEach(([key, val]) => {
      if (val !== undefined) {
        const stringified = safeStringify(val, 2000);
        if (stringified.includes('\n')) {
          console.log(`${colors.cyan}│${colors.reset}  ${colors.bold}${key}:${colors.reset}`);
          stringified.split('\n').forEach((l) => {
            console.log(`${colors.cyan}│${colors.reset}    ${l}`);
          });
        } else {
          console.log(`${colors.cyan}│${colors.reset}  ${colors.bold}${key}:${colors.reset} ${stringified}`);
        }
      }
    });
  }
}

export function logUpstreamRequest(method: string, url: string, headers?: Record<string, any>, body?: any) {
  console.log(`${colors.cyan}│${colors.reset}  ${colors.magenta}➔ [UPSTREAM FETCH] ${colors.bold}${method}${colors.reset} ${url}`);
  if (headers && Object.keys(headers).length > 0) {
    const sanitizedHeaders: Record<string, any> = { ...headers };
    if (sanitizedHeaders['Authorization'] || sanitizedHeaders['authorization']) {
      const auth = sanitizedHeaders['Authorization'] || sanitizedHeaders['authorization'];
      sanitizedHeaders['Authorization'] = typeof auth === 'string' ? `${auth.substring(0, 18)}...` : auth;
    }
    console.log(`${colors.cyan}│${colors.reset}    ${colors.gray}headers:${colors.reset} ${JSON.stringify(sanitizedHeaders)}`);
  }
  if (body) {
    console.log(`${colors.cyan}│${colors.reset}    ${colors.gray}body:${colors.reset} ${safeStringify(body, 1000)}`);
  }
}

export function logApiResponse(
  route: string,
  status: number,
  data?: any,
  durationMs?: number
) {
  const isOk = status >= 200 && status < 300;
  const statusColor = isOk ? colors.green : status >= 400 ? colors.red : colors.yellow;
  const durationStr = durationMs !== undefined ? ` (${durationMs}ms)` : '';

  console.log(
    `${colors.cyan}│${colors.reset}  ${statusColor}${colors.bold}✔ [RESPONSE ${status}]${colors.reset} ${colors.cyan}${route}${colors.reset}${colors.gray}${durationStr}${colors.reset}`
  );

  if (data !== undefined && data !== null) {
    const stringified = safeStringify(data, 3000);
    const lines = stringified.split('\n');
    console.log(`${colors.cyan}│${colors.reset}  ${colors.bold}${isOk ? colors.green : colors.yellow}data:${colors.reset}`);
    lines.forEach((line) => {
      console.log(`${colors.cyan}│${colors.reset}    ${line}`);
    });
  }
  console.log(`${colors.cyan}└──${colors.reset}\n`);
}

export function logApiError(route: string, error: any, status = 500) {
  console.log(`${colors.cyan}│${colors.reset}  ${colors.red}${colors.bold}✖ [API ERROR] ${status}:${colors.reset} ${colors.cyan}${route}${colors.reset} - ${error?.message || error}`);
  if (error?.stack) {
    console.log(`${colors.cyan}│${colors.reset}  ${colors.dim}${error.stack.split('\n').slice(0, 3).join('\n│  ')}${colors.reset}`);
  }
  console.log(`${colors.cyan}└──${colors.reset}\n`);
}

export function extractErrorMessage(data: any, defaultMsg: string): string {
  if (!data) return defaultMsg;
  if (data.error) {
    if (typeof data.error === 'string') return data.error;
    if (typeof data.error === 'object' && typeof data.error.message === 'string') {
      return data.error.message;
    }
  }
  if (data.message) {
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
  }
  return defaultMsg;
}

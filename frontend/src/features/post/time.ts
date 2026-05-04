const DATE_ONLY_PATTERN = /^(\d{4}-\d{2}-\d{2})$/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/**
 * 功能：将时间数字补齐为两位字符串，保证日期与时间片段稳定可读。
 * 关键参数：value 为待补齐的数值。
 * 返回值/副作用：返回两位字符串；无副作用。
 */
function padDateSegment(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * 功能：将后端返回的日期时间字符串格式化为列表用的本地日期文本，避免 `toISOString()` 造成时区偏移。
 * 关键参数：value 为后端返回的 `LocalDateTime` 或 ISO 日期字符串。
 * 返回值/副作用：返回 `YYYY-MM-DD` 形式的日期文本；无副作用。
 */
export function formatPostCalendarDate(value: string): string {
  const normalized = value.trim();
  const dateOnlyMatch = normalized.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    return dateOnlyMatch[1];
  }

  const localDateTimeMatch = normalized.match(LOCAL_DATE_TIME_PATTERN);
  if (localDateTimeMatch) {
    return localDateTimeMatch[1];
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return "UNKNOWN";
  }

  return `${date.getFullYear()}-${padDateSegment(date.getMonth() + 1)}-${padDateSegment(date.getDate())}`;
}

/**
 * 功能：将后端返回的日期时间字符串格式化为详情页用的本地日期时间文本，避免本地时区与服务器时间双重换算。
 * 关键参数：value 为后端返回的 `LocalDateTime` 或 ISO 日期时间字符串。
 * 返回值/副作用：返回 `YYYY-MM-DD HH:mm` 形式的时间文本；无副作用。
 */
export function formatPostCalendarDateTime(value: string): string {
  const normalized = value.trim();
  const localDateTimeMatch = normalized.match(LOCAL_DATE_TIME_PATTERN);
  if (localDateTimeMatch) {
    return `${localDateTimeMatch[1]} ${localDateTimeMatch[2]}`;
  }

  const dateOnlyMatch = normalized.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]} 00:00`;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return "UNKNOWN";
  }

  return `${date.getFullYear()}-${padDateSegment(date.getMonth() + 1)}-${padDateSegment(date.getDate())} ${padDateSegment(date.getHours())}:${padDateSegment(date.getMinutes())}`;
}

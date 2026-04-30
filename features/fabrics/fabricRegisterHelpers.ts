/**
 * 布地登録の純粋ヘルパー。テスト容易性のため hook 本体から切り出している。
 */

export function generateFabricId(now: number = Date.now(), rand: number = Math.random()): string {
  return `fab_${now}_${rand.toString(36).slice(2, 8)}`;
}

export function defaultFabricName(date: Date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function resolveFabricMeta(
  name: string,
  category: string,
): { name: string; category: string } {
  return {
    name: name.trim() || defaultFabricName(),
    category: category.trim(),
  };
}

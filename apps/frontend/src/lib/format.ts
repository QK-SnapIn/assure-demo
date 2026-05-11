export const fmtMoney = (n: number | string): string =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtMoney0 = (n: number | string): string =>
  `$${Math.round(Number(n)).toLocaleString('en-US')}`

export const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

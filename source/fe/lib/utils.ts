export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString()

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

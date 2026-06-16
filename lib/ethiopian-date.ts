export const ETHIOPIAN_MONTHS = [
    "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
    "Megabit", "Miazia", "Genbot", "Sene", "Hamle", "Nehase", "Pagume"
] as const

export const ETHIOPIAN_MONTHS_AM = [
    "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
    "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
] as const

export interface EthDate {
    year: number
    month: number
    day: number
}

export function toEthiopian(date: Date): EthDate {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const jdOffset = 1723856
    const a = Math.floor((14 - month) / 12)
    const y = year + 4800 - a
    const m = month + 12 * a - 3

    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

    const jdEth = jd - jdOffset
    const r = (jdEth % 1461)
    const n = (r % 365) + 365 * Math.floor(r / 1460)

    const ethYear = 4 * Math.floor((jdEth) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460)
    const ethMonth = Math.floor(n / 30) + 1
    const ethDay = (n % 30) + 1

    return { year: ethYear, month: ethMonth, day: ethDay }
}

export function getEthiopianMonthName(monthIndex: number, lang: 'en' | 'am' = 'am'): string {
    const index = Math.max(0, Math.min(12, monthIndex - 1))
    return lang === 'am' ? ETHIOPIAN_MONTHS_AM[index] : ETHIOPIAN_MONTHS[index]
}

export function formatEthiopianDate(date: Date, lang: 'en' | 'am' = 'am'): string {
    const eth = toEthiopian(date);
    const monthName = getEthiopianMonthName(eth.month, lang);
    return `${monthName} ${eth.day}, ${eth.year}`;
}

export function toGregorian(year: number, month: number, day: number): Date {
    const ethYear = year
    const ethMonth = month
    const ethDay = day

    const jdOffset = 1723856
    const jd = (jdOffset + 365) + 365 * (ethYear - 1) + Math.floor(ethYear / 4) + 30 * ethMonth + ethDay - 31

    let l = jd + 68569
    const n = Math.floor((4 * l) / 146097)
    l = l - Math.floor((146097 * n + 3) / 4)
    const i = Math.floor((4000 * (l + 1)) / 1461001)
    l = l - Math.floor((1461 * i) / 4) + 31
    const j = Math.floor((80 * l) / 2447)
    const d = l - Math.floor((2447 * j) / 80)
    const lMonth = Math.floor(j / 11)
    const m = j + 2 - 12 * lMonth
    const y = 100 * (n - 49) + i + lMonth

    return new Date(y, m - 1, d)
}

export function getNowEthiopian(): EthDate {
    return toEthiopian(new Date())
}

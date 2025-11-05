const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

function div(a, b) {
  return Math.trunc(a / b);
}

function jalCal(jy) {
  let bl = breaks.length;
  let gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 1;
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jm2 = breaks[i];
    jump = jm2 - jp;
    if (jy < jm2) {
      break;
    }
    leapJ += div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm2;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  const leap = ((n + 1) % 33) - 1;
  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  const d =
    div(1461 * (gy + 4800 + div(gm - 14, 12)), 4) +
    div(367 * (gm - 2 - 12 * div(gm - 14, 12)), 12) -
    div(3 * div(gy + 4900 + div(gm - 14, 12), 100), 4) +
    gd -
    32075;
  return d;
}

function d2g(jdn) {
  let j = jdn + 68569;
  let c = div(4 * j, 146097);
  j -= div(146097 * c + 3, 4);
  let y = div(4000 * (j + 1), 1461001);
  j -= div(1461 * y, 4) - 31;
  let m = div(80 * j, 2447);
  const d = j - div(2447 * m, 80);
  j = div(m, 11);
  m = m + 2 - 12 * j;
  const y2 = 100 * (c - 49) + y + j;
  return [y2, m, d];
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn) {
  const gy = d2g(jdn);
  let jy = gy[0] - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy[0], 3, r.march);
  const k = jdn - jdn1f;
  let jm;
  let jd;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = (k % 31) + 1;
      return [jy, jm, jd];
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === -1) {
      k += 1;
    }
  }
  jm = 7 + div(k, 30);
  jd = (k % 30) + 1;
  return [jy, jm, jd];
}

export function gregorianToJalali(date) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const [jy, jm, jd] = d2j(g2d(gy, gm, gd));
  return { year: jy, month: jm, day: jd };
}

export function jalaliToGregorian({ year, month, day }) {
  const [gy, gm, gd] = d2g(j2d(year, month, day));
  return new Date(gy, gm - 1, gd);
}

export function formatJalali({ year, month, day }) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}/${pad(month)}/${pad(day)}`;
}

export function parseJalali(value) {
  if (!value) return null;
  const parts = value.split('/').map((part) => parseInt(part, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  if (!isValidJalaliDate(year, month, day)) return null;
  return { year, month, day };
}

export function jalaliMonthLength(year, month) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const { leap } = jalCal(year);
  return leap === -1 ? 29 : 30;
}

export function isValidJalaliDate(year, month, day) {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const max = jalaliMonthLength(year, month);
  return day <= max;
}

export const monthNames = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function todayJalali() {
  return gregorianToJalali(new Date());
}

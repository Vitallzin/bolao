export type EuropeanCountry = {
  code: string
  name: string
}

export const europeanCountries: EuropeanCountry[] = [
  { code: 'AL', name: 'Albânia' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AT', name: 'Áustria' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'BA', name: 'Bósnia e Herzegovina' },
  { code: 'BG', name: 'Bulgária' },
  { code: 'HR', name: 'Croácia' },
  { code: 'CY', name: 'Chipre' },
  { code: 'CZ', name: 'Tchéquia' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'EE', name: 'Estônia' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'GR', name: 'Grécia' },
  { code: 'HU', name: 'Hungria' },
  { code: 'IS', name: 'Islândia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IT', name: 'Itália' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'LV', name: 'Letônia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituânia' },
  { code: 'LU', name: 'Luxemburgo' },
  { code: 'MT', name: 'Malta' },
  { code: 'MD', name: 'Moldávia' },
  { code: 'MC', name: 'Mônaco' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'NL', name: 'Holanda' },
  { code: 'MK', name: 'Macedônia do Norte' },
  { code: 'NO', name: 'Noruega' },
  { code: 'PL', name: 'Polônia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romênia' },
  { code: 'SM', name: 'San Marino' },
  { code: 'RS', name: 'Sérvia' },
  { code: 'SK', name: 'Eslováquia' },
  { code: 'SI', name: 'Eslovênia' },
  { code: 'ES', name: 'Espanha' },
  { code: 'SE', name: 'Suécia' },
  { code: 'CH', name: 'Suíça' },
  { code: 'TR', name: 'Turquia' },
  { code: 'UA', name: 'Ucrânia' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'VA', name: 'Vaticano' },
  {code: 'AZ', name: 'Azerbaijão' },
]

export function getCountryName(countryCode: string) {
  return europeanCountries.find((country) => country.code === countryCode)?.name ?? countryCode
}

export function getFlagUrl(countryCode: string, size: 24 | 32 | 48 | 64 = 24) {
  return `https://flagsapi.com/${countryCode.toUpperCase()}/flat/${size}.png`
}

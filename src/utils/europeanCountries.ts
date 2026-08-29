export type EuropeanCountry = {
  code: string
  name: string
}

export const europeanCountries: EuropeanCountry[] = [
  { code: 'AL', name: 'Albania' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AT', name: 'Austria' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgica' },
  { code: 'BA', name: 'Bosnia e Herzegovina' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croacia' },
  { code: 'CY', name: 'Chipre' },
  { code: 'CZ', name: 'Tchequia' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finlandia' },
  { code: 'FR', name: 'Franca' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'GR', name: 'Grecia' },
  { code: 'HU', name: 'Hungria' },
  { code: 'IS', name: 'Islandia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IT', name: 'Italia' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'LV', name: 'Letonia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituania' },
  { code: 'LU', name: 'Luxemburgo' },
  { code: 'MT', name: 'Malta' },
  { code: 'MD', name: 'Moldavia' },
  { code: 'MC', name: 'Monaco' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'NL', name: 'Holanda' },
  { code: 'MK', name: 'Macedonia do Norte' },
  { code: 'NO', name: 'Noruega' },
  { code: 'PL', name: 'Polonia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romenia' },
  { code: 'SM', name: 'San Marino' },
  { code: 'RS', name: 'Servia' },
  { code: 'SK', name: 'Eslovaquia' },
  { code: 'SI', name: 'Eslovenia' },
  { code: 'ES', name: 'Espanha' },
  { code: 'SE', name: 'Suecia' },
  { code: 'CH', name: 'Suica' },
  { code: 'TR', name: 'Turquia' },
  { code: 'UA', name: 'Ucrania' },
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

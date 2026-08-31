import { useEffect, useState } from 'react'
import { NationalityFlag } from '../../../../components/NationalityFlag'
import { OTHER_COUNTRY_CODE, worldCountries } from '../../../../utils/worldCountries'

type CountrySearchInputProps = {
  name: string
  onChange: (code: string) => void
  placeholder?: string
  value: string
}

export function CountrySearchInput({
  name,
  onChange,
  placeholder = 'Buscar país...',
  value,
}: CountrySearchInputProps) {
  const selectedCountry = getCountryEntry(value)
  const [query, setQuery] = useState(selectedCountry?.name ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const normalizedQuery = normalizeCountryName(query)
  const exactCountry = getCountryEntryByNormalizedName(normalizedQuery)
  const matchingCountries = normalizedQuery
    ? worldCountries
      .filter(
        (country) =>
          normalizeCountryName(country.name).includes(normalizedQuery) ||
          country.code.toLowerCase() === normalizedQuery,
      )
      .slice(0, 7)
    : []
  const hasInvalidCountry = Boolean(query.trim()) && !value && !exactCountry

  useEffect(() => {
    if (selectedCountry) {
      setQuery(selectedCountry.name)
    }
  }, [selectedCountry])

  function handleQueryChange(nextQuery: string) {
    const nextExact = getCountryEntryByNormalizedName(normalizeCountryName(nextQuery))

    setQuery(nextQuery)
    setIsOpen(true)
    onChange(nextExact?.code ?? '')
  }

  function selectCountry(code: string, countryName: string) {
    setQuery(countryName)
    setIsOpen(false)
    onChange(code)
  }

  function handleBlur() {
    window.setTimeout(() => setIsOpen(false), 120)
  }

  return (
    <div className="team-search">
      <input name={name} type="hidden" value={value || exactCountry?.code || ''} />
      <input
        aria-invalid={hasInvalidCountry}
        className={hasInvalidCountry ? 'team-search__input team-search__input--invalid' : 'team-search__input'}
        placeholder={placeholder}
        value={query}
        onBlur={handleBlur}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen ? (
        <div className="team-search__options">
          {matchingCountries.map((country) => (
            <button key={country.code} type="button" onMouseDown={() => selectCountry(country.code, country.name)}>
              <span className="country-search__option">
                <NationalityFlag nationalityCode={country.code} size={20} />
                <span>{country.name}</span>
              </span>
            </button>
          ))}
          <button type="button" onMouseDown={() => selectCountry(OTHER_COUNTRY_CODE, 'Outro')}>
            <span className="country-search__option">
              <NationalityFlag nationalityCode={OTHER_COUNTRY_CODE} size={20} />
              <span>Outro</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function getCountryEntry(code: string) {
  if (!code) {
    return undefined
  }

  if (code === OTHER_COUNTRY_CODE) {
    return { code: OTHER_COUNTRY_CODE, name: 'Outro' }
  }

  return worldCountries.find((country) => country.code === code)
}

function getCountryEntryByNormalizedName(normalizedName: string) {
  if (!normalizedName) {
    return undefined
  }

  if (normalizedName === normalizeCountryName('Outro')) {
    return { code: OTHER_COUNTRY_CODE, name: 'Outro' }
  }

  return worldCountries.find((country) => normalizeCountryName(country.name) === normalizedName)
}

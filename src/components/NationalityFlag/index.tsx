import { getFlagUrl } from '../../utils/europeanCountries'
import { OTHER_COUNTRY_CODE } from '../../utils/worldCountries'
import './NationalityFlag.css'

type NationalityFlagProps = {
  nationalityCode: string
  size?: 20 | 24
}

export function NationalityFlag({ nationalityCode, size = 24 }: NationalityFlagProps) {
  if (nationalityCode === OTHER_COUNTRY_CODE) {
    return (
      <span
        className="nationality-flag nationality-flag--other"
        style={{ height: size, width: size }}
        aria-hidden="true"
      >
        ?
      </span>
    )
  }

  return <img alt="" height={size} src={getFlagUrl(nationalityCode || 'BR')} width={size} />
}

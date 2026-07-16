const currencyOption = (code: string) => ({
  value: code,
  label: { en: code, ru: code, uk: code },
});

const DONATEX_CURRENCY_OPTIONS = ['RUB', 'KZT', 'USD', 'EUR'].map(currencyOption);

export const registerDonatexOverlayTriggers = () => {
  return dashboard.registerTriggers([
    {
      type: 'donation',
      label: {
        en: 'Donation',
        ru: 'Донат',
        uk: 'Донат',
      },
      valueType: 'number',
      keyOptions: DONATEX_CURRENCY_OPTIONS,
      keyLabel: {
        en: 'Currency',
        ru: 'Валюта',
        uk: 'Валюта',
      },
      valueHint: {
        en: 'Donation amount',
        ru: 'Сумма доната',
        uk: 'Сума донату',
      },
    },
  ]);
};

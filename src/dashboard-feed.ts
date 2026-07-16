import { PLATFORM } from './constants';

export type DonatexDonation = {
  id: string;
  username: string;
  currency: string;
  amount: number;
  message?: string;
};

const userId = (name: string) => `donatex:${name.trim().toLowerCase()}`;

export const pushDonation = async (payload: DonatexDonation) => {
  const donorName = payload.username?.trim() || 'Anonymous';
  const currency = payload.currency?.trim() || 'USD';
  const amount = payload.amount || 0;

  const profile = {
    id: userId(donorName),
    name: donorName,
    avatar: '',
    platform: PLATFORM,
  };

  return dashboard.addRecord(
    {
      id: `donatex:donation:${payload.id}`,
      type: 'donation' as const,
      platform: PLATFORM,
      from: profile.id,
      amount: [amount, currency],
      message: payload.message?.trim() || undefined,
    },
    profile,
    { trigger: { type: 'donation', key: currency, value: amount } }
  );
};

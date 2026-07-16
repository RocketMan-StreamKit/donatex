import { DonatexSignalRClient, ConnectionState } from './signalr-client';
import { notifyConnectionStatus } from './status-notify';

const socketClient = new DonatexSignalRClient();

const onConnectionState = (state: ConnectionState) => {
  switch (state) {
    case 'online':
      status.Update({ current: 'online', message: { en: 'Donatex' } });
      notifyConnectionStatus('online');
      break;
    case 'error':
      status.Update({ current: 'error' });
      notifyConnectionStatus('error');
      break;
    case 'connecting':
      status.Update({ current: 'connecting' });
      break;
    case 'offline':
      status.Update({ current: 'offline' });
      notifyConnectionStatus('offline');
      break;
  }
};

socketClient.setOnStateChange(onConnectionState);

let regenerateSeq = 0;

export const RegenerateConfig = () => {
  const seq = ++regenerateSeq;
  api.config.getParams().then(async params => {
    if (seq !== regenerateSeq) return;

    const accessToken =
      typeof params.access_token === 'string' ? params.access_token.trim() : '';

    if (accessToken) {
      void socketClient.start(accessToken);
    } else {
      socketClient.stop();
    }

    const fields: Parameters<typeof GenerateConfig>[0] = [];

    fields.push({
      key: 'access_token',
      type: 'hidden',
      default: '',
      editor: {
        label: {
          en: 'API Key',
          ru: 'API ключ',
          uk: 'API ключ',
        },
        description: {
          en: 'Enter your Donatex API key from donatex.gg/profile',
          ru: 'Введите ваш API ключ Donatex из donatex.gg/profile',
          uk: 'Введіть ваш API ключ Donatex з donatex.gg/profile',
        },
      },
    });

    if (!accessToken) {
      fields.push({
        key: 'api_key_notice',
        type: 'info',
        editor: {
          label: {
            en: 'Connect to Donatex',
            ru: 'Подключение к Donatex',
            uk: "Під'єднання до Donatex",
          },
          description: {
            en: 'Go to donatex.gg/profile, copy your API key and paste it above.',
            ru: 'Перейдите на donatex.gg/profile, скопируйте API ключ и вставьте его выше.',
            uk: 'Перейдіть на donatex.gg/profile, скопіюйте API ключ та вставте його вище.',
          },
        },
      });

      fields.push({
        type: 'button',
        key: 'open_donatex_profile',
        event: 'donatexOpenProfile',
        editor: {
          label: {
            en: 'Get API key',
            ru: 'Получить API ключ',
            uk: 'Отримати API ключ',
          },
        },
      });
    }

    GenerateConfig(fields);
  });
};

events.On('donatexOpenProfile', () => {
  api.openUrl('https://donatex.gg/profile');
});

RegenerateConfig();

events.On('onParamsUpdated', () => {
  RegenerateConfig();
});

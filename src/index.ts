import './config';
import { PLATFORM } from './constants';
import { registerDonatexOverlayTriggers } from './triggers';

void dashboard.registerPlatform({
  id: PLATFORM,
  name: {
    en: 'Donatex',
    ru: 'Donatex',
    uk: 'Donatex',
  },
});

void registerDonatexOverlayTriggers();

status.OnClick(() => {
  api.restart();
});

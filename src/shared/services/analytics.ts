import {
  AnalyticsManager,
  ClarityAnalyticsProvider,
  GoogleAnalyticsProvider,
  OpenPanelAnalyticsProvider,
  PlausibleAnalyticsProvider,
  VercelAnalyticsProvider,
} from '@/extensions/analytics';
import { Configs, getAllConfigs } from '@/shared/models/config';

/**
 * get analytics manager with configs
 */
// site-wide default so the tag ships even without env vars configured
const DEFAULT_GOOGLE_ANALYTICS_ID = 'G-5ZKX8DF990';

export function getAnalyticsManagerWithConfigs(configs: Configs) {
  const analytics = new AnalyticsManager();

  // google analytics
  const gaId = configs.google_analytics_id || DEFAULT_GOOGLE_ANALYTICS_ID;
  if (gaId) {
    analytics.addProvider(new GoogleAnalyticsProvider({ gaId }));
    
  }

  // clarity
  if (configs.clarity_id) {
    analytics.addProvider(
      new ClarityAnalyticsProvider({ clarityId: configs.clarity_id })
    );
  }

  // plausible
  if (configs.plausible_domain && configs.plausible_src) {
    analytics.addProvider(
      new PlausibleAnalyticsProvider({
        domain: configs.plausible_domain,
        src: configs.plausible_src,
      })
    );
  }

  // openpanel
  if (configs.openpanel_client_id) {
    analytics.addProvider(
      new OpenPanelAnalyticsProvider({
        clientId: configs.openpanel_client_id,
      })
    );
  }

  // vercel analytics
  if (configs.vercel_analytics_enabled === 'true') {
    analytics.addProvider(new VercelAnalyticsProvider({ mode: 'auto' }));
  }

  return analytics;
}

/**
 * global analytics service
 */
let analyticsService: AnalyticsManager | null = null;

/**
 * get analytics service instance
 */
export async function getAnalyticsService(
  configs?: Configs
): Promise<AnalyticsManager> {
  if (!configs) {
    configs = await getAllConfigs();
  }
  analyticsService = getAnalyticsManagerWithConfigs(configs);

  return analyticsService;
}

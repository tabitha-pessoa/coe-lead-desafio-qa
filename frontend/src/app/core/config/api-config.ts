import { InjectionToken } from '@angular/core';

/**
 * URLs base das APIs, fornecidas por ambiente (src/environments).
 * Os services consomem apenas este token — nenhuma URL é hardcoded.
 */
export interface ApiConfig {
  orders: string;
  catalog: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

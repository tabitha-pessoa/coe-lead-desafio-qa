/**
 * Configuração de desenvolvimento.
 *
 * As URLs das APIs são paths relativos atendidos pelo proxy de desenvolvimento
 * (proxy.conf.json) — evita CORS sem nenhuma configuração no backend.
 */
export const environment = {
  production: false,
  api: {
    orders: '/api/orders',
    catalog: '/api/catalog',
  },
} as const;

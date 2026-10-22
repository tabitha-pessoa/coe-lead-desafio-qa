/**
 * Configuração de produção.
 *
 * Os paths relativos são atendidos pelo reverse proxy (nginx) no próprio
 * container — ver nginx.conf.template. Caso a aplicação seja publicada atrás
 * de um gateway externo, substitua por URLs absolutas (ex.:
 * 'https://api.exemplo.com/orders'). Nunca inclua secrets aqui: todo conteúdo
 * do bundle é visível para o usuário.
 */
export const environment = {
  production: true,
  api: {
    orders: '/api/orders',
    catalog: '/api/catalog',
  },
} as const;

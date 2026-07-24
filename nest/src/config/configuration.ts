export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  carvector: {
    apiKey: process.env.CAR_VECTOR_API_KEY ?? '',
    baseUrl: process.env.CAR_VECTOR_BASE_URL ?? 'https://api.carvector.io/v1',
  },
});

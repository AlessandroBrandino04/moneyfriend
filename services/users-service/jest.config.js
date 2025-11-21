/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Cerca i file che finiscono con .test.ts dentro la cartella tests o src
  testMatch: ['**/**/*.test.ts'],
  // Ignora la build e i moduli
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true, // Stampa dettagli sui test
  forceExit: true, // Forza la chiusura dopo i test (utile con Prisma/Express)
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
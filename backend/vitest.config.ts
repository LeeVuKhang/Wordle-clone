import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/__tests__/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/modules/**/*.ts', 'src/middleware/**/*.ts'],
        },
        setupFiles: ['src/test/setup.ts'],
    },
});

/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

const REDIRECT_PATHS = ["/dhis-web-pivot", "/dhis-web-data-visualizer"];

/** Vite's default "modules" target, raised to safari14.1: esbuild 0.28+ fails on Safari 14.0's destructuring bug. */
const ESBUILD_TARGET = ["es2020", "edge88", "firefox78", "chrome87", "safari14.1"];

function getProxy(env: Record<string, string>) {
    const targetUrl = env.VITE_DHIS2_BASE_URL;
    const auth = env.VITE_DHIS2_AUTH;

    if (env.MODE === "production") {
        return {};
    }
    if (!targetUrl) {
        console.error("Set VITE_DHIS2_BASE_URL to base DHIS2 URL");
        process.exit(1);
    }

    return {
        "/dhis2": {
            target: targetUrl,
            changeOrigin: true,
            ...(auth && { auth }),
            rewrite: (path: string) => path.replace(/^\/dhis2/, ""),
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const proxy = mode === "development" ? getProxy(env) : undefined;
    return {
        base: "./",
        plugins: [
            nodePolyfills(),
            react(),
            checker({
                typescript: true,
                eslint: {
                    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
                },
                overlay: false,
            }),
        ],
        server: {
            port: env.VITE_PORT ? parseInt(env.VITE_PORT) : 5173,
            proxy,
            ...(proxy &&
                env.VITE_DHIS2_BASE_URL && {
                    configure: server => {
                        server.middlewares.use((req, res, next) => {
                            const url = req.url || "";
                            const targetUrl = (env.VITE_DHIS2_BASE_URL || "").replace(/\/$/, "");
                            const shouldRedirect = REDIRECT_PATHS.some(
                                p => url.startsWith("/dhis2" + p) || url.startsWith("/dhis2/" + p.slice(1))
                            );
                            if (shouldRedirect && targetUrl) {
                                const path = url.replace(/^\/dhis2\/?/, "/");
                                res.writeHead(302, { Location: targetUrl + path });
                                res.end();
                                return;
                            }
                            next();
                        });
                    },
                }),
        },
        optimizeDeps: {
            esbuildOptions: {
                target: ESBUILD_TARGET,
            },
        },
        build: {
            outDir: "build",
            target: ESBUILD_TARGET,
        },
        test: {
            reporters: [["default", { summary: false }]],
            environment: "jsdom",
            globals: true,
            include: ["src/**/*.{test,spec}.{ts,tsx}"],
            exclude: ["node_modules", "cypress"],
            setupFiles: ["./src/tests/setup.ts"],
        },
        define: {
            "process.env": {},
            global: "globalThis",
            __dirname: JSON.stringify("/"),
            __filename: JSON.stringify("/index.js"),
        },
    };
});

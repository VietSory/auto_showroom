import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "VITE_");

	return {
		plugins: [react()],

		base: env.VITE_BASE || "/",

		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},

		server: {
			proxy: {
				"/api": {
					target: env.VITE_DEV_API_URL || "http://localhost:5000",
					changeOrigin: true,
				},
			},
		},

		build: {
			outDir: "dist",
			minify: "esbuild",
			assetsInlineLimit: 4096,
			sourcemap: false,
			rollupOptions: {
				output: {
					manualChunks: {
						vendor: ["react", "react-dom"],
						ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-toast"],
						three: ["three", "@react-three/fiber", "@react-three/drei"],
						animation: ["framer-motion", "gsap", "aos"],
						charts: ["recharts"],
						icons: ["react-icons", "lucide-react"],
					},
				},
			},
		},

		// Tối ưu hóa dependencies — three chuyển vào include để tránh conflict với manualChunks
		optimizeDeps: {
			include: [
				"react",
				"react-dom",
				"react-router-dom",
				"@tanstack/react-query",
				"framer-motion",
				"three", // chuyển từ exclude → include
			],
		},

		esbuild: {
			target: "es2020",
		},
	};
});

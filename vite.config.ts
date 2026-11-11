import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function silenceViteClientWebSocket(): Plugin {
  return {
    name: 'silence-vite-client-websocket',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        return {
          code: code
            .replace(
              'transport.connect(createHMRHandler(handleMessage));',
              '/* HMR WebSocket disabled in Cloud Run middleware mode */'
            )
            .replace(
              'setupForwardConsoleHandler(transport, forwardConsole);',
              '/* forwardConsole disabled */'
            ),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [silenceViteClientWebSocket(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});

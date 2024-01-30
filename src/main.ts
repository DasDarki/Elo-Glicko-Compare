import '@/main.scss';

import { createApp } from 'vue';
import { Chart, registerables } from 'chart.js';
import App from './App.vue';

Chart.register(...registerables);

createApp(App).mount('#app');
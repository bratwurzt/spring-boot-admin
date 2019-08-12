import Vue from 'vue';
import VueI18n from 'vue-i18n';
import {messages} from './dictionary'

Vue.use(VueI18n);
export const i18n = new VueI18n({
  locale: 'en', // set locale
  // fallbackLocale: 'es', // set fallback locale
messages:messages, // set locale messages
});

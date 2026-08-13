import Vue from 'vue'
import App from './App'
import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/en'
import * as Sentry from '@sentry/browser'
import { Vue as VueIntegration } from '@sentry/integrations'
import { initFeatureFlags } from './utils/featureFlags'
import i18n from './i18n'

Vue.config.productionTip = false
Vue.use(Element, { locale })

Sentry.init({
  dsn: 'https://3be20a7665464a57aadb414447b01909@o115477.ingest.sentry.io/5530798',
  integrations: [new VueIntegration({ Vue, attachProps: true })]
})

async function bootstrap () {
  initFeatureFlags()

  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    i18n,
    components: {
      App
    },
    template: '<App/>'
  })
}

bootstrap()

import Vue from 'vue'
import { VueI18n, createElementUIMocks } from './i18n-test-utils'

Vue.config.productionTip = false
Vue.use(VueI18n)

const elementUIMocks = createElementUIMocks()
Vue.prototype.$message = elementUIMocks.$message
Vue.prototype.$notify = elementUIMocks.$notify
Vue.prototype.$confirm = elementUIMocks.$confirm

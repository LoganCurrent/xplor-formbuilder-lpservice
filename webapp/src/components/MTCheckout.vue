<template>
  <el-container>
    <el-progress :percentage="percentage"
      :style="{'left': '25%', 'width': '50%', 'padding-top': '5%'}"
      :stroke-width=10
      :show-text=false
      :color="color"
    v-if="isLoading">
    </el-progress>
    <h1 v-if="isLoading">{{this.loadingStep}}</h1>
    <h1 v-if="isLoading">{{ ts('labels.loadingNote', 'Note: this can take up to 10 seconds') }}</h1>

    <el-card v-if="!isLoading" id="checkout"
      :body-style="{'padding-bottom': 0}"
      :style="'background: white;'">
      <div :style="'position: relative;'">
        <div v-bind:data-mariana-integrations="this.cartUrl"></div>
        <div  class="error-block" v-if="errorMessage">{{errorMessage}}</div>
      </div>
    </el-card>
 </el-container>
</template>
<script>
import {
  calculateCartData,
  buildCart,
  applyDiscount,
  captureLandingPageViewEvent
} from '@/api'
import { CircleSpinner } from 'vue-spinners'
import * as Sentry from '@sentry/browser'
import StepProgress from 'vue-step-progress'
import 'vue-step-progress/dist/main.css'
import translationMixin from '@/mixins/translationMixin'
import { backendErrorKeyToI18nKey } from '@/i18n/errorKeyMap'

export default {
  name: 'OauthCallback',
  mixins: [translationMixin],
  props: ['parameters', 'mtoauth'],
  components: {
    CircleSpinner,
    'step-progress': StepProgress
  },

  async mounted () {
    await this.loadTranslationsFlag(this.parameters && this.parameters.account_id)
    this.loadingStep = this.ts('labels.fetchingData', 'Fetching data...')

    const parsedUrl = new URL(window.location.href)
    window.history.replaceState({}, document.title, parsedUrl.pathname)
    const accessToken = this.mtoauth.getAccessToken()
    let cartLocationId
    let childProductId

    try {
      this.percentage = 25
      // eslint-disable-next-line no-undef
      const results = await calculateCartData(landingPageUuid, accessToken)
      this.loadingStep = this.ts('labels.buildingCart', 'Building cart...')
      this.percentage = 50
      cartLocationId = results.cartLocationId
      childProductId = results.childProductId
      // Important: set cart url so web integrations knows what to load!
      this.cartUrl = `/checkout/${cartLocationId}?login=true`
    } catch (error) {
      this.$message.error(this.ts('errors.buildingCart', 'Error building cart.'))
    }

    try {
      // eslint-disable-next-line no-undef
      await buildCart(landingPageUuid, accessToken, cartLocationId, childProductId)
      this.percentage = 75
      this.loadingStep = this.ts('labels.finalizingCart', 'Finalizing cart...')
    } catch (error) {
      this.$message.error(this.ts('errors.buildingCart', 'Error building cart.'))
    }

    try {
      // eslint-disable-next-line no-undef
      await applyDiscount(landingPageUuid, accessToken, cartLocationId)
      this.percentage = 90
      this.loadingStep = this.ts('labels.loadingCheckout', 'Loading Checkout...')
    } catch (error) {
      this.$message.error(this.ts('errors.applyingDiscount', 'Error applying discount to cart.'))
    }

    this.isLoading = false

    try {
      // wait for DOM to load checkout MT web integration block
      await this.mtoauth.checkElement('#checkout')
      window.MTIntegrations.render()
    } catch (error) {
      this.$message.error(error.message)
    }

    try {
      // const userId = this.mtoauth.getLoggedInUserId()
      // eslint-disable-next-line no-undef
      await captureLandingPageViewEvent(landingPageUuid, accessToken)
    } catch (error) {
      const i18nKey = backendErrorKeyToI18nKey(error.errorKey)
      this.errorMessage = i18nKey ? this.ts(i18nKey, error.message) : error.message
      Sentry.captureException(error)
    }
  },
  data () {
    return {
      color: this.parameters.button_color,
      percentage: 0,
      loadingStep: '',
      isLoggingIn: false,
      isLoading: true,
      cartUrl: null,
      errorMessage: null
    }
  }
}
</script>

<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.error-block {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 1;
  padding: 80px 0 0 0;
}
</style>

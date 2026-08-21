<template>
<div>
     <script type="application/javascript">
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
   </script>
   <CircleSpinner v-if="parameters === null"></CircleSpinner>
   <div v-else>
   <el-container
     :class="{ 'has-page-layout': hasPageLayout }"
     :style="pageChromeStyle"
   >
    <el-header height="auto" :style="{'background-color': parameters.template['key-page-header-color']}">
      <img
        v-if="parameters.template['key-logo']"
        :src="parameters.template['key-logo']"
        :style="'width: ' + parameters.template['key-logo-width'] + 'px'"
        :alt="parameters.account_name"
      />
    </el-header>
      <el-main>
          <Summary
            v-if="mode == 'SHOW_SUMMARY'"
            :parameters="parameters"
            :mtoauth="mtoauth"
            :design-mode="designMode"
            :editor-layout="editorLayout"
            :selected-block-id="selectedBlockId"
            :active-drop-after-id="activeDropAfterId"
            @select-block="selectedBlockId = $event"
          />
          <ActFast v-if="mode === 'SHOW_ACT_FAST'" :parameters="parameters" :mtoauth="mtoauth" />
          <MTLogin v-if="mode === 'SHOW_MT_LOGIN'" :parameters="parameters" :mtoauth="mtoauth" />
          <MTSignUp v-if="mode === 'SHOW_MT_SIGNUP'" :parameters="parameters" :mtoauth="mtoauth" />
          <MTCheckout v-if="mode === 'SHOW_MT_CHECKOUT'" :parameters="parameters" :mtoauth="mtoauth" />
          <Success v-if="mode === 'SHOW_SUCCESS'" :parameters="parameters" :mtoauth="mtoauth" />
          <Hidden v-if="mode === 'SHOW_HIDDEN'" :mtoauth="mtoauth" />
      </el-main>
    </el-container>
  </div>
</div>
</template>
<script>
import {
  fetchLandingPageConfig,
  captureCheckoutEvent,
  fetchMTConfig,
  fetchMTIframeConfig
} from '@/api'
import { resolvePurchaseAmount } from '@/utils/resolve-purchase-amount'
import { CircleSpinner } from 'vue-spinners'
import EventBus from '@/event-bus'
import MTOAuth from '../utils/mt-oauth'
import Summary from './Summary'
import ActFast from './ActFast'
import MTLogin from './MTLogin'
import MTSignUp from './MTSignUp'
import MTCheckout from './MTCheckout'
import Success from './Success'
import Hidden from './Hidden'
import {
  handleReachIdentification,
  loadReachAttribution,
  getReachConfig
} from '../utils/reach'
import translationMixin from '@/mixins/translationMixin'
import { isEditorMessage, isDesignModeFlagSet, postToParent } from '@/utils/design-mode-protocol'
import {
  parsePageLayout,
  insertBlockAfter,
  updateBlockProps,
  removeBlock,
  moveBlockAfter,
  PAGE_LAYOUT_TEMPLATE_KEY
} from '@/utils/page-layout'
import { initI18n } from '@/i18n'
import { backendErrorKeyToI18nKey } from '@/i18n/errorKeyMap'
import {
  purchaseMatchesConfiguredProduct,
  resolveAttributedProductId
} from '@/utils/checkout-product'

export default {
  name: 'LandingPage',
  mixins: [translationMixin],
  components: {
    Summary,
    ActFast,
    MTLogin,
    MTSignUp,
    MTCheckout,
    Success,
    Hidden,
    CircleSpinner
  },
  created () {
    this.designMode = isDesignModeFlagSet()
    this.getParameters()
  },
  mounted () {
    window.addEventListener('message', this.onEditorMessage)
    if (window.parent !== window) {
      postToParent('ready')
    }
    EventBus.$on('show_act_fast', () => {
      this.mode = 'SHOW_ACT_FAST'
    })
    EventBus.$on('show_mt_login', () => {
      this.mode = 'SHOW_MT_LOGIN'
    })
    EventBus.$on('show_mt_signup', () => {
      this.mode = 'SHOW_MT_SIGNUP'
    })
    EventBus.$on('show_mt_checkout', () => {
      this.mode = 'SHOW_MT_CHECKOUT'
    })
    EventBus.$on('show_success', () => {
      this.mode = 'SHOW_SUCCESS'
    })
    EventBus.$on('show_hidden', () => {
      this.mode = 'SHOW_HIDDEN'
    })

    // Hidden page for debugging.
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('hidden')) EventBus.$emit('show_hidden')
  },
  methods: {
    currentLayout () {
      if (this.editorLayout) {
        return this.editorLayout
      }
      var template = this.parameters && this.parameters.template
      return parsePageLayout(template && template[PAGE_LAYOUT_TEMPLATE_KEY])
    },
    applyLayout (layout) {
      this.editorLayout = layout
      postToParent('layout', { layout: layout })
    },
    onEditorMessage (event) {
      var data = event && event.data
      if (!isEditorMessage(data)) {
        return
      }
      if (data.type === 'init') {
        this.designMode = true
        if (data.layout) {
          this.editorLayout = data.layout
        }
        return
      }
      if (data.type === 'setLayout' && data.layout) {
        this.designMode = true
        this.editorLayout = data.layout
        return
      }
      if (data.type === 'select') {
        this.selectedBlockId = data.id || null
        return
      }
      if (data.type === 'dragStart') {
        this.activeDropAfterId = ''
        return
      }
      if (data.type === 'dragEnd') {
        this.activeDropAfterId = null
        return
      }
      var layout = this.currentLayout()
      if (!layout) {
        return
      }
      if (data.type === 'drop' && data.blockType) {
        var newBlock = {
          id: 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
          type: data.blockType,
          locked: false,
          props: {}
        }
        this.applyLayout(insertBlockAfter(layout, data.afterId == null ? null : data.afterId, newBlock))
        this.selectedBlockId = newBlock.id
        return
      }
      if (data.type === 'updateBlock' && data.id && data.props) {
        this.applyLayout(updateBlockProps(layout, data.id, data.props))
        return
      }
      if (data.type === 'removeBlock' && data.id) {
        this.applyLayout(removeBlock(layout, data.id))
        this.selectedBlockId = null
        return
      }
      if (data.type === 'moveBlock' && data.id) {
        this.applyLayout(moveBlockAfter(layout, data.id, data.afterId == null ? null : data.afterId))
      }
    },
    initPixel () {
      window.fbq('init', this.parameters.pixel.id)
      window.fbq('track', 'PageView')
    },
    normalizeReachIdentity (source = {}) {
      return {
        userId: source.userId,
        email: source.email || source.email_address || source.emailAddress || null,
        phone: source.phone || source.phone_number || source.phoneNumber || source.mobile || source.mobile_phone || null,
        firstName:
          source.firstName || source.first_name || source.given_name || source.fname || source.f_name || null,
        lastName:
          source.lastName || source.last_name || source.family_name || source.lname || source.l_name || null
      }
    },
    parseBrokerName (brokerName) {
      if (!brokerName || typeof brokerName !== 'string') {
        return { firstName: null, lastName: null }
      }
      const parts = brokerName.trim().split(/\s+/).filter(Boolean)
      return {
        firstName: parts[0] || null,
        lastName: parts[1] || null
      }
    },
    getCachedReachIdentity () {
      if (typeof localStorage === 'undefined' || !this.parameters || !this.parameters.subdomain) return {}
      try {
        const cacheKey = `mt.https://${this.parameters.subdomain}.marianatek.com`
        const rawData = localStorage.getItem(cacheKey)
        if (!rawData) return {}
        const data = JSON.parse(rawData)
        const identitySource = (data && data.user) || data
        return this.normalizeReachIdentity(identitySource)
      } catch (error) {
        return {}
      }
    },
    async sendReachIdentification (identity = {}, sourceId = null) {
      if (!this.enableReachAdvancedIdentification || !this.reachConfig) {
        console.warn('Reach advanced identification not enabled or reach config not found')
        return
      }

      if (!sourceId) {
        return
      }

      const cachedIdentity = this.getCachedReachIdentity()

      const reachPayload = {
        ...cachedIdentity,
        ...identity,
        sourceId
      }

      if (!reachPayload.userId) {
        console.warn('UserId not found in reach payload')
        return
      }

      await handleReachIdentification(reachPayload)
    },
    async getParameters () {
      try {
        const response = await fetchLandingPageConfig(this.uuid)
        const parameters = response.parameters
        await this.loadTranslationsFlag(parameters.account_id)
        if (this.translationsEnabled) {
          await initI18n(true)
        }
        // Assign after flag + i18n so child mixins see account_id
        this.parameters = parameters
        const mtConfig = await fetchMTConfig(this.parameters.subdomain)

        this.parameters.isCustomClientAuthEnabled = mtConfig.is_custom_client_auth_enabled
        this.parameters.customClientCreateAccountEndpoint = mtConfig.custom_client_openid_connect_optional_create_account_endpoint
        this.parameters.brandName = mtConfig.brand_name
        this.enableReachAdvancedIdentification = this.parameters.enableReachAdvancedIdentification || false

        if (this.enableReachAdvancedIdentification) {
          try {
            const iframeConfig = await fetchMTIframeConfig(this.parameters.subdomain)
            const iframeMtConfig = iframeConfig && iframeConfig.mtConfig
            const partnerId = iframeMtConfig && iframeMtConfig.xplorAdsPartnerId
            const tenantExternalId = this.parameters.subdomain
            const shouldLoadReachConfig = iframeMtConfig && iframeMtConfig.xplorAdsPartnerHash === true

            if (shouldLoadReachConfig) {
              this.reachConfig = getReachConfig({ partnerId, tenantExternalId })
              if (this.reachConfig) {
                loadReachAttribution(this.reachConfig)
              }
            } else {
              this.reachConfig = null
            }
          } catch (error) {
            console.warn('Failed to load Iframe MT config', error)
            this.reachConfig = null
          }
        } else {
          this.reachConfig = null
        }

        this.parameters.uuid = this.uuid
        if (this.parameters.displayPrice) {
          this.parameters.discount = this.parameters.displayPrice
        }
        this.mtoauth = new MTOAuth(this.parameters.subdomain)
        this.loggedIn = this.mtoauth.isAuthenticated()
        // this.email = this.mtoauth.getEmail()
        this.loading = false
      } catch (error) {
        const errorKey = error && error.response && error.response.data && error.response.data.error_key
        const message =
          (error && error.response && error.response.data && error.response.data.message) ||
          (error && error.message) ||
          ''
        const i18nKey = backendErrorKeyToI18nKey(errorKey)
        this.$message.error(i18nKey ? this.ts(i18nKey, message) : message)
      }
      const urlParams = new URLSearchParams(window.location.search)
      const webIntegrationParams = urlParams.get('_mt')
      if (webIntegrationParams === '/account') {
        // We may need to override the WI  routing mechanism to stop the customer
        // from potentially browsing parts of WI v4
        // console.log('ROUTER: Trying to load account page... we should not allow this.')
      }
      if (webIntegrationParams && webIntegrationParams.includes('callback')) {
        // Finish MT OAuth login flow.
        EventBus.$emit('show_mt_login')
      }

      window.MT_CONFIG = {
        events: {
          onLoginComplete: (obj) => {
            EventBus.$emit('show_mt_checkout')
          },
          onCheckoutComplete: async (payload) => {
            try {
              EventBus.$emit('show_success')
              const userId = payload.userId
              const order = payload.order
              const purchaseAmount = resolvePurchaseAmount(order)
              const orderId = order.id
              const accessToken = this.mtoauth.getAccessToken()

              if (this.parameters.validateCheckoutProduct &&
                  !purchaseMatchesConfiguredProduct(this.parameters, order)) {
                console.warn(
                  'Purchase product does not match landing page product, skipping attribution'
                )
                return
              }

              const productId = this.parameters.validateCheckoutProduct
                ? resolveAttributedProductId(this.parameters, order)
                : order.orderLines[0].id
              // eslint-disable-next-line no-undef
              await captureCheckoutEvent(
                landingPageUuid,
                userId,
                purchaseAmount,
                productId,
                accessToken,
                order,
                orderId
              )
              if (this.parameters && this.parameters.pixel && this.parameters.pixel.purchase) {
                window.fbq('track', 'Purchase', {value: purchaseAmount, currency: this.parameters.currency})
              }
              const identitySource =
                (order && (order.customer || order.contact)) ||
                (payload && (payload.customer || payload.user || payload.account)) ||
                payload
              const identity = this.normalizeReachIdentity({...identitySource, userId})
              const brokerName = order && order.orderDetails && order.orderDetails[0] && order.orderDetails[0].brokerName
              if (brokerName && (!identity.firstName || !identity.lastName)) {
                const brokerIdentity = this.parseBrokerName(brokerName)
                if (!identity.firstName) {
                  identity.firstName = brokerIdentity.firstName
                }
                if (!identity.lastName) {
                  identity.lastName = brokerIdentity.lastName
                }
              }
              const sourceId = this.parameters.vanity || this.parameters.name
              await this.sendReachIdentification(identity, sourceId)
            } catch (error) {
              console.log(error)
            }
          },
          onCreateAccountComplete: async (account) => {
            EventBus.$emit('show_mt_checkout')
            if (this.parameters && this.parameters.pixel && this.parameters.pixel.lead) {
              window.fbq('track', 'Lead')
            }
            const identity = this.normalizeReachIdentity((account && account.user) || account)
            const sourceId = this.parameters.vanity || this.parameters.name
            await this.sendReachIdentification(identity, sourceId)
          }
        }
      }
      // Optionaly load pixel
      if (this.parameters.pixel) {
        this.initPixel()
      }
    }
  },
  computed: {
    hasPageLayout () {
      if (this.editorLayout) {
        return true
      }
      var template = (this.parameters && this.parameters.template) || {}
      return Boolean(parsePageLayout(template[PAGE_LAYOUT_TEMPLATE_KEY]))
    },
    pageChromeStyle () {
      var template = (this.parameters && this.parameters.template) || {}
      var font = template['key-page-font-family']
      var style = {}
      if (!this.hasPageLayout) {
        style.backgroundColor = template['key-page-color']
      }
      if (font) {
        style.fontFamily = String(font).indexOf(',') >= 0
          ? font
          : "'" + font + "', Helvetica, Arial, sans-serif"
      }
      return style
    }
  },
  data () {
    return {
      // eslint-disable-next-line no-undef
      uuid: landingPageUuid,
      parameters: null,
      reachConfig: null,
      enableReachAdvancedIdentification: false,
      mtoauth: null,
      loading: true,
      loggedIn: false,
      email: '',
      mode: 'SHOW_SUMMARY',
      designMode: false,
      editorLayout: null,
      selectedBlockId: null,
      activeDropAfterId: null
    }
  },
  beforeDestroy () {
    window.removeEventListener('message', this.onEditorMessage)
    EventBus.$off('show_mt_signin')
    EventBus.$off('show_mt_signup')
    EventBus.$off('show_mt_checkout')
  }
}
</script>
<style scoped>
  .el-container {
    display: block;
    background-color: #f3f6f9;
    height: 100vh;
  }
  .el-container.has-page-layout {
    display: flex;
    flex-direction: column;
    background-color: transparent;
  }
  .el-header {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 3.5rem;
    background-color: #ffffff;
    box-shadow: 0 0 4px 0 rgba(97, 112, 128, .11);
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
  }
  .el-header img {
    margin-left: auto;
    margin-right: auto;
  }
  .el-main {
    display: block;
  }
  .el-container.has-page-layout .el-main {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 768px) {
    .el-header img {
      max-width: 100%;
    }
  }

</style>

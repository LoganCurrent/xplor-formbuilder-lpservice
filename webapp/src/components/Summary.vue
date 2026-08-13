<template>
  <el-card :shadow="'never'" :body-style="{'padding-bottom': 0}">
    <div class="name">{{ parameters.name }}</div>
    <div class="description" v-html="descriptionWithLinks"></div>
    <div class="pricing" v-if="!parameters.discount">{{ price }}</div>
    <div class="pricing" v-if="parameters.discount">
      <span class="old">{{ price }}</span>{{ priceWithDiscount }}
    </div>
    <div class="tax-info" v-if="hasTaxInfo">
      <span v-if="parameters.displayInclusiveTax">{{ ts('labels.priceIncludesTax', 'Price includes tax') }}</span>
      <span v-else>{{ ts('labels.priceExcludesTax', 'Price does not include tax') }}</span>
    </div>

    <div class="remaining" v-if="parameters.globalLimit">
      <span v-if="parameters.remaining">{{ ts('labels.onlyRemaining', 'Only {count} remaining', { count: parameters.remaining }) }}</span>
      <span v-if="parameters.remaining === 0">{{ ts('labels.outOfStock', 'This item is out of stock!') }}</span>
    </div>

    <el-button type="primary" class="custom"
        :disabled="parameters.globalLimit && parameters.remaining === 0"
        :style="'width: 100%; background-color: ' + parameters.button_color + '; border-color: ' + parameters.button_color"
        @click="goToActFast">
      {{ parameters.button_text }}
    </el-button>

    <HelpFooter
      :email="parameters.email"
      :phone="parameters.phone"
      :account-id="parameters.account_id"
    />
  </el-card>
</template>
<script>
import EventBus from '@/event-bus'
import HelpFooter from './HelpFooter.vue'
import translationMixin from '@/mixins/translationMixin'

export default {
  components: { HelpFooter },
  mixins: [translationMixin],
  props: ['parameters', 'mtoauth'],
  created () {
    if (this.parameters.displayPrice) {
      this.parameters.discount = this.parameters.displayPrice
    }
    this.loadTranslationsFlag(this.parameters.account_id)
  },
  methods: {
    goToActFast () {
      if (this.mtoauth.isAuthenticated()) {
        EventBus.$emit('show_mt_checkout')
      } else {
        EventBus.$emit('show_act_fast')
      }
    },
    linkifyUrls (text) {
      if (!text) return ''
      // Regex to find URLs within text (supports http, https, www)
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g
      return text.replace(urlRegex, (url) => {
        // Add protocol if missing (for www. links)
        const href = url.startsWith('www.') ? 'http://' + url : url
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`
      })
    }
  },
  computed: {
    hasTaxInfo () {
      return this.parameters.hasOwnProperty('displayInclusiveTax')
    },
    price () {
      let basePrice = this.parameters.product.price
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return Number(basePrice).toLocaleString(undefined, {
        style: 'currency',
        currency: this.parameters.currency
      })
    },
    priceWithDiscount () {
      let basePrice = this.parameters.product.price - this.parameters.discount
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return Number(basePrice).toLocaleString(undefined, {
        style: 'currency',
        currency: this.parameters.currency
      })
    },
    descriptionWithLinks () {
      if (!this.parameters || !this.parameters.description) return ''
      return this.linkifyUrls(this.parameters.description)
    }
  }
}
</script>
<style scoped>
  .el-card {
    width: 100%;
    max-width: 800px !important;
    margin-left: auto;
    margin-right: auto;
    background: white;
  }
  .name {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(0, 21, 42);
    margin-bottom: .5rem;
  }
  .description {
    font-size: 1rem;
    line-height: 1.5;
    color: rgb(0, 21, 42);
    margin-bottom: 1.5rem;
  }
  .description >>> a {
    color: #2E4457;
    text-decoration: underline;
  }
  .description >>> a:hover {
    color: #1a2938;
  }
  .pricing {
    margin-bottom: 2.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: rgb(0, 21, 42);
  }
  .pricing .old {
    text-decoration: line-through;
    color: rgb(97, 112, 128);
    margin-right: .5rem;
  }
  .tax-info {
    font-size: 0.875rem;
    color: rgb(97, 112, 128);
    margin-top: -2rem;
    margin-bottom: 2.5rem;
  }
  .footer {
    margin-top: 1rem;
    padding: 1rem;
    background-color: rgb(235, 244, 250);
    font-size: .625rem;
    font-weight: 600;
    color: rgb(97, 112, 128);
    text-align: center;
    margin-right: -20px;
    margin-left: -20px;
  }
  .footer a {
    color: #2E4457;
    text-decoration: underline;
  }
  .remaining {
    font-weight: 600;
    color: rgb(0, 21, 42);
    text-align: center;
    margin-top: -1rem;
    margin-bottom: 1rem;
  }
</style>

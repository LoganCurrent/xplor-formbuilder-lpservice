<template>
  <el-card :body-style="{'padding-bottom': 0}">
    <div class="name">{{ parameters.name }}</div>
    <div class="pricing" v-if="!parameters.discount">{{ price }}</div>
    <div class="pricing" v-if="parameters.discount">
      <span class="old">{{ price }}</span>{{ priceWithDiscount }}
    </div>
    <div class="tax-info" v-if="hasTaxInfo">
      <span v-if="parameters.displayInclusiveTax">{{ ts('labels.priceIncludesTax', 'Price includes tax') }}</span>
      <span v-else>{{ ts('labels.priceExcludesTax', 'Price does not include tax') }}</span>
    </div>

    <h4 v-if="customerType === 'existing'">{{ ts('labels.signInWithCredentials', 'Sign In with your {brand} credentials', { brand: parameters.brandName }) }}</h4>

    <el-form status-icon @submit.native.prevent>
      <el-form-item>
        <el-button class="max-width custom"
          :style="'background-color: ' + parameters.button_color + '; border-color: ' + parameters.button_color"
          type="primary"
          @click="signInOrUpMTAccount('btn')">
          {{credentialsButtonTitle}}
        </el-button>
      </el-form-item>

      <el-form-item v-if="showCreateAccountLink()">
        <el-row>
          <el-col class="text-align-center">
            <a class="link" @click="signInOrUpMTAccount('link')">{{credentialsLinkTitle}}</a>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>

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
  data () {
    return {
      customerType: (this.parameters.customerType) ? this.parameters.customerType.toLowerCase() : 'existing'
    }
  },
  mounted () {
    this.loadTranslationsFlag(this.parameters.account_id)
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
    credentialsLinkTitle () {
      if (this.customerType === 'existing') {
        return this.ts('buttons.createAccount', 'Create Account')
      }
      return this.ts('buttons.signIn', 'Sign In')
    },
    credentialsButtonTitle () {
      if (this.customerType === 'existing') {
        return this.ts('buttons.signIn', 'Sign In')
      }
      return this.ts('buttons.createAccount', 'Create Account')
    }
  },
  methods: {
    signInOrUpMTAccount (type) {
      if (type === 'btn' && this.customerType === 'existing') {
        EventBus.$emit('show_mt_login')
      }

      if (type === 'btn' && this.customerType === 'new') {
        EventBus.$emit('show_mt_signup')
      }

      if (type === 'link' && this.customerType === 'existing') {
        EventBus.$emit('show_mt_signup')
      }

      if (type === 'link' && this.customerType === 'new') {
        EventBus.$emit('show_mt_login')
      }
    },
    showCreateAccountLink () {
      if (this.parameters.isCustomClientAuthEnabled && !this.parameters.customClientCreateAccountEndpoint) {
        return false
      }
      return true
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
  }

  h4 {
    margin-top: 0px;
    margin-bottom: 2rem;
    font-size: 18px;
    line-height: 24px;
  }

  .max-width {
    width: 100%;
  }

  .text-align-center {
    text-align: center;
  }

  .link {
    font-size: 12px;
    color: #617080;
    text-decoration: underline;
    cursor: pointer;
  }

  .name {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(0, 21, 42);
    margin-bottom: .5rem;
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
</style>

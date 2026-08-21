<template>
  <div class="help-footer-wrap">
    <div class="footer" v-if="email && !phone">
      {{ ts('labels.needHelpEmail', 'Need help? Email us at') }}
      <a :href="'mailto:' + email">{{ email }}</a>
    </div>
    <div class="footer" v-if="phone && !email">
      {{ ts('labels.needHelpCall', 'Need help? Call us at') }}
      <a :href="'tel:' + phone" target="_blank">{{ phone }}</a>
    </div>
    <i18n
      v-if="email && phone"
      path="labels.needHelpEmailAndCall"
      tag="div"
      class="footer"
    >
      <template slot="email">
        <a :href="'mailto:' + email" target="_blank">{{ email }}</a>
      </template>
      <template slot="phone">
        <a :href="'tel:' + phone" target="_blank">{{ phone }}</a>
      </template>
    </i18n>
  </div>
</template>

<script>
import translationMixin from '@/mixins/translationMixin'

export default {
  name: 'HelpFooter',
  mixins: [translationMixin],
  props: {
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    accountId: {
      type: [String, Number],
      default: null
    }
  },
  mounted () {
    this.loadTranslationsFlag(this.accountId)
  }
}
</script>

<style scoped>
  .help-footer-wrap {
    width: 100%;
  }
  .footer {
    margin-top: 1rem;
    margin-left: calc(-1 * var(--card-pad-left, 20px));
    margin-right: calc(-1 * var(--card-pad-right, 20px));
    margin-bottom: calc(-1 * var(--card-pad-bottom, 0px));
    padding: 1rem;
    background-color: rgb(235, 244, 250);
    border-bottom-left-radius: var(--card-radius, 0px);
    border-bottom-right-radius: var(--card-radius, 0px);
    font-size: .625rem;
    font-weight: 600;
    color: rgb(97, 112, 128);
    text-align: center;
  }
  .footer a {
    color: #2E4457;
    text-decoration: underline;
  }
</style>

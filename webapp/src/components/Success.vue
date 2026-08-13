<template>
  <el-card :body-style="{'padding-bottom': 0}">
    <div class="title" v-if="!parameters.redirect">
      {{ parameters.success }}
    </div>
    <div class="title" v-if="parameters.redirect">
      {{ ts('labels.purchaseSuccessful', 'Your purchase was successful.') }}
      <br><br>
      {{ ts('labels.redirecting', 'You will be redirected in 3 seconds...') }}
    </div>
  </el-card>
</template>
<script>
import translationMixin from '@/mixins/translationMixin'

export default {
  mixins: [translationMixin],
  props: ['parameters'],
  created () {
    if (this.parameters.redirect) {
      setTimeout(() => {
        let redirectUrl = this.parameters.link
        if (!redirectUrl.includes('http')) {
          redirectUrl = `http://${redirectUrl}`
        }
        window.location.assign(redirectUrl)
      }, 3000)
    }
  },
  mounted () {
    this.loadTranslationsFlag(this.parameters.account_id)
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

  .title {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: #00152a;
    text-align: center;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
</style>

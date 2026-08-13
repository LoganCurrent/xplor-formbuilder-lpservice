<template>
  <el-container v-if="finishingOauthLogin">
    <!-- Render WebIntegration once more so we can complete login! -->
    <el-card id="finishingOauthLoginCard" :body-style="{'padding-bottom': 0}" :style="'background: white;'">
      <div v-bind:data-mariana-integrations="'/account'"></div>
    </el-card>
  </el-container>
  <el-container v-else>
    <el-card id="loggingInCard" :body-style="{'padding-bottom': 0}" :style="'background: white;'">
      <div v-bind:data-mariana-integrations="'/account?login=true'"></div>
    </el-card>
 </el-container>

</template>
<script>
import { CircleSpinner } from 'vue-spinners'
import EventBus from '@/event-bus'

export default {
  name: 'MTLogin',
  props: ['parameters', 'mtoauth'],
  components: {
    CircleSpinner
  },
  created () {
    const urlParams = new URLSearchParams(window.location.search)
    const webIntegrationParams = urlParams.get('_mt')
    this.finishingOauthLogin = webIntegrationParams ? webIntegrationParams.includes('callback') : false
    this.isLoggedIn = this.mtoauth.isAuthenticated()
  },

  async mounted () {
    if (!this.finishingOauthLogin) {
      window.MTIntegrations.render()
    }

    if (this.finishingOauthLogin || this.isLoggedIn) {
      window.MTIntegrations.render()
      await this.mtoauth.waitForLogin()
      // remove the MT redirect url - which will redirect us to a different page in mt wi v4.
      const parsedUrl = new URL(window.location.href)
      window.history.replaceState({}, document.title, parsedUrl.pathname)
      EventBus.$emit('show_mt_checkout')
    }
  },
  data () {
    return {
      finishingOauthLogin: false,
      isLoggedIn: false
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
</style>

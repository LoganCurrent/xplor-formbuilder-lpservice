
<template>
   <el-container>
    <el-card :body-style="{'padding-bottom': 0}" :style="'background: white;'">
     <div data-mariana-integrations="/account/create"></div>
    </el-card>
 </el-container>
</template>
<script>
export default {
  name: 'MTSignUp',
  props: ['parameters', 'mtoauth'],
  mounted () {
    window.MTIntegrations.render()
  },
  data () {
    return {}
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

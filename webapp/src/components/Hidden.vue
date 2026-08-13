<template>
  <el-container>
    <el-card :body-style="{'padding-bottom': 0}" :style="'background: white;'">
      <div v-bind:data-mariana-integrations="'/account'"></div>
    </el-card>
 </el-container>

</template>
<script>

export default {
  name: 'Hidden',
  props: ['parameters', 'mtoauth'],
  components: {},
  created () {},
  async mounted () {},
  data () {
    return {}
  },
  methods: {}
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

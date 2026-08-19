<template>
  <div class="custom-block" :data-block-type="block.type" :style="{ textAlign: blockAlign }">
    <div
      v-if="block.type === 'system.title'"
      class="name"
      :style="systemTextStyle(18, 600)"
      v-html="inlineHtml(parameters && parameters.name, '')"
    ></div>
    <div
      v-else-if="block.type === 'system.description'"
      class="description"
      :style="systemTextStyle(16, 400)"
      v-html="descriptionHtml"
    ></div>
    <template v-else-if="block.type === 'system.price'">
      <div class="pricing" v-if="parameters && !parameters.discount" :style="systemTextStyle(20, 600)">{{ price }}</div>
      <div class="pricing" v-else-if="parameters && parameters.discount" :style="systemTextStyle(20, 600)">
        <span class="old">{{ price }}</span>{{ priceWithDiscount }}
      </div>
    </template>
    <div
      v-else-if="block.type === 'system.remaining' && parameters && parameters.globalLimit"
      class="remaining"
      :style="systemTextStyle(16, 600)"
    >
      <span v-if="parameters.remaining">Only {{ parameters.remaining }} remaining</span>
      <span v-if="parameters.remaining === 0">This item is out of stock!</span>
    </div>
    <template v-else-if="block.type === 'system.checkoutPackage'">
      <el-button
        type="primary"
        class="custom"
        :disabled="parameters && parameters.globalLimit && parameters.remaining === 0"
        :style="checkoutButtonStyle"
        @click="$emit('checkout')"
      >
        <span v-html="inlineHtml(parameters && parameters.button_text, 'Buy now')"></span>
      </el-button>
      <HelpFooter
        v-if="parameters"
        :email="parameters.email"
        :phone="parameters.phone"
        :account-id="parameters.account_id"
      />
    </template>
    <h2
      v-else-if="block.type === 'heading'"
      class="lp-heading"
      :style="headingStyle"
      v-html="inlineHtml(block.props && block.props.text, 'Heading')"
    ></h2>

    <p
      v-else-if="block.type === 'text'"
      class="lp-text"
      :style="textStyle"
      v-html="inlineHtml(block.props && block.props.text, '')"
    ></p>

    <img
      v-else-if="block.type === 'image' && block.props && block.props.src"
      class="lp-image"
      :src="block.props.src"
      :alt="block.props.alt || ''"
      :style="imageStyle"
    />
    <div
      v-else-if="block.type === 'image'"
      class="lp-image-placeholder"
    >Image</div>

    <a
      v-else-if="block.type === 'button' && block.props && block.props.href && !designMode"
      class="lp-button"
      :href="block.props.href"
      :style="buttonStyle"
      target="_blank"
      rel="noopener noreferrer"
    > <span v-html="inlineHtml(block.props && block.props.text, 'Click here')"></span></a>
    <button
      v-else-if="block.type === 'button'"
      type="button"
      class="lp-button"
      :style="buttonStyle"
    ><span v-html="inlineHtml(block.props && block.props.text, 'Click here')"></span></button>

    <hr
      v-else-if="block.type === 'divider'"
      class="lp-divider"
      :style="dividerStyle"
    />
    <div
      v-else-if="block.type === 'columns'"
      class="lp-columns"
      :style="columnsStyle"
    >
      <template v-for="(col, index) in columnLists">
        <div
          v-if="index > 0"
          :key="'div-' + index"
          class="lp-column-divider"
          :style="columnDividerStyle"
        />
        <div
          :key="'col-' + index"
          class="lp-column"
        >
        <SummaryCustomBlock
          v-for="child in col"
          :key="child.id"
          :block="child"
          :design-mode="designMode"
          :parameters="parameters"
          @checkout="$emit('checkout')"
        />
      </div>
      </template>
    </div>
  </div>
</template>

<script>
import HelpFooter from './HelpFooter.vue'
import { paddingStyleFromBlock, sanitizeInlineHtml } from '@/utils/page-layout'

export default {
  name: 'SummaryCustomBlock',
  components: { HelpFooter },
  props: {
    block: {
      type: Object,
      required: true
    },
    designMode: {
      type: Boolean,
      default: false
    },
    parameters: {
      type: Object,
      default: null
    }
  },
  computed: {
    pageFontCss () {
      var template = this.parameters && this.parameters.template
      var font = template && template['key-page-font-family']
      if (!font) {
        return ''
      }
      return String(font).indexOf(',') >= 0
        ? font
        : "'" + font + "', Helvetica, Arial, sans-serif"
    },
    blockAlign () {
      var align = this.block.props && this.block.props.align
      if (align === 'left' || align === 'right') {
        return align
      }
      return 'center'
    },
    alignMargins () {
      if (this.blockAlign === 'left') {
        return { marginLeft: 0, marginRight: 'auto' }
      }
      if (this.blockAlign === 'right') {
        return { marginLeft: 'auto', marginRight: 0 }
      }
      return { marginLeft: 'auto', marginRight: 'auto' }
    },
    headingStyle () {
      var props = this.block.props || {}
      return {
        fontSize: (props.fontSize || 24) + 'px',
        color: props.color || '#00152A',
        fontFamily: props.fontFamily || this.pageFontCss || 'Avenir, Helvetica, sans-serif',
        fontWeight: props.fontWeight || 600,
        textAlign: this.blockAlign,
        margin: 0
      }
    },
    textStyle () {
      var props = this.block.props || {}
      return {
        fontSize: (props.fontSize || 16) + 'px',
        color: props.color || '#00152A',
        fontFamily: props.fontFamily || this.pageFontCss || 'Avenir, Helvetica, sans-serif',
        lineHeight: 1.5,
        textAlign: this.blockAlign,
        margin: 0
      }
    },
    imageStyle () {
      var props = this.block.props || {}
      return Object.assign({
        width: (props.width || 100) + '%',
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        marginBottom: 0
      }, this.alignMargins)
    },
    buttonStyle () {
      var props = this.block.props || {}
      return Object.assign({
        display: 'inline-block',
        width: 'auto',
        minWidth: '10rem',
        textAlign: 'center',
        backgroundColor: props.backgroundColor || '#00152A',
        color: props.color || '#FFFFFF',
        border: 'none',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 600,
        margin: 0,
        cursor: this.designMode ? 'default' : 'pointer'
      }, paddingStyleFromBlock(this.block))
    },
    dividerStyle () {
      var props = this.block.props || {}
      return Object.assign({
        border: 'none',
        borderTop: (props.thickness || 1) + 'px solid ' + (props.color || '#D9E7F0'),
        width: '100%',
        marginTop: 0,
        marginBottom: 0
      }, this.alignMargins)
    },
    columnLists () {
      var count = Number(this.block.props && this.block.props.count) === 3 ? 3 : 2
      var source = Array.isArray(this.block.columns) ? this.block.columns : []
      var lists = []
      for (var i = 0; i < count; i++) {
        lists.push(Array.isArray(source[i]) ? source[i] : [])
      }
      return lists
    },
    columnsStyle () {
      var count = Number(this.block.props && this.block.props.count) === 3 ? 3 : 2
      var gap = Number((this.block.props && this.block.props.gap) || 16)
      return {
        display: 'grid',
        gridTemplateColumns: count === 3 ? '1fr auto 1fr auto 1fr' : '1fr auto 1fr',
        columnGap: gap + 'px',
        alignItems: 'stretch',
        width: '100%'
      }
    },
    columnDividerStyle () {
      var props = this.block.props || {}
      return {
        width: (props.dividerThickness || 1) + 'px',
        backgroundColor: props.dividerColor || '#D9E7F0',
        alignSelf: 'stretch',
        minHeight: '1.25rem'
      }
    },
    checkoutButtonStyle () {
      var color = (this.parameters && this.parameters.button_color) || '#00152A'
      return Object.assign({
        width: '100%',
        backgroundColor: color,
        borderColor: color
      }, paddingStyleFromBlock(this.block))
    },
    hasTaxInfo () {
      return this.parameters && this.parameters.hasOwnProperty('displayInclusiveTax')
    },
    price () {
      if (!this.parameters || !this.parameters.product) return ''
      var basePrice = this.parameters.product.price
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return Number(basePrice).toLocaleString(undefined, {
        style: 'currency',
        currency: this.parameters.currency
      })
    },
    priceWithDiscount () {
      if (!this.parameters || !this.parameters.product) return ''
      var basePrice = this.parameters.product.price - this.parameters.discount
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
      var urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g
      return String(this.parameters.description).replace(urlRegex, function (url) {
        var href = url.indexOf('www.') === 0 ? 'http://' + url : url
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
      })
    },
    descriptionHtml () {
      var raw = (this.parameters && this.parameters.description) || ''
      var sanitized = sanitizeInlineHtml(raw)
      if (/<(?:b|strong|i|em|u|s|strike|del|br)\b/i.test(sanitized)) {
        return sanitized
      }
      return this.descriptionWithLinks
    }
  },
  methods: {
    inlineHtml (value, fallback) {
      if (value == null || value === '') {
        return fallback || ''
      }
      return sanitizeInlineHtml(value)
    },
    systemTextStyle (defaultSize, defaultWeight) {
      var props = (this.block && this.block.props) || {}
      var style = { textAlign: this.blockAlign }
      if (props.fontSize) {
        style.fontSize = props.fontSize + 'px'
      } else if (defaultSize) {
        style.fontSize = defaultSize + 'px'
      }
      if (props.color) {
        style.color = props.color
      }
      if (props.fontFamily) {
        style.fontFamily = props.fontFamily
      } else if (this.pageFontCss) {
        style.fontFamily = this.pageFontCss
      }
      if (props.fontWeight || defaultWeight) {
        style.fontWeight = props.fontWeight || defaultWeight
      }
      return style
    }
  }
}
</script>

<style scoped>
  .lp-column {
    min-width: 0;
  }
  .lp-image-placeholder {
    width: 100%;
    min-height: 120px;
    margin-bottom: 0;
    background: #f3f6f9;
    border: 1px dashed #d9e7f0;
    color: #617080;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
  }
</style>

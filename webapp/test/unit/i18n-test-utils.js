import VueI18n from 'vue-i18n'
import en from '../../src/i18n/locales/en.json'

export const createTestI18n = (messages, locale = 'en') => new VueI18n({
  locale,
  fallbackLocale: 'en',
  messages: messages || { en }
})

export const createElementUIMocks = () => ({
  $message: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  },
  $notify: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  },
  $confirm: jest.fn()
})

export const elementUiStubs = {
  'el-button': true,
  'el-dialog': true,
  'el-form': true,
  'el-form-item': true,
  'el-input': true,
  'el-select': true,
  'el-option': true
}

export { VueI18n }

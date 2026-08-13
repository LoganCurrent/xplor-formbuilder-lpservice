import {
  get as getCookie
} from 'es-cookie'
import * as Sentry from '@sentry/browser'

class MTOauth {
  constructor (domain) {
    this.subdomain = domain
  }

  async rafAsync () {
    return new Promise(resolve => {
      // faster than set time out
      setTimeout(resolve, 500)
      // requestAnimationFrame(resolve)
    })
  }

  async checkElement (selector) {
    if (document.querySelector(selector) === null) {
      return this.rafAsync().then(() => this.checkElement(selector))
    } else {
      return Promise.resolve(true)
    }
  }
  async waitASecond () {
    return new Promise(resolve => {
      setTimeout(resolve, 1000)
    })
  }

  async waitForLogin () {
    // we need a way to figure out if a user has logged into MT webintegrations.
    // We can do this by polling a cookie.
    if (!this.isAuthenticated()) {
      return this.waitASecond().then(() => this.waitForLogin())
    }
  }

  isAuthenticated () {
    const isAuthenticated = getCookie(`mt.is.authenticated.https://${this.subdomain}.marianaiframes.com`)
    if (!isAuthenticated) return false
    return isAuthenticated
  }

  getAccessToken () {
    const cookie = getCookie(`mt.token.https://${this.subdomain}.marianaiframes.com`)
    const parsedCookie = JSON.parse(cookie)
    return parsedCookie.tokenData.accessToken
  }

  getLoggedInUserId () {
    let data = JSON.parse(localStorage.getItem(`mt.https://${this.subdomain}.marianatek.com`))
    if (data.userId) { return data.userId }

    // retry again for safe measure. A bit hacky but should work okay.
    data = JSON.parse(localStorage.getItem(`mt.https://${this.subdomain}.marianatek.com`))
    if (data.userId) { return data.userId }
    Sentry.addBreadcrumb({
      mtLocalStorageKey: `mt.https://${this.subdomain}.marianatek.com`,
      mtLocalStorageData: data
    })
    throw Error('Could not find user id!')
  }
}

export default MTOauth

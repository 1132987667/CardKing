const deviceDetector = {
  isMobile() {
    if (typeof window === 'undefined') return false
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|kindle|silk|playbook|bb10|meego/i
    
    if (mobileRegex.test(userAgent.toLowerCase())) {
      return true
    }
    
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) {
      return true
    }
    
    return window.innerWidth <= 768
  },

  isTablet() {
    if (typeof window === 'undefined') return false
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    
    const tabletRegex = /ipad|android(?!.*mobile)|tablet|playbook|silk/i
    
    if (tabletRegex.test(userAgent.toLowerCase())) {
      return true
    }
    
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) {
      return true
    }
    
    return window.innerWidth > 768 && window.innerWidth <= 1024
  },

  isDesktop() {
    return !this.isMobile() && !this.isTablet()
  },

  getDeviceType() {
    if (this.isTablet()) return 'tablet'
    if (this.isMobile()) return 'mobile'
    return 'desktop'
  },

  getOS() {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    
    if (/android/i.test(userAgent)) return 'android'
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios'
    if (/Win/.test(userAgent)) return 'windows'
    if (/Mac/.test(userAgent)) return 'macos'
    if (/Linux/.test(userAgent)) return 'linux'
    
    return 'unknown'
  },

  getBrowser() {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent
    
    if (/chrome|chromium|crios/i.test(userAgent)) return 'chrome'
    if (/firefox|fxios/i.test(userAgent)) return 'firefox'
    if (/safari/i.test(userAgent) && !/chrome|chromium|crios/i.test(userAgent)) return 'safari'
    if (/edg/i.test(userAgent)) return 'edge'
    if (/opera|opr/i.test(userAgent)) return 'opera'
    
    return 'unknown'
  },

  supportsTouch() {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           navigator.msMaxTouchPoints > 0
  },

  getScreenInfo() {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0, pixelRatio: 1 }
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    }
  },

  isLandscape() {
    if (typeof window === 'undefined') return false
    return window.innerWidth > window.innerHeight
  },

  isPortrait() {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= window.innerHeight
  },

  onResize(callback) {
    if (typeof window === 'undefined') return () => {}
    
    const handler = () => callback(this.getDeviceType(), this.getScreenInfo())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  },

  onOrientationChange(callback) {
    if (typeof window === 'undefined') return () => {}
    
    const handler = () => callback(this.isLandscape() ? 'landscape' : 'portrait')
    
    window.addEventListener('orientationchange', handler)
    window.addEventListener('resize', handler)
    
    return () => {
      window.removeEventListener('orientationchange', handler)
      window.removeEventListener('resize', handler)
    }
  }
}

export default deviceDetector

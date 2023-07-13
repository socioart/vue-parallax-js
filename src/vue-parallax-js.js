const window = global.window
const document = global.document

const ParallaxJS = function (os) {
  this.os = os

  this.container = null

  this._bindContainer = () => {
    this.container = document.querySelector(this.os.container)
  }
}

ParallaxJS.prototype = {
  items: [],
  active: true,

  tProp: window && window.transformProp || (function () {
    const testEl = document ? document.createElement('div') : null
    if (testEl && testEl.style.transform == null) {
      const vs = ['Webkit', 'Moz', 'ms']
      const t = 'Transform'
      for (const v of vs) {
        if (testEl.style[ v + t ] !== undefined) {
          return v + t
        }
      }
    }
    return 'transform'
  })(),

  remove(el, binding) {
    for(let item of this.items){
      if(item.el === el){
        this.items.splice(this.items.indexOf(el), 1)
      }
    }
  },

  add (el, binding) {
    if (!window) return
    const value = binding.value
    const arg = binding.arg
    const style = el.currentStyle || window.getComputedStyle(el)
    const mod = binding.modifiers

    if (style.display === 'none') return

    const height = mod.absY ? window.innerHeight : el.clientHeight || el.scrollHeight
    const width = mod.absY ? window.innerWidth : el.clientWidth || el.scrollWidth

    const cl = this.os.className
    if (typeof cl === 'string') {
      el.className = `${el.className} ${cl}`.trim()
    }

    this.items.push({
      el: el,
      iOT: el.offsetTop + el.offsetParent.offsetTop - parseInt(style.marginTop),
      style,
      value,
      arg,
      mod,
      height,
      width,
      count: 0
    })
  },
  update () {
    if (!window) return
    this.items.forEach(function (item) {
      const t = item.el
      const n = t.currentStyle || window.getComputedStyle(t)

      item.height = item.mod.absY ? window.innerHeight : t.clientHeight || t.scrollHeight
      item.width = item.mod.absX ? window.innerWidth : t.clientWidth || t.scrollWidth

      if(t.offsetParent !== null)
        item.iOT = t.offsetTop + t.offsetParent.offsetTop - parseInt(n.marginTop)


    })
  },
  move () {
    if (!window) return
    if (!this.active) return
    if (window.innerWidth < this.os.minWidth || 0) {
      this.items.forEach((item) => {
        item.el.style[this.tProp] = ``
      })
 
      return
    }

    const sT = this.container ? this.container.scrollTop : window.scrollY || window.pageYOffset
    const wH = window.innerHeight
    const wW = window.innerWidth

    this.items.forEach((item) => {
      const elH = item.height
      const elW = item.width
      const offset = item.iOT * -1 * item.value
      const pos = (((sT + wH) - (elH / 2) - (wH / 2)) * item.value) + offset
      const posY = (((sT + wW) - (elW / 2) - (wW / 2)) * item.value) + offset

      window.requestAnimationFrame(() => {
        const cx = item.mod.centerX ? '-50%' : '0px'
        const props = !item.mod.horizontal ? `translate3d(${cx},${pos.toFixed(3)}px,0px)` : `translate3d(${posY.toFixed(3)}px,0px,0px)`
        item.el.style[this.tProp] = props
      })
    })
  }
}

export default {
  install (Vue, os = {}) {
    if (!window) return
    const p = new ParallaxJS(os)

    if (os.container) {
      Vue.mixin({
        mounted() {
          if(this.$parent) return

          p._bindContainer()

          p.container.addEventListener('scroll', () => {
            p.update()
            p.move(p)
          }, { passive: true })
        }
      })
    } else {
      window.addEventListener('scroll', () => {
        p.update()
        p.move(p)
      }, { passive: true })
    }

    window.addEventListener('resize', () => {
      p.update()
      p.move(p)
    }, { passive: true })

    Vue.config.globalProperties.$parallaxjs = p
    window.$parallaxjs = p
    Vue.directive('parallax', {
      mounted (el, binding) {
        p.add(el, binding)
        p.move(p)
      },
      unbind(el, binding){
        p.remove(el, binding)
      }
    })
  }
}

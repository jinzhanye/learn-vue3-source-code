// https://www.yuque.com/marvinxu/pbvcut/gvtw7i

const targetMap = new WeakMap()
let activeEffect = null // The active effect running

function computed(getter) {
  const result = ref()
  effect(() => {
    result.value = getter()
  })
  return result
}

function effect(eff) {
  activeEffect = eff
  activeEffect()
  activeEffect = null
}

function ref(raw) {
  const r = {
    get value() {
      track(r, 'value')
      return raw
    },
    set value(newVal) {
      if (raw !== newVal) {
        raw = newVal
        trigger(r, 'value')
      }
    }
  }
  return r
}

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }

    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  let dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      effect()
    })
  }
}

function reactive(target) {
  const handler = {
    get(target, key, receiver) {
      // receiver 用于保证 reactive 即使被继承 get、set 也依然有效
      let result = Reflect.get(target, key, receiver)
      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      let oldValue = target[key]
      let result = Reflect.set(target, key, value, receiver)
      if (oldValue !== result) {
        trigger(target, key)
      }
      return result
    }
  }

  return new Proxy(target, handler)
}

const product = reactive({ price: 5, quantity: 2 })

const salePrice = computed(() => {
  return product.price * 0.9
})

const total = computed(() => {
  return  salePrice.value * product.quantity
})

console.log(
  `Before updated total (should be 9) = ${ total.value } salePrice (should be 4.5) = ${ salePrice.value }`
)

product.quantity = 3
console.log(
  `After updated total (should be 13.5) = ${ total.value } salePrice (should be 4.5) = ${ salePrice.value }`
)

product.price = 10
console.log(
  `After updated total (should be 27) = ${ total.value } salePrice (should be 9) = ${ salePrice.value }`
)

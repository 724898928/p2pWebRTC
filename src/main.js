import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.config.productionTip = false
Vue.use(ElementUI)
const root = document.createElement('div')
document.body.appendChild(root)
new Vue({
  render: h => h(App),
}).$mount(root)

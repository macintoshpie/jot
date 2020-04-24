import Vue from 'vue'
import App from './App.vue'
import VueNativeNotification from 'vue-native-notification'

Vue.config.productionTip = false

Vue.use(VueNativeNotification, {
  // Automatic permission request before
  // showing notification (default: true)
  requestOnNotify: true
})

Vue.notification.requestPermission()
  .then(console.log)

new Vue({
  render: h => h(App),
}).$mount('#app')

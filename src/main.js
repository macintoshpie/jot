import Vue from 'vue'
import App from './App.vue'

import Vuex from 'vuex'
import VueNativeNotification from 'vue-native-notification'

Vue.config.productionTip = false

Vue.use(Vuex)

const STORAGE_KEY = 'jot-app'

const loadJots = () => {
  const jots = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  // process some attributes of the jot
  jots.forEach((jot, i) => {
    jot.id = i.toString()
    jot.reminder = { time: null, reminder: null }
  })
  return jots
}

const saveJots = (jots) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jots))
}

const jots = loadJots()

const colors = [
  "#F1F1F1",
  "#FFEBFA",
  "#FFF4F1",
  "#FFFDFA",
  "#EEFEFF"
]

const getJotById = (jots, id) => {
  const jotIdx = jots.findIndex(j => j.id === id)
  if (jotIdx >= 0) {
    return jots[jotIdx]
  }
  return null
}

const store = new Vuex.Store({
  state: {
    jots,
    idTracker: jots.length
  },

  mutations: {
    createJot(state) {
      const id = state.idTracker.toString()
      state.jots.push({
        id,
        header: `Note ${id}`,
        rawContent: '',
        geometry: {
          top: 20, left: 20, height: 250, width: 300
        },
        zIndex: jots.length,
        hidden: false,
        color: colors[Math.floor(Math.random() * colors.length)],
        reminder: {
          time: null,
          display: null
        }
      })

      state.idTracker += 1
    },
    removeJot(state, id) {
      const jotIdx = state.jots.findIndex(j => j.id === id)
      if (jotIdx >= 0) {
        const removedJot = state.jots.splice(jotIdx, 1)[0]
        const jotZIndex = removedJot.zIndex
        // if the jot was already at the front, there's no need to reorder
        if (jotZIndex === state.jots.length) {
          return;
        }

        // bump the zIndex of jots that were in front of this one down
        state.jots.forEach(jot => {
          if (jot.zIndex > jotZIndex) {
            jot.zIndex -= 1
          }
        })
      }
    },
    setJotHeader(state, { id, header }) {
      const jot = getJotById(state.jots, id)
      if (jot !== null) {
        jot.header = header
      }
    },
    setJotContent(state, { id, rawContent }) {
      const jot = getJotById(state.jots, id)
      if (jot !== null) {
        jot.rawContent = rawContent
      }
    },
    setJotHidden(state, { id, hidden }) {
      const jot = getJotById(state.jots, id)
      if (jot !== null) {
        jot.hidden = hidden
      }
    },
    setJotGeometry(state, { id, geometry }) {
      const jot = getJotById(state.jots, id)
      if (jot !== null) {
        jot.geometry = geometry
      }
    },
    setJotReminder(state, { id, reminder }) {
      const jot = getJotById(state.jots, id)
      if (jot !== null) {
        jot.reminder = reminder
      }
    },
    bringJotToFront(state, id) {
      const jot = getJotById(state.jots, id)
      if (jot !== null) {
        const frontZIndex = state.jots.length - 1
        const originalZIndex = jot.zIndex
        state.jots.forEach(jot => {
          if (jot.id === id) {
            jot.zIndex = frontZIndex
          } else if (jot.zIndex > originalZIndex) {
            jot.zIndex -= 1
          }
        })
      }
    },
  },
})

// Save jots to localStorage on change
store.subscribe((mutation, state) => {
	saveJots(state.jots)
});

Vue.use(VueNativeNotification, {
  // Automatic permission request before
  // showing notification (default: true)
  requestOnNotify: true
})

Vue.notification.requestPermission()
  .then(console.log)

new Vue({
  render: h => h(App),
  store,
}).$mount('#app')

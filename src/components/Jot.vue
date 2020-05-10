<template>
  <div
    ref="jot"
    class="jot"
    :style="containerStyle"

    draggable="true"
    @dragstart="dragStart"
    @dragend="dragEnd"
    @click="bringJotToFront(id)">

    <span class="header-container">
      <button class="hide-btn" @click="toggleHidden">-</button>
      <input
        type="text"
        ref="header"

        :value="header"
        :class="{ header: true, noselect: !headerEditable }"
        :readonly="!headerEditable"
        :style="{ 'background-color': color }"

        @input="setThisHeader"
        @keyup.enter="focusContent"
        @dblclick="enableHeaderEdit"
        @blur="disableHeaderEdit"
        />
      <button class="delete-btn" @click="deleteThis">☐</button>
    </span>
    <textarea ref="content" :value="rawContent" @input='setThisContent' :style="{ 'background-color': color }"/>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
const validNumber = (n) => {
  return !isNaN(n) && n !== undefined
}

const parseReminder = (timeString) => {
  // returns a parsed Date object from a string
  if (timeString.startsWith('+')) {
    const matches = timeString.match(/\+(\d+h)?(\d+m)?(\d+s)?/)
    const [, h, m, s] = matches.map(x => parseInt(x))
    let seconds = 0
    seconds += validNumber(h) ? h * 3600 : 0
    seconds += validNumber(m) ? m * 60 : 0
    seconds += validNumber(s) ? s : 0
    if (seconds === 0) {
      return null;
    }
    let now = new Date()
    return new Date(now.getTime() + seconds * 1000);
  } else {
    const [h, m, s] = timeString.split(':').map(x => parseInt(x))
    if (!validNumber(h) || !validNumber(m) || !validNumber(s)) {
      return null;
    }

    let reminder = new Date()
    reminder.setHours(h, m, s)
    return reminder
  }
}

export default {
  name: 'Jot',
  props: {
    id: String,
    header: String,
    rawContent: String,
    geometry: {
      top: Number,
      left: Number,
      width: Number,
      height: Number,
    },
    hidden: Boolean,
    color: String
  },
  data: function() {
    return {
      headerEditable: false,
      origMouseX: null,
      origMouseY: null,
      timerId: null,
      observer: null, // used for tracking resizing, initialized on mount
    }
  },

  mounted() {
    const jotContainer = this.$refs.jot

    // add a mutation observer to keep track of width and height
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // check if the mutation is attributes and update the width and height data if it is.
        // also check if currently hidden (can't change width or height when hidden)
        if (mutation.type !== "attributes" || this.hidden) {
          return;
        }

        const {
          width,
          height
        } = jotContainer.style;

        // strip trailing 'px' and convert to int
        const widthInt = parseInt(width.slice(0, -2))
        const heightInt = parseInt(height.slice(0, -2))

        this.$store.commit('setJotGeometry', {
          id: this.id,
          geometry: {
            ...this.geometry,
            width: widthInt,
            height: heightInt
          }
        })
      })
    })

      // observe element's specified mutations
      observer.observe(jotContainer, { attributes: true })
      // add the observer to data so we can disconnect it later
      this.observer = observer
  },

  methods: {
    ...mapMutations([
      'bringJotToFront'
    ]),
    deleteThis: function() {
      if (this.timerId !== null) {
        clearTimeout(this.timerId)
      }
      this.$store.commit('removeJot', this.id)
    },
    setThisContent: function() {
      this.$store.commit('setJotContent', { id: this.id, rawContent: this.$refs.content.value })
    },
    setThisHeader: function() {
      this.$store.commit('setJotHeader', { id: this.id, header: this.$refs.header.value })
    },
    toggleHidden: function() {
      this.$store.commit('setJotHidden', { id: this.id, hidden: !this.hidden })
    },
    enableHeaderEdit: function () {
      this.headerEditable = true
    },
    disableHeaderEdit: function() {
      this.headerEditable = false
    },
    focusContent: function() {
      if (!this.hidden) {
        this.$refs.content.focus()
      } else {
        this.$refs.header.blur()
      }
    },
    dragStart: function(e) {
      this.origMouseX = e.screenX
      this.origMouseY = e.screenY
    },
    dragEnd: function(e) {
      const leftDiff = e.screenX - this.origMouseX
      const topDiff = e.screenY - this.origMouseY
      const geometry = {
        ...this.geometry,
        top: this.geometry.top + topDiff,
        left: this.geometry.left + leftDiff,
      }
      this.$store.commit('setJotGeometry', { id: this.id, geometry })
    },

  },
  computed: {
    containerStyle: function() {
      return {
        top: `${this.geometry.top}px`,
        left: `${this.geometry.left}px`,
        'background-color': this.color,
        height: this.hidden ? '20px' : `${this.geometry.height}px`,
        width: `${this.geometry.width}px`,
        resize: this.hidden ? 'none' : 'both'
      }
    },

  },
  watch: {
    headerEditable: function() {
      if (this.headerEditable) {
        return;
      }

      // done editing the header, try to parse it as a command
      let newTimerId;
      if (this.header.startsWith('/reminder')) {
        // cancel existing reminder
        if (this.timerId !== null) {
          clearTimeout(this.timerId)
        }

        // parse the time
        const [, timeString] = this.header.split(/\s+/)
        if (timeString === undefined) {
          return
        }

        const reminder = parseReminder(timeString)
        if (reminder === null) {
          return;
        }

        const now = new Date()
        const delta = Math.abs(reminder - now)
        // eslint-disable-next-line
        newTimerId = setTimeout(() => {
          this.$notification.show('Jot Reminder', {
            body: this.rawContent,
          }, {
            'onclick': () => {
              this.$store.commit('bringJotToFront', this.id)
            }
          })
          this.$store.commit('setJotReminder', { id: this.id, reminder: { time: null, display: null } })
        }, delta)
        this.$store.commit('setJotReminder', {id: this.id, reminder: { time: reminder, display: timeString } })
      }
      else {
        newTimerId = null
      }

      this.timerId = newTimerId
    }
  },

  beforeDestroy() {
    if (this.observer) this.observer.disconnect();
  }
}
</script>

<style scoped>
h3 {
  text-align: center;
}

.jot {
  border: 1px solid;
  position: absolute;
  overflow: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.header-container {
  display: flex;
  justify-content: space-between;
  padding: 5px;
}

.header {
  font-family: 'Courier New', Courier, monospace;
  font-size: medium;
  font-style: bold;
  width: 100%;
  border: none;
}

.delete-btn {
  border-radius: 5px;
}

textarea {
  overflow-y: scroll;
  resize: none;
  width: 100%;
  /* height: auto; */
  border: none;
  font-family: 'Courier New', Courier, monospace;
  flex-grow: 1;
}

.noselect {
  -webkit-touch-callout: none;
    -webkit-user-select: none;
     -khtml-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
}
</style>
<template>
  <div
    ref='jot'
    class="jot"
    v-bind:style="containerStyle"
    draggable="true"
    v-on:dragstart="dragStart"
    v-on:dragend="dragEnd"
    @click="$emit('clickJot')">
    <span class='header-container'>
      <button class='hide-btn' v-on:click="toggleHide">-</button>
      <input
        v-bind:class="{ header: true, noselect: !headerEditable }"
        type='text'
        v-bind:readonly="!headerEditable"
        v-bind:style="{ 'background-color': color }"
        v-model='header'
        v-on:keyup.enter="focusContent"
        v-on:dblclick="enableHeaderEdit"
        v-on:blur="disableHeaderEdit"
        />
      <button class='delete-btn' v-on:click="deleteThis">☐</button>
    </span>
    <textarea ref='content' v-model='rawContent' v-bind:style="{ 'background-color': color }"/>
  </div>
</template>

<script>
const colors = [
  "#F1F1F1",
  "#FFEBFA",
  "#FFF4F1",
  "#FFFDFA",
  "#EEFEFF"
]

const validNumber = (n) => {
  return !isNaN(n) && n !== undefined
}

export default {
  name: 'Jot',
  props: {
    id: String
  },
  data: function() {
    return {
      header: `Note ${this.id}`,
      headerEditable: false,
      color: colors[Math.floor(Math.random() * colors.length)],
      rawContent: '', // raw text
      containerGeom: {
        top: 20,
        left: 20,
        height: 250,
      },
      origMouseX: null,
      origMouseY: null,
      reminder: null,
      hidden: false,
    }
  },
  methods: {
    deleteThis: function() {
      if (this.reminder !== null) {
        clearTimeout(this.reminder)
        this.$emit('cancelReminder', {id: this.id, timeoutId: this.reminder})
      }
      this.$emit('removeJot', {id: this.id})
    },
    toggleHide: function() {
      this.hidden = !this.hidden
    },
    enableHeaderEdit: function () {
      this.headerEditable = true
    },
    disableHeaderEdit: function() {
      this.headerEditable = false
    },
    focusContent: function() {
      this.$refs.content.focus()
    },
    dragStart: function(e) {
      // e.stopPropagation()
      this.origMouseX = e.screenX
      this.origMouseY = e.screenY
    },
    dragEnd: function(e) {
      // e.stopPropagation()
      const leftDiff = e.screenX - this.origMouseX
      const topDiff = e.screenY - this.origMouseY
      this.containerGeom.top += topDiff // e.screenX
      this.containerGeom.left += leftDiff // e.screenY
    }
  },
  computed: {
    containerStyle: function() {
      return {
        top: `${this.containerGeom.top}px`,
        left: `${this.containerGeom.left}px`,
        'background-color': this.color,
        height: this.hidden ? '25px' : `${this.containerGeom.height}px`,
        resize: this.hidden ? 'none' : 'both'
      }
    },
    parsedContent: function() {
      const result = this.rawContent.split(/\r?\n/).map((line) => {
        if (line.startsWith('/')) {
          // parse a command
          return {
            type: 'meta',
            command: 'notify',
            content: line
          }
        }
        return {
          type: 'text',
          content: line
        }
      })
      return result
    },
  },
  watch: {
    headerEditable: function() {
      if (this.headerEditable) {
        return;
      }

      let newReminder;
      if (this.header.startsWith('/reminder')) {
        // cancel existing reminder
        if (this.reminder !== null) {
          console.log('Cancelling previous timeout')
          this.$emit('cancelReminder', {id: this.id, timeoutId: this.reminder})
          clearTimeout(this.reminder)
        }

        // parse the time
        const [, timeString] = this.header.split(/\s+/)
        if (timeString === undefined) {
          return
        }
        let reminder;
        if (timeString.startsWith('+')) {
          const matches = timeString.match(/\+(\d+h)?(\d+m)?(\d+s)?/)
          const [, h, m, s] = matches.map(x => parseInt(x))
          let seconds = 0
          if (validNumber(h)) {
            seconds += h * 3600
          }
          if (validNumber(m)) {
            seconds += m * 60
          }
          if (validNumber(s)) {
            seconds += s
          }
          if (seconds === 0) {
            return
          }
          reminder = new Date()
          reminder = new Date(reminder.getTime() + seconds * 1000);
        } else {
          const [h, m, s] = timeString.split(':').map(x => parseInt(x))
          if (!validNumber(h) || !validNumber(m) || !validNumber(s)) {
            return;
          }

          reminder = new Date()
          reminder.setHours(h, m, s)
        }

        const now = new Date()
        const delta = Math.abs(reminder - now)
        console.log('Setting timeout: ', delta)
        // eslint-disable-next-line
        newReminder = setTimeout(() => {
          this.$notification.show('Hello World', {
            body: this.rawContent,
          }, {
            'onclick': () => {
              this.$emit('clickJot')
            }
          })
          this.$emit('cancelReminder', {id: this.id})
        }, delta)
        this.$emit('setReminder', {id: this.id, timeoutId: this.reminder, time: timeString})
      }
      else {
        newReminder = null
      }

      this.reminder = newReminder
    }
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
  z-index: 9;
  width: 300px;
  height: 250px;
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
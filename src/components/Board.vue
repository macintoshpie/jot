<template>
  <div id='board'>
    <button v-on:click="createJot">new</button>
    <Jot v-for="jot in jots" v-bind:key="jot.id" :id="jot.id" v-bind:style="{ 'z-index': jot.zIndex }" @removeJot="removeJot" @clickJot="bringToFront(jot)" @setReminder="setReminder" @cancelReminder="cancelReminder"/>
    <div id='reminders'>
      upcoming reminders: <button v-for="reminder in reminders" v-bind:key="reminder.id" @click=bringToFront(reminder)>{{ reminder.time }}</button>
    </div>
  </div>
</template>

<script>
import Jot from './Jot'
export default {
  name: 'Board',
  components: {
    Jot
  },
  data: function() {
    return {
      jots: [],
      reminders: [],
      idTracker: 0,
    }
  },
    
  methods: {
    setReminder: function(reminder) {
      this.reminders.push(reminder)
    },
    cancelReminder: function(reminder) {
      const reminderIdx = this.reminders.findIndex(r => r.id === reminder.id)
      if (reminderIdx !== undefined) {
        this.reminders.splice(reminderIdx, 1)
      }
    },
    createJot: function() {
      this.jots.push({id: this.idTracker.toString(), zIndex: 9 })
      this.idTracker += 1
    },
    removeJot: function(e) {
      const jotIdx = this.jots.findIndex(j => j.id === e.id)
      if (jotIdx !== undefined) {
        this.jots.splice(jotIdx, 1)
      }
    },
    bringToFront: function(targetJot) {
      this.jots.forEach(j => {
        if (j.id == targetJot.id) {
          j.zIndex = 10
        } else {
          j.zIndex = 9
        }
      })
    }
  }
}
</script>

<style scoped>
#reminders {
  position: absolute;
  bottom: 10px;
  width: 100%;
  color: white;
  display: flex;
  flex-direction: row;
  font-family: 'Courier New', Courier, monospace;
}
</style>
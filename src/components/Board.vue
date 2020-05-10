<template>
  <div id='board'>
    <button v-on:click="createJot">new</button>
    <Jot
      v-for="jot in jots"
      :key="jot.id"
      v-bind="jot"

      :style="{ 'z-index': jot.zIndex }"/>
    <div id='reminders'>
      upcoming reminders:
      <button
        v-for="jotReminder in jotReminders"
        :key="jotReminder.id"
        @click=bringToFront(jotReminder.id)>
        {{ jotReminder.reminder.display }}
      </button>
    </div>
  </div>
</template>

<script>
import Jot from './Jot'

import { mapState, mapMutations } from 'vuex'

export default {
  name: 'Board',
  components: {
    Jot
  },

  computed: {
    ...mapState(['jots']),
    jotReminders: function() {
      // return the jots that have reminders set
      return this.jots.filter(jot => jot.reminder.time !== null)
    }
  },

  methods: {
    ...mapMutations([
      'createJot',
      'brintJotToFront',
    ])
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
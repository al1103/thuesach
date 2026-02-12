<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useLibraryStore } from './stores/library'

const store = useLibraryStore()

onMounted(() => {
  store.init()
})
</script>

<template>
  <RouterView />
</template>

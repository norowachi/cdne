<!-- FileSearch.vue -->

<template>
  <div>
    <input v-model="userInput" @input="searchFiles" placeholder="Type your query" />
    <div v-if="closestMatch">
      <p>Closest match found: {{ closestMatch }}</p>
      <img :src="getImageUrl(closestMatch)" alt="Closest Match" />
    </div>
    <div v-else>
      <p>No match found.</p>
    </div>

    <h2>Available Images:</h2>
    <ul>
      <li v-for="file in fileList" :key="file">
        {{ file }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Fuse from 'fuse.js'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSeoMeta } from '@unhead/vue'

onMounted(() => {
  console.log('FileSearch component mounted')
})

export default {
  data() {
    return {
      userInput: '',
      closestMatch: null as string | null,
      availableImages: [] as string[],
      fileList: [] as string[],
      fuse: new Fuse<string>([], {
        keys: ['item'],
        includeScore: true
      })
    }
  },
  async created() {
    try {
      // Dynamically import all files from the public directory
      const context = import.meta.glob('/public/*.{png,jpg,jpeg,gif,svg}')
      this.fileList = Object.keys(context).map((key) => key.replace('/public/', ''))
      this.updateFuseInstance()

      // Fetch the current route parameter and trigger search
      this.handleRouteChange()
    } catch (error) {
      console.error('Error loading file list:', error)
    }
  },
  watch: {
    // Watch for changes in the route and trigger search
    $route: 'handleRouteChange'
  },
  methods: {
    searchFiles() {
      // Try inline search
      const inlineMatch = this.findClosestMatch(this.userInput)

      if (inlineMatch) {
        this.closestMatch = inlineMatch
      } else {
        // Fallback to fuzzy search
        const fuzzyMatches = this.fuse.search(this.userInput)
        if (fuzzyMatches.length > 0) {
          // Return the first fuzzy match as the closest match
          this.closestMatch = fuzzyMatches[0].item
        } else {
          this.closestMatch = null
        }
      }

      console.log('Closest match:', this.closestMatch)
      this.updateOpenGraphMetadata()
    },
    findClosestMatch(query: string): string | null {
      const matches = this.availableImages.filter((image) =>
        image.toLowerCase().includes(query.toLowerCase())
      )

      if (matches.length > 0) {
        // Return the first match as the closest match
        return matches[0]
      } else {
        return null
      }
    },
    getImageUrl(filename: string): string {
      // Assuming images are in the "public" folder
      return `/${filename}`
    },
    updateFuseInstance() {
      // Update the Fuse instance when fileList changes
      this.fuse = new Fuse<string>(
        this.fileList.map((item) => item),
        {
          keys: ['item'],
          includeScore: true
        }
      )
    },
    handleRouteChange() {
      const route = useRoute()

      // Extract the search query from the route parameter
      const query = route.params.query as string | undefined
      if (query) {
        this.userInput = query
        this.searchFiles()
      }
    },
    updateOpenGraphMetadata() {
      console.log('Updating Open Graph metadata:', this.closestMatch)
      useSeoMeta({
        title: this.closestMatch,
        ogTitle: this.closestMatch,
        ogImage: `https://cdne.pages.dev${this.getImageUrl(this.closestMatch!)}`
      })
    }
  }
}
</script>

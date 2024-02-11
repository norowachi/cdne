<template>
  <header>
    <img alt="Vue logo" class="logo" src="/assets/favicon.ico" width="125" height="125" />
  </header>

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
import { useSeoMeta } from '@unhead/vue'

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
      const context = import.meta.glob('/public/assets/*.{png,jpg,jpeg,gif,svg}')
      this.fileList = Object.keys(context).map((key) => key.replace('/public/assets/', ''))
      this.updateFuseInstance()
    } catch (error) {
      console.error('Error loading file list:', error)
    }
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
      return `/assets/${filename}`
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
    updateOpenGraphMetadata() {
      console.log('Updating Open Graph metadata:', this.closestMatch)
      useSeoMeta({
        title: this.closestMatch,
        ogTitle: this.closestMatch,
        ogImage: this.getImageUrl(this.closestMatch!),
        twitterImage: this.getImageUrl(this.closestMatch!)
      })
    }
  }
}
</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>

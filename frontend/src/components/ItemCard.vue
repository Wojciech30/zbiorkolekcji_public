<template>
  <div class="card-wrapper">
    <!-- Action buttons slot -->
    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />
    </div>
    
    <router-link :to="`/items/${data.id || data._id}`" class="block group">
      <div class="card-container">
        <!-- Image -->
        <div class="card-image">
          <template v-if="hasImage">
            <img
              :src="imageUrl"
              :alt="data.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              @error="handleImageError"
            />
          </template>
          <template v-else>
            <div class="card-placeholder">
              <CubeIcon class="w-16 h-16 text-gray-300" />
            </div>
          </template>
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <!-- Content -->
        <div class="card-content">
          <h3 class="card-title">{{ data.name }}</h3>
          
          <p v-if="data.description" class="card-description">
            {{ data.description }}
          </p>

          <!-- Stats -->
          <div class="card-stats">
            <div v-if="likesCount !== undefined" class="stat-item">
              <HeartIcon class="w-4 h-4" />
              <span>{{ likesCount }}</span>
            </div>
            
            <div v-if="commentsCount !== undefined" class="stat-item">
              <ChatBubbleLeftIcon class="w-4 h-4" />
              <span>{{ commentsCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script>
import { computed } from 'vue'
import { 
  HeartIcon,
  ChatBubbleLeftIcon,
  CubeIcon
} from '@heroicons/vue/24/outline'
import { getImageUrl } from '@/utils/imageUrl'

export default {
  name: 'ItemCard',
  
  components: {
    HeartIcon,
    ChatBubbleLeftIcon,
    CubeIcon
  },
  
  props: {
    data: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const hasImage = computed(() => {
      const img = props.data.images?.[0] || props.data.imageUrl
      return !!img
    })

    const imageUrl = computed(() => {
      const img = props.data.images?.[0] || props.data.imageUrl
      return img ? getImageUrl(img) : ''
    })

    const likesCount = computed(() => props.data.likesCount ?? (props.data.likes?.length))
    const commentsCount = computed(() => props.data.comments?.length)

    const handleImageError = (e) => {
      e.target.style.display = 'none'
    }

    return {
      hasImage,
      imageUrl,
      likesCount,
      commentsCount,
      handleImageError
    }
  }
}
</script>

<style scoped>
.card-wrapper {
  @apply relative;
}

.card-actions {
  @apply absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity;
}

.card-container {
  @apply bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
         hover:shadow-lg hover:border-gray-200 transition-all duration-300
         min-h-[320px] flex flex-col;
}

.card-image {
  @apply relative h-48 overflow-hidden bg-gray-100 flex-shrink-0;
}

.card-placeholder {
  @apply w-full h-full flex items-center justify-center bg-gray-100;
}

.card-content {
  @apply p-5 flex-1 flex flex-col;
}

.card-title {
  @apply text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors
         line-clamp-1;
}

.card-description {
  @apply text-sm text-gray-600 mt-2 line-clamp-2;
}

.card-stats {
  @apply mt-auto pt-4 flex flex-wrap gap-3 text-sm text-gray-500;
}

.stat-item {
  @apply flex items-center gap-1;
}

/* Line clamp fallback */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}
</style>

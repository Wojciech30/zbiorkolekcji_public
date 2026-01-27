<!--
  @component CollectionCard
  @description Reużywalna karta kolekcji z okładką, statystykami i badge'em prywatności.
  Automatycznie linkuje do odpowiedniej strony w zależności od typu (collection/item/category).
  
  @example
  <CollectionCard :data="collection" showStats showOwner />
  
  @example z akcjami (edycja/usuwanie)
  <CollectionCard :data="collection">
    <template #actions>
      <button @click="edit">Edytuj</button>
    </template>
  </CollectionCard>
-->
<template>
  <div class="card-wrapper">
    <!-- Slot na przyciski akcji (widoczne przy hover) -->
    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />
    </div>
    
    <router-link :to="linkTo" class="block group">
      <div class="card-container">
        <!-- Okładka kolekcji -->
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
              <FolderIcon class="w-16 h-16 text-gray-300" />
            </div>
          </template>
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <!-- Badge prywatności (Publiczna/Prywatna) -->
          <div v-if="badge" class="absolute top-3 left-3">
            <span :class="badgeClasses">{{ badge }}</span>
          </div>
        </div>

      <!-- Treść karty -->
      <div class="card-content">
        <h3 class="card-title">{{ data.name }}</h3>
        
        <p v-if="data.description" class="card-description">
          {{ data.description }}
        </p>

        <!-- Statystyki (właściciel, elementy, polubienia, wyświetlenia, komentarze) -->
        <div v-if="showStats" class="card-stats">
          <div v-if="showOwner && data.owner" class="stat-item">
            <UserIcon class="w-4 h-4" />
            <span>{{ data.owner.username }}</span>
          </div>
          
          <div v-if="itemsCount !== undefined" class="stat-item">
            <DocumentTextIcon class="w-4 h-4" />
            <span>{{ itemsCount }} elementów</span>
          </div>
          
          <div v-if="likesCount !== undefined" class="stat-item">
            <HeartIcon class="w-4 h-4" />
            <span>{{ likesCount }}</span>
          </div>
          
          <div v-if="viewsCount !== undefined" class="stat-item">
            <EyeIcon class="w-4 h-4" />
            <span>{{ viewsCount }}</span>
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
/**
 * @module CollectionCard
 * @description Uniwersalny komponent karty dla kolekcji, przedmiotów i kategorii
 * 
 * @prop {Object} data - Dane do wyświetlenia:
 *   - name: Nazwa (wymagane)
 *   - description: Opis
 *   - coverImage/image: URL okładki
 *   - privacy: 'public' | 'private'
 *   - owner: { username } - właściciel
 *   - itemsCount, likesCount, views, comments - statystyki
 * @prop {'collection'|'item'|'category'} type - Typ karty (determinuje link)
 * @prop {boolean} showStats - Czy pokazywać statystyki
 * @prop {boolean} showOwner - Czy pokazywać właściciela
 * @prop {boolean} hideBadge - Czy ukryć badge prywatności
 * 
 * @slots
 * - actions: Przyciski akcji (widoczne przy hover)
 */
import { computed } from 'vue'
import { 
  UserIcon, 
  DocumentTextIcon, 
  EyeIcon, 
  HeartIcon,
  ChatBubbleLeftIcon,
  FolderIcon
} from '@heroicons/vue/24/outline'
import { getImageUrl } from '@/utils/imageUrl'

export default {
  name: 'CollectionCard',
  
  components: {
    UserIcon,
    DocumentTextIcon,
    EyeIcon,
    HeartIcon,
    ChatBubbleLeftIcon,
    FolderIcon
  },
  
  props: {
    data: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      default: 'collection',
      validator: (value) => ['collection', 'item', 'category'].includes(value)
    },
    showStats: {
      type: Boolean,
      default: true
    },
    showOwner: {
      type: Boolean,
      default: true
    },
    hideBadge: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const linkTo = computed(() => {
      const id = props.data._id || props.data.id
      switch (props.type) {
        case 'item':
          return `/items/${id}`
        case 'category':
          return `/categories/${id}/collections`
        default:
          return `/collections/${id}`
      }
    })

    const hasImage = computed(() => {
      const img = props.data.coverImage || props.data.image || props.data.images?.[0]
      return !!img
    })

    const imageUrl = computed(() => {
      const img = props.data.coverImage || props.data.image || props.data.images?.[0]
      return img ? getImageUrl(img) : ''
    })

    const badge = computed(() => {
      if (props.hideBadge) return null
      if (props.type === 'collection' && props.data.privacy) {
        return props.data.privacy === 'public' ? 'Publiczna' : 'Prywatna'
      }
      return null
    })

    const badgeClasses = computed(() => {
      const base = 'px-2 py-1 text-xs font-medium rounded-full'
      if (props.data.privacy === 'public') {
        return `${base} bg-green-100 text-green-800`
      }
      return `${base} bg-yellow-100 text-yellow-800`
    })

    const itemsCount = computed(() => props.data.itemsCount)
    const likesCount = computed(() => props.data.likesCount ?? (props.data.likes?.length))
    const viewsCount = computed(() => props.data.views)
    const commentsCount = computed(() => props.data.commentsCount ?? (props.data.comments?.length))

    const handleImageError = (e) => {
      e.target.src = '/placeholder-collection.svg'
    }

    return {
      linkTo,
      hasImage,
      imageUrl,
      badge,
      badgeClasses,
      itemsCount,
      likesCount,
      viewsCount,
      commentsCount,
      handleImageError,
      getImageUrl
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
  @apply mt-4 flex flex-wrap gap-3 text-sm text-gray-500;
}

.stat-item {
  @apply flex items-center gap-1;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 1;
}
</style>

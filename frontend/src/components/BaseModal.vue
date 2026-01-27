<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="show" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeOnBackdrop && $emit('close')"
      >
        <div 
          class="bg-white rounded-lg shadow-xl flex flex-col modal-container"
          :style="{ maxHeight: '90vh' }"
        >
          <!-- Header -->
          <div class="p-6 border-b flex items-center justify-between flex-shrink-0">
            <h3 class="text-xl font-semibold">{{ title }}</h3>
            <button 
              v-if="showCloseButton"
              @click="$emit('close')" 
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <slot></slot>
          </div>
          
          <!-- Footer (optional) -->
          <div v-if="$slots.footer" class="p-6 border-t flex-shrink-0">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { XMarkIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'BaseModal',
  
  components: {
    XMarkIcon
  },
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    showCloseButton: {
      type: Boolean,
      default: true
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['close']
}
</script>

<style scoped>
.modal-container {
  width: 66.666667%;
  max-width: 800px;
  min-width: 320px;
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>

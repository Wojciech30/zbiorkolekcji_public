<template>
  <BaseModal 
    :show="show" 
    title="Zgłoś problem"
    @close="close"
  >
    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Temat *</label>
        <input
          v-model="subject"
          type="text"
          placeholder="Krótki opis problemu"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Opis problemu *</label>
        <textarea
          v-model="message"
          rows="4"
          placeholder="Opisz szczegółowo napotkany problem..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
          required
        ></textarea>
      </div>
      
      <!-- Screenshot upload using ImageUploader -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Zrzut ekranu (opcjonalnie)</label>
        <ImageUploader 
          v-model="screenshotUrl"
          :max-width="1920"
          :max-height="1080"
          @uploaded="onScreenshotUploaded"
        />
      </div>
      
      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Anuluj
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {{ isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import BaseModal from '@/components/BaseModal.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import SupportService from '@/services/SupportService'

export default {
  name: 'FeedbackModal',
  
  components: {
    BaseModal,
    ImageUploader
  },
  
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close'],
  
  setup(props, { emit }) {
    const toast = useToast()
    
    const subject = ref('')
    const message = ref('')
    const screenshotUrl = ref('')
    const isSubmitting = ref(false)
    
    const onScreenshotUploaded = (url) => {
      screenshotUrl.value = url
    }
    
    const close = () => {
      subject.value = ''
      message.value = ''
      screenshotUrl.value = ''
      emit('close')
    }
    
    const submit = async () => {
      if (!subject.value.trim() || !message.value.trim()) {
        toast.warning('Wypełnij wszystkie wymagane pola')
        return
      }
      
      try {
        isSubmitting.value = true
        
        // Send as JSON with screenshot URL
        await SupportService.reportProblem({
          subject: subject.value.trim(),
          message: message.value.trim(),
          screenshotUrl: screenshotUrl.value || null
        })
        
        toast.success('Dziękujemy za zgłoszenie!')
        close()
      } catch (error) {
        console.error('Błąd wysyłania zgłoszenia:', error)
        toast.error('Nie udało się wysłać zgłoszenia')
      } finally {
        isSubmitting.value = false
      }
    }
    
    return {
      subject,
      message,
      screenshotUrl,
      isSubmitting,
      onScreenshotUploaded,
      close,
      submit
    }
  }
}
</script>

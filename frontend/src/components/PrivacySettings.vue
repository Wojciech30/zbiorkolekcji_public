<!--
  @component PrivacySettings
  @description Komponent ustawień prywatności kolekcji.
  Pozwala zmienić widoczność między publiczną a prywatną.
  
  @example
  <PrivacySettings 
    :collection="collection" 
    @privacy-updated="handlePrivacyChange" 
  />
-->
<template>
  <div class="bg-gray-50 p-4 rounded-lg">
    <h3 class="font-semibold mb-4">Ustawienia prywatności</h3>
    <select
        v-model="selectedPrivacy"
        @change="updatePrivacy"
        class="input-field"
    >
      <option value="public">Publiczna</option>
      <option value="private">Prywatna</option>
    </select>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import CollectionService from '@/services/CollectionService';

export default {
  name: 'PrivacySettings',
  
  props: {
    collection: {
      type: Object,
      required: true
    }
  },
  
  emits: ['privacy-updated'],
  
  setup(props, { emit }) {
    const selectedPrivacy = ref(props.collection.privacy);
    
    watch(() => props.collection.privacy, (newVal) => {
      selectedPrivacy.value = newVal;
    });
    
    // Aktualizacja prywatności kolekcji
    const updatePrivacy = async () => {
      try {
        await CollectionService.updateCollectionPrivacy(
          props.collection._id,
          { privacy: selectedPrivacy.value }
        );
        emit('privacy-updated', selectedPrivacy.value);
      } catch (error) {
        console.error('Error updating privacy:', error);
      }
    };
    
    return {
      selectedPrivacy,
      updatePrivacy
    };
  }
};
</script>
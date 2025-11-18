<template>
  <div class="bg-gray-50 p-4 rounded-lg">
    <h3 class="font-semibold mb-4">Ustawienia prywatności</h3>
    <select
        v-model="selectedPrivacy"
        @change="updatePrivacy"
        class="w-full p-2 border rounded"
    >
      <option value="public">Publiczna</option>
      <option value="private">Prywatna</option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CollectionService from '@/services/CollectionService';

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['privacy-updated']);

const selectedPrivacy = ref(props.collection.privacy);

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
</script>
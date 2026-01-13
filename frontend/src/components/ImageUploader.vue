<template>
  <div
    class="image-uploader"
    :class="{ 'is-dragging': isDragging }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Preview -->
    <div v-if="previewUrl" class="preview-container">
      <img :src="previewUrl" alt="Preview" class="preview-image" />
      <button
        type="button"
        @click="removeImage"
        class="remove-btn"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Upload area -->
    <div v-else class="upload-area" @click="triggerFileInput">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileSelect"
      />
      
      <div class="upload-content">
        <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="mt-2 text-gray-600">
          <span class="text-blue-600 font-medium">Kliknij</span> lub przeciągnij zdjęcie
        </p>
        <p class="text-sm text-gray-400 mt-1">PNG, JPG, GIF do 5MB</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="isUploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import apiClient from '@/services/apiClient';

export default {
  name: 'ImageUploader',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'uploaded'],

  setup(props, { emit }) {
    const fileInput = ref(null);
    const isDragging = ref(false);
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    const previewUrl = ref(props.modelValue || '');
    const error = ref('');

    watch(() => props.modelValue, (newVal) => {
      if (newVal && newVal !== previewUrl.value) {
        previewUrl.value = newVal;
      }
    });

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const onDragOver = () => {
      isDragging.value = true;
    };

    const onDragLeave = () => {
      isDragging.value = false;
    };

    const onDrop = (e) => {
      isDragging.value = false;
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };

    const onFileSelect = (e) => {
      const files = e.target?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };

    const handleFile = async (file) => {
      error.value = '';

      // Walidacja typu
      if (!file.type.startsWith('image/')) {
        error.value = 'Plik musi być obrazem';
        return;
      }

      // Walidacja rozmiaru (5MB)
      if (file.size > 5 * 1024 * 1024) {
        error.value = 'Plik jest zbyt duży (max 5MB)';
        return;
      }

      // Tymczasowy podgląd
      previewUrl.value = URL.createObjectURL(file);

      // Upload
      try {
        isUploading.value = true;
        uploadProgress.value = 0;

        const formData = new FormData();
        formData.append('image', file);

        const response = await apiClient.post('/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          }
        });

        const imageUrl = response.data.url;
        previewUrl.value = imageUrl;
        emit('update:modelValue', imageUrl);
        emit('uploaded', imageUrl);

      } catch (err) {
        console.error('Upload error:', err);
        error.value = err.response?.data?.message || 'Błąd przesyłania pliku';
        previewUrl.value = '';
      } finally {
        isUploading.value = false;
        uploadProgress.value = 0;
      }
    };

    const removeImage = () => {
      previewUrl.value = '';
      emit('update:modelValue', '');
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    return {
      fileInput,
      isDragging,
      isUploading,
      uploadProgress,
      previewUrl,
      error,
      triggerFileInput,
      onDragOver,
      onDragLeave,
      onDrop,
      onFileSelect,
      removeImage
    };
  }
};
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover,
.is-dragging .upload-area {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.preview-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #dc2626;
}

.progress-bar {
  margin-top: 0.5rem;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.2s;
}

.hidden {
  display: none;
}
</style>

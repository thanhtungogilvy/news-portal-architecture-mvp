<script setup lang="ts">
import imageCompression from 'browser-image-compression'
import { useDropZone } from '@vueuse/core'
import type { ApiSuccess } from '~/types/api'

const { modelValue, disabled } = defineProps<{
  modelValue: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [url: string | null]
}>()

// ─── State ───────────────────────────────────────────────────────────────────

type Tab = 'upload' | 'library'
type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'error'

const activeTab = ref<Tab>('upload')
const uploadStatus = ref<UploadStatus>('idle')
const uploadError = ref<string | null>(null)
const compressedSize = ref<number | null>(null)

const dropZoneRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLInputElement>()

// Library
const libraryFiles = ref<{ name: string; size: number; createdAt: string | null; url: string }[]>([])
const libraryLoading = ref(false)
const libraryLoaded = ref(false)

const isBusy = computed(() => uploadStatus.value === 'compressing' || uploadStatus.value === 'uploading')

// ─── Drag-drop ────────────────────────────────────────────────────────────────

const { isOverDropZone } = useDropZone(dropZoneRef, {
  dataTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  onDrop(files) {
    if (files?.[0]) handleFile(files[0])
  },
})

// ─── File handling ────────────────────────────────────────────────────────────

const MAX_RAW_BYTES = 5 * 1024 * 1024

async function handleFile(file: File) {
  uploadError.value = null
  compressedSize.value = null

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file (JPEG, PNG, or WebP).'
    return
  }
  if (file.size > MAX_RAW_BYTES) {
    uploadError.value = 'File exceeds the 5 MB limit. Please choose a smaller image.'
    return
  }

  uploadStatus.value = 'compressing'

  let compressed: File
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1280,
      fileType: 'image/webp',
      useWebWorker: true,
    })
  }
  catch {
    uploadError.value = 'Compression failed. Please try a different image.'
    uploadStatus.value = 'error'
    return
  }

  if (compressed.size > MAX_RAW_BYTES) {
    uploadError.value = 'Image is too complex to compress under the limit. Try a lower-resolution image.'
    uploadStatus.value = 'error'
    return
  }

  compressedSize.value = compressed.size
  uploadStatus.value = 'uploading'

  try {
    const form = new FormData()
    form.append('file', compressed, `upload-${Date.now()}.webp`)

    const res = await $fetch<ApiSuccess<{ url: string }>>('/api/admin/upload', {
      method: 'POST',
      body: form,
    })

    emit('update:modelValue', res.data.url)
    uploadStatus.value = 'idle'
  }
  catch {
    uploadError.value = 'Upload failed. Please try again.'
    uploadStatus.value = 'error'
  }
}

function onFileInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ─── Library ─────────────────────────────────────────────────────────────────

async function loadLibrary() {
  if (libraryLoaded.value) return
  libraryLoading.value = true
  try {
    const res = await $fetch<ApiSuccess<typeof libraryFiles.value>>('/api/admin/storage/news-thumbnails')
    libraryFiles.value = res.data
    libraryLoaded.value = true
  }
  catch {
    libraryFiles.value = []
    libraryLoaded.value = true
  }
  finally {
    libraryLoading.value = false
  }
}

function onTabChange(tab: Tab) {
  if (isBusy.value) return
  activeTab.value = tab
  if (tab === 'library') loadLibrary()
}

function selectFromLibrary(url: string) {
  emit('update:modelValue', url)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(b: number) {
  return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(0)} KB`
}
</script>

<template>
  <div>
    <!-- SELECTED STATE -->
    <template v-if="modelValue">
      <div class="overflow-hidden rounded-xl border border-border bg-white">
        <div class="aspect-video w-full overflow-hidden bg-smoke-100">
          <img :src="modelValue" alt="Thumbnail preview" class="h-full w-full object-cover">
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <p class="truncate text-xs text-body">{{ modelValue.split('/').at(-1) }}</p>
          <div class="flex shrink-0 items-center gap-2">
            <UiButton size="sm" variant="secondary" :disabled="disabled" @click="emit('update:modelValue', null); activeTab = 'upload'; uploadStatus = 'idle'; uploadError = null">
              Change image
            </UiButton>
            <UiButton size="sm" variant="destructive" :disabled="disabled" @click="emit('update:modelValue', null)">
              Remove
            </UiButton>
          </div>
        </div>
      </div>
    </template>

    <!-- PICKER STATE -->
    <template v-else>
      <!-- Tab bar -->
      <div class="mb-3 flex gap-1 rounded-lg bg-smoke-100 p-1">
        <button
          type="button"
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'upload' ? 'bg-white text-title shadow-sm' : 'text-body hover:text-title'"
          :disabled="isBusy"
          @click="onTabChange('upload')"
        >
          Upload new
        </button>
        <button
          type="button"
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'library' ? 'bg-white text-title shadow-sm' : 'text-body hover:text-title'"
          :disabled="isBusy"
          @click="onTabChange('library')"
        >
          Choose from library
        </button>
      </div>

      <!-- Upload tab -->
      <template v-if="activeTab === 'upload'">
        <div
          ref="dropZoneRef"
          class="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors"
          :class="isOverDropZone ? 'border-blue bg-blue/5' : 'border-border hover:border-blue/40'"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="isBusy || disabled"
            @change="onFileInputChange"
          >

          <template v-if="uploadStatus === 'idle' || uploadStatus === 'error'">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-smoke-100">
              <svg class="h-6 w-6 text-body" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p class="text-sm font-medium text-title">Drag &amp; drop or click to browse</p>
            <p class="mt-1 text-xs text-body">PNG · JPG · WebP · max 5 MB</p>
          </template>

          <template v-else-if="uploadStatus === 'compressing'">
            <p class="text-sm font-medium text-title">Compressing…</p>
            <p class="mt-1 text-xs text-body">Optimising image for web</p>
          </template>

          <template v-else-if="uploadStatus === 'uploading'">
            <p class="text-sm font-medium text-title">Uploading…</p>
            <p v-if="compressedSize" class="mt-1 text-xs text-body">{{ formatBytes(compressedSize) }} compressed</p>
          </template>
        </div>

        <p v-if="uploadError" class="mt-2 text-xs text-error">{{ uploadError }}</p>
      </template>

      <!-- Library tab -->
      <template v-else>
        <div class="min-h-[180px] rounded-xl border border-border bg-white p-4">
          <!-- Loading -->
          <div v-if="libraryLoading" class="grid grid-cols-4 gap-2">
            <UiSkeleton v-for="n in 8" :key="n" class="aspect-video w-full rounded-lg" />
          </div>

          <!-- Empty -->
          <div v-else-if="libraryFiles.length === 0" class="flex h-36 items-center justify-center text-sm text-body">
            No images uploaded yet.
          </div>

          <!-- Grid -->
          <div v-else class="grid grid-cols-4 gap-2">
            <button
              v-for="file in libraryFiles"
              :key="file.name"
              type="button"
              class="group relative aspect-video overflow-hidden rounded-lg border-2 border-transparent transition hover:border-blue focus:outline-none focus:ring-2 focus:ring-blue"
              @click="selectFromLibrary(file.url)"
            >
              <img :src="file.url" :alt="file.name" class="h-full w-full object-cover">
              <div class="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
            </button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

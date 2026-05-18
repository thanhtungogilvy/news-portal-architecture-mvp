<script setup lang="ts">
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

const { modelValue, placeholder, error, thumbnailUrl } = defineProps<{
  modelValue: string;
  placeholder?: string;
  error?: string;
  thumbnailUrl?: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// ─── Link dialog ─────────────────────────────────────────────────────────────
const linkDialogOpen = ref(false);
const linkUrl = ref("");

function openLinkDialog() {
  const existing = editor.value?.getAttributes("link").href ?? "";
  linkUrl.value = existing;
  linkDialogOpen.value = true;
}

function applyLink() {
  if (!linkUrl.value) {
    editor.value?.chain().focus().unsetLink().run();
  } else {
    editor.value
      ?.chain()
      .focus()
      .setLink({ href: linkUrl.value, rel: "noopener noreferrer" })
      .run();
  }
  linkDialogOpen.value = false;
  linkUrl.value = "";
}

// ─── Image dialog ─────────────────────────────────────────────────────────────
const imageDialogOpen = ref(false);
const imageSrc = ref("");
const imageAlt = ref("");
const imageTitle = ref("");
const imageErrors = reactive({ src: "", alt: "" });

// ─── Image library ───────────────────────────────────────────────────────────
const libraryOpen = ref(false);
const libraryFiles = ref<{ name: string; url: string }[]>([]);
const libraryLoading = ref(false);
const libraryLoaded = ref(false);

async function loadLibrary() {
  if (libraryLoaded.value) return;
  libraryLoading.value = true;
  try {
    const res = await $fetch<{ data: { name: string; url: string }[] }>(
      "/api/admin/storage/news-thumbnails",
    );
    libraryFiles.value = res.data;
    libraryLoaded.value = true;
  } catch {
    libraryFiles.value = [];
    libraryLoaded.value = true;
  } finally {
    libraryLoading.value = false;
  }
}

function toggleLibrary() {
  libraryOpen.value = !libraryOpen.value;
  if (libraryOpen.value) loadLibrary();
}

function pickImage(url: string) {
  imageSrc.value = url;
  imageErrors.src = "";
  libraryOpen.value = false;
}

function openImageDialog() {
  imageSrc.value = "";
  imageAlt.value = "";
  imageTitle.value = "";
  imageErrors.src = "";
  imageErrors.alt = "";
  libraryOpen.value = false;
  imageDialogOpen.value = true;
}

function applyImage() {
  let valid = true;
  imageErrors.src = "";
  imageErrors.alt = "";

  if (!imageSrc.value) {
    imageErrors.src = "Image URL is required.";
    valid = false;
  }
  if (!imageAlt.value) {
    imageErrors.alt = "Alt text is required for accessibility.";
    valid = false;
  }

  if (!valid) return;

  editor.value
    ?.chain()
    .focus()
    .setImage({
      src: imageSrc.value,
      alt: imageAlt.value,
      title: imageTitle.value || undefined,
    })
    .run();

  imageDialogOpen.value = false;
}

// ─── Editor ──────────────────────────────────────────────────────────────────

const editor = useEditor({
  content: modelValue,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false, autolink: true }),
    Image.configure({ inline: false }),
  ],
  editorProps: {
    attributes: {
      class:
        "outline-none min-h-[200px] px-4 py-3 text-sm text-body leading-relaxed",
    },
  },
  onUpdate({ editor: e }) {
    emit("update:modelValue", e.getHTML());
  },
});

// Keep editor in sync when modelValue changes externally
watch(
  () => modelValue,
  (val) => {
    if (editor.value && editor.value.getHTML() !== val) {
      editor.value.commands.setContent(val, { emitUpdate: false });
    }
  },
);

onBeforeUnmount(() => editor.value?.destroy());

// ─── Toolbar helpers ─────────────────────────────────────────────────────────

function isActive(name: string, attrs?: Record<string, unknown>) {
  return editor.value?.isActive(name, attrs) ?? false;
}

const toolbarItems = computed(() => [
  {
    group: "format",
    buttons: [
      {
        label: "Bold",
        icon: "B",
        action: () => editor.value?.chain().focus().toggleBold().run(),
        active: isActive("bold"),
        title: "Bold (⌘B)",
      },
      {
        label: "Italic",
        icon: "I",
        action: () => editor.value?.chain().focus().toggleItalic().run(),
        active: isActive("italic"),
        title: "Italic (⌘I)",
      },
    ],
  },
  {
    group: "heading",
    buttons: [
      {
        label: "H2",
        icon: "H2",
        action: () =>
          editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
        active: isActive("heading", { level: 2 }),
        title: "Heading 2",
      },
      {
        label: "H3",
        icon: "H3",
        action: () =>
          editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
        active: isActive("heading", { level: 3 }),
        title: "Heading 3",
      },
    ],
  },
  {
    group: "list",
    buttons: [
      {
        label: "Bullet list",
        icon: "≡",
        action: () => editor.value?.chain().focus().toggleBulletList().run(),
        active: isActive("bulletList"),
        title: "Bullet list",
      },
      {
        label: "Ordered list",
        icon: "1.",
        action: () => editor.value?.chain().focus().toggleOrderedList().run(),
        active: isActive("orderedList"),
        title: "Ordered list",
      },
    ],
  },
  {
    group: "block",
    buttons: [
      {
        label: "Blockquote",
        icon: "❝",
        action: () => editor.value?.chain().focus().toggleBlockquote().run(),
        active: isActive("blockquote"),
        title: "Blockquote",
      },
      {
        label: "Code block",
        icon: "<>",
        action: () => editor.value?.chain().focus().toggleCode().run(),
        active: isActive("code"),
        title: "Inline code",
      },
      {
        label: "Horizontal rule",
        icon: "—",
        action: () => editor.value?.chain().focus().setHorizontalRule().run(),
        active: false,
        title: "Horizontal rule",
      },
    ],
  },
  {
    group: "media",
    buttons: [
      {
        label: "Link",
        icon: "🔗",
        action: openLinkDialog,
        active: isActive("link"),
        title: "Insert / edit link",
      },
      {
        label: "Image",
        icon: "🖼",
        action: openImageDialog,
        active: false,
        title: "Insert image",
      },
    ],
  },
]);
</script>

<template>
  <div>
    <!-- Editor wrapper -->
    <div
      class="overflow-hidden rounded-xl border transition-colors"
      :class="error ? 'border-error' : 'border-border focus-within:border-blue'"
    >
      <!-- Toolbar -->
      <div
        class="flex flex-wrap items-center gap-0.5 border-b border-border bg-smoke-50 px-2 py-1.5"
      >
        <template v-for="group in toolbarItems" :key="group.group">
          <button
            v-for="btn in group.buttons"
            :key="btn.label"
            type="button"
            :title="btn.title"
            :aria-label="btn.label"
            :aria-pressed="btn.active"
            class="rounded px-2 py-1 text-sm font-medium transition-colors"
            :class="
              btn.active
                ? 'bg-blue text-white'
                : 'text-body hover:bg-smoke-100 hover:text-title'
            "
            @click="btn.action()"
          >
            {{ btn.icon }}
          </button>
          <div class="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        </template>
      </div>

      <!-- TipTap content editable -->
      <EditorContent
        :editor="editor"
        :data-placeholder="placeholder"
        class="relative [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-smoke-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>

    <p v-if="error" class="mt-1 text-xs text-error">{{ error }}</p>

    <!-- Link dialog -->
    <Teleport to="body">
      <div
        v-if="linkDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="linkDialogOpen = false"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-base font-semibold text-title">Insert link</h3>
          <UiInput
            v-model="linkUrl"
            label="URL"
            type="url"
            placeholder="https://example.com"
            autofocus
            @keydown.enter.prevent="applyLink"
          />
          <div class="mt-4 flex justify-end gap-2">
            <UiButton variant="secondary" @click="linkDialogOpen = false">
              Cancel
            </UiButton>
            <UiButton @click="applyLink"> Apply </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Image dialog -->
    <Teleport to="body">
      <div
        v-if="imageDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="imageDialogOpen = false"
      >
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-base font-semibold text-title">Insert image</h3>
          <div class="space-y-3">
            <div>
              <UiInput
                v-model="imageSrc"
                label="Image URL"
                type="url"
                placeholder="https://example.com/image.jpg"
                :error="imageErrors.src"
              />
              <!-- Chosen preview -->
              <div v-if="imageSrc" class="mt-2 overflow-hidden rounded-lg border border-border">
                <img :src="imageSrc" alt="Preview" class="h-28 w-full object-cover">
              </div>
              <!-- Choose from library toggle -->
              <button
                type="button"
                class="mt-2 flex items-center gap-1 text-xs text-blue hover:underline"
                @click="toggleLibrary"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 3.75h16.5c.414 0 .75.336.75.75v10.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V4.5a.75.75 0 01.75-.75z" />
                </svg>
                {{ libraryOpen ? 'Close library' : 'Choose from library' }}
              </button>
            </div>

            <!-- Library panel -->
            <div v-if="libraryOpen" class="rounded-xl border border-border bg-smoke-50 p-3">
              <!-- Thumbnail shortcut -->
              <template v-if="thumbnailUrl">
                <p class="mb-2 text-xs font-medium text-body">Article thumbnail</p>
                <button
                  type="button"
                  class="group relative mb-3 block w-full overflow-hidden rounded-lg border-2 transition focus:outline-none focus:ring-2 focus:ring-blue"
                  :class="imageSrc === thumbnailUrl ? 'border-blue' : 'border-transparent hover:border-blue/50'"
                  @click="pickImage(thumbnailUrl!)"
                >
                  <img :src="thumbnailUrl" alt="Article thumbnail" class="h-24 w-full object-cover">
                  <div
                    class="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100"
                    :class="imageSrc === thumbnailUrl ? '!bg-blue/20 !opacity-100' : ''"
                  >
                    <span class="rounded bg-black/60 px-2 py-0.5 text-xs font-medium">
                      {{ imageSrc === thumbnailUrl ? 'Selected' : 'Use this' }}
                    </span>
                  </div>
                </button>
                <div class="mb-3 border-t border-border" />
              </template>

              <!-- Library grid -->
              <p class="mb-2 text-xs font-medium text-body">Storage library</p>
              <div v-if="libraryLoading" class="grid grid-cols-4 gap-1.5">
                <UiSkeleton v-for="n in 8" :key="n" class="aspect-video w-full rounded-md" />
              </div>
              <div v-else-if="libraryFiles.length === 0" class="py-4 text-center text-xs text-body">
                No images uploaded yet.
              </div>
              <div v-else class="grid grid-cols-4 gap-1.5">
                <button
                  v-for="file in libraryFiles"
                  :key="file.name"
                  type="button"
                  class="group relative aspect-video overflow-hidden rounded-md border-2 transition focus:outline-none focus:ring-2 focus:ring-blue"
                  :class="imageSrc === file.url ? 'border-blue' : 'border-transparent hover:border-blue/50'"
                  @click="pickImage(file.url)"
                >
                  <img :src="file.url" :alt="file.name" class="h-full w-full object-cover">
                  <div
                    v-if="imageSrc === file.url"
                    class="absolute inset-0 flex items-center justify-center bg-blue/20"
                  >
                    <span class="rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">✓</span>
                  </div>
                </button>
              </div>
            </div>
            <UiInput
              v-model="imageAlt"
              label="Alt text"
              type="text"
              placeholder="Descriptive alt text (required)"
              :error="imageErrors.alt"
            />
            <UiInput
              v-model="imageTitle"
              label="Title (optional)"
              type="text"
              placeholder="Caption or tooltip"
            />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <UiButton variant="secondary" @click="imageDialogOpen = false">
              Cancel
            </UiButton>
            <UiButton @click="applyImage"> Insert </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

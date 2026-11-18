<template>
  <div 
    ref="mermaidContainer" 
    class="mermaid mermaid-diagram" 
    v-html="renderedContent"
    @click="handleClick"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useData } from 'vitepress'

interface Props {
  content: string
}

const props = defineProps<Props>()
const { isDark } = useData()

const mermaidContainer = ref<HTMLElement>()
const renderedContent = ref('')

const handleClick = (event: MouseEvent) => {
  event.preventDefault()
}

onMounted(async () => {
  await nextTick()

  try {
    const { default: mermaid } = await import('mermaid')

    const dark = isDark.value

    const themeVars = dark ? {
      primaryColor: '#12131f',
      primaryTextColor: '#dadef2',
      primaryBorderColor: '#a9b4ff',
      lineColor: '#a9b4ff',
      secondaryColor: '#1a1c2c',
      tertiaryColor: '#2a2d42',
      background: '#12131f',
      mainBkg: '#12131f',
      secondBkg: '#1a1c2c',
      tertiaryBkg: '#2a2d42',
      entityBkg: '#12131f',
      entityTextColor: '#dadef2',
      relationLabelColor: '#dadef2',
      relationLabelBackground: '#12131f'
    } : {
      primaryColor: '#ffffff',
      primaryTextColor: '#14162a',
      primaryBorderColor: '#4a5be3',
      lineColor: '#4a5be3',
      secondaryColor: '#f6f7fb',
      tertiaryColor: '#e6e8f0',
      background: '#ffffff',
      mainBkg: '#ffffff',
      secondBkg: '#f6f7fb',
      tertiaryBkg: '#e6e8f0',
      entityBkg: '#ffffff',
      entityTextColor: '#14162a',
      relationLabelColor: '#14162a',
      relationLabelBackground: '#ffffff'
    }

    const brandColor = dark ? '#a9b4ff' : '#4a5be3'

    // Initialize Mermaid with theme-aware settings
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: themeVars,
      er: {
        diagramPadding: 40,
        layoutDirection: 'TB',
        minEntityWidth: 180,
        minEntityHeight: 120,
        entityPadding: 30,
        stroke: brandColor,
        fill: dark ? '#12131f' : '#ffffff',
        fontSize: 13,
        useMaxWidth: true,
        relationColor: brandColor
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    })
    
    // Create unique ID for this diagram
    const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
    
    // Render the diagram
    const { svg } = await mermaid.render(id, props.content)
    renderedContent.value = svg
    
    // Trigger zoom setup after render
    setTimeout(() => {
      if (mermaidContainer.value) {
        mermaidContainer.value.dataset.rendered = 'true'
        
        // Modify foreignObject elements
        const foreignObjects = mermaidContainer.value.querySelectorAll('foreignObject')
        foreignObjects.forEach(foreignObj => {
          // Set height to 40 if it's currently 21
          if (foreignObj.getAttribute('height') === '21') {
            foreignObj.setAttribute('height', '40')
          }
          
          // Add 20 to the width value
          const currentWidth = foreignObj.getAttribute('width')
          if (currentWidth) {
            const newWidth = parseFloat(currentWidth) + 20
            foreignObj.setAttribute('width', newWidth.toString())
          }
        })
        
        // Dispatch a custom event to trigger zoom setup
        const event = new CustomEvent('mermaidRendered', { 
          detail: { element: mermaidContainer.value } 
        })
        window.dispatchEvent(event)
      }
    }, 100)
    
  } catch (error) {
    console.error('Mermaid rendering error:', error)
    // Fallback to showing the raw content
    renderedContent.value = `<pre style="background: var(--vp-c-bg-soft); padding: 1rem; border-radius: 8px; overflow: auto;"><code>${props.content}</code></pre>`
  }
})
</script>

<style scoped>
.mermaid {
  text-align: center;
  margin: 20px 0;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 80vh;
  cursor: zoom-in;
  transition: all 0.3s ease;
  user-select: none;
}

.mermaid:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

:deep(.labelBkg) {
  background: var(--vp-c-bg) !important;
  padding: 4px 8px !important;
  border: 1px solid var(--vp-c-brand-1);
}
</style>

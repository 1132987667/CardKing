<template>
  <div class="game-dialog" v-if="visible" @click.self="handleClose">
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>{{ title }}</h2>
        <button class="dialog-close" @click="handleClose">×</button>
      </div>
      <div class="dialog-body">
        <slot></slot>
      </div>
      <div class="dialog-footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    closeOnMask: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:visible', 'close'],
  setup(props, { emit }) {
    const handleClose = () => {
      if (props.closeOnMask) {
        emit('update:visible', false)
        emit('close')
      }
    }
    return { handleClose }
  }
}
</script>

<style scoped>
.game-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 28, 26, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-content {
  background: #2d2a28;
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 12px;
  max-width: 700px;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.12);
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  color: rgba(245, 240, 230, 0.95);
  font-weight: 600;
}

.dialog-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 170, 160, 0.08);
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 6px;
  color: rgba(200, 190, 180, 0.7);
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: rgba(196, 167, 125, 0.15);
  border-color: rgba(196, 167, 125, 0.3);
  color: rgba(245, 240, 230, 0.95);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-track {
  background: rgba(180, 170, 160, 0.06);
}

.dialog-body::-webkit-scrollbar-thumb {
  background: rgba(180, 170, 160, 0.25);
  border-radius: 3px;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(180, 170, 160, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<!-- template for the modal component -->
<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            <slot name="header">
              default header
            </slot>
          </div>

          <div class="modal-body">
            <slot name="body">
              default body
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="$emit('close')">
                OK
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'modal'
}
</script>

<style lang="css">
  .modal-default-button{
    background: #0D47A1;
    border-color: #0D47A1;
  }
  .modal-header h3 {
    margin-top: 0;
    color: #0D47A1;
  }

  .modal-body {
    margin: 20px 0;
  }

  .modal-footer{
    height: auto;
    min-height: 30px;
  }

  .modal-default-button {
    float: right;
  }
</style>

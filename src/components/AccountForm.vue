<template>
  <div class="account-form">
    <!-- Header with title and add button -->
    <div class="header">
      <h2>Для указания нескольких меток для одной пары пользователь используйте разделитель ;</h2>
      <el-button type="primary" :icon="Plus" @click="addNewAccount" circle />
    </div>

    <!-- Form headers -->
    <div class="form-headers">
      <div class="header-item">Метка</div>
      <div class="header-item">Тип записи</div>
      <div class="header-item">Логин</div>
      <div class="header-item">Пароль</div>
      <div class="header-item"></div>
    </div>

    <!-- Account list -->
    <div class="accounts-list">
      <div
        v-for="account in accountsStore.accounts"
        :key="account.id"
        class="account-row"
      >
        <!-- Tags field -->
        <div class="field-wrapper">
          <el-input
            v-model="tagsInputs[account.id]"
            placeholder="Значение"
            maxlength="50"
            show-word-limit
            @blur="updateAccountTags(account.id)"
          />
        </div>

        <!-- Account type select -->
        <div class="field-wrapper">
          <el-select
            :model-value="account.type"
            @change="updateAccountType(account.id, $event)"
            placeholder="Выберите тип"
          >
            <el-option label="Локальная" value="Локальная" />
            <el-option label="LDAP" value="LDAP" />
          </el-select>
        </div>

        <!-- Login field -->
        <div class="field-wrapper">
          <el-input
            v-model="loginInputs[account.id]"
            placeholder="Значение"
            maxlength="100"
            show-word-limit
            :class="{ 'error-field': validationErrors[account.id]?.login }"
            @blur="updateAccountLogin(account.id)"
          />
          <div v-if="validationErrors[account.id]?.login" class="error-message">
            {{ validationErrors[account.id].login }}
          </div>
        </div>

        <!-- Password field -->
        <div class="field-wrapper">
          <el-input
            v-if="account.type === 'Локальная'"
            v-model="passwordInputs[account.id]"
            type="password"
            placeholder="• • • • • •"
            maxlength="100"
            show-word-limit
            show-password
            :class="{ 'error-field': validationErrors[account.id]?.password }"
            @blur="updateAccountPassword(account.id)"
          />
          <div v-else class="disabled-field">Значение</div>
          <div v-if="validationErrors[account.id]?.password" class="error-message">
            {{ validationErrors[account.id].password }}
          </div>
        </div>

        <!-- Delete button -->
        <div class="field-wrapper">
          <el-button
            type="danger"
            :icon="Delete"
            @click="deleteAccount(account.id)"
            circle
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElButton, ElInput, ElSelect, ElOption } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useAccountsStore } from '@/stores/accounts'
import type { AccountType, ValidationErrors } from '@/types'

const accountsStore = useAccountsStore()

// Реактивные данные
const tagsInputs = ref<Record<string, string>>({})
const loginInputs = ref<Record<string, string>>({})
const passwordInputs = ref<Record<string, string>>({})
const validationErrors = reactive<Record<string, ValidationErrors>>({})

// Инициализация полей ввода при изменении учетных записей
const initializeInputs = () => {
  accountsStore.accounts.forEach(account => {
    if (!tagsInputs.value[account.id]) {
      tagsInputs.value[account.id] = accountsStore.tagsToString(account.tags)
    }
    if (!loginInputs.value[account.id]) {
      loginInputs.value[account.id] = account.login
    }
    if (!passwordInputs.value[account.id]) {
      passwordInputs.value[account.id] = account.password || ''
    }
  })
}

// Отслеживание изменений учетных записей для инициализации полей ввода
watch(() => accountsStore.accounts, initializeInputs, { immediate: true })

// Добавление новой учетной записи
const addNewAccount = () => {
  const newAccount = accountsStore.addAccount()
  tagsInputs.value[newAccount.id] = ''
  loginInputs.value[newAccount.id] = ''
  passwordInputs.value[newAccount.id] = ''
  validationErrors[newAccount.id] = {}
}

// Обновление меток учетной записи
const updateAccountTags = (accountId: string) => {
  const tagsString = tagsInputs.value[accountId] || ''
  const tags = accountsStore.parseTags(tagsString)
  accountsStore.updateAccount(accountId, { tags })
  validateAccount(accountId)
}

// Обновление типа учетной записи
const updateAccountType = (accountId: string, type: AccountType) => {
  accountsStore.updateAccount(accountId, { type })
  validateAccount(accountId)
}

// Обновление логина учетной записи
const updateAccountLogin = (accountId: string) => {
  const login = loginInputs.value[accountId] || ''
  accountsStore.updateAccount(accountId, { login })
  validateAccount(accountId)
}

// Обновление пароля учетной записи
const updateAccountPassword = (accountId: string) => {
  const password = passwordInputs.value[accountId] || ''
  accountsStore.updateAccount(accountId, { password })
  validateAccount(accountId)
}

// Удаление учетной записи
const deleteAccount = (accountId: string) => {
  accountsStore.deleteAccount(accountId)
  delete tagsInputs.value[accountId]
  delete loginInputs.value[accountId]
  delete passwordInputs.value[accountId]
  delete validationErrors[accountId]
}

// Валидация учетной записи
const validateAccount = (accountId: string) => {
  const account = accountsStore.getAccountById(accountId)
  if (account) {
    const errors = accountsStore.validateAccount(account)
    validationErrors[accountId] = errors
  }
}

// Инициализация при монтировании
onMounted(() => {
  initializeInputs()
  // Валидация всех существующих учетных записей
  accountsStore.accounts.forEach(account => {
    validateAccount(account.id)
  })
})
</script>

<style scoped>
.account-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  font-size: 16px;
  color: #606266;
  font-weight: normal;
}

.form-headers {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 2fr 80px;
  gap: 15px;
  margin-bottom: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #e4e7ed;
}

.header-item {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.account-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 2fr 80px;
  gap: 15px;
  align-items: start;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.field-wrapper {
  position: relative;
}

.disabled-field {
  height: 32px;
  line-height: 32px;
  padding: 0 11px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #c0c4cc;
  font-size: 14px;
}

.error-field {
  border-color: #f56c6c !important;
}

.error-field:focus {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2) !important;
}

.error-message {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
  z-index: 10;
}

:deep(.el-input__wrapper) {
  transition: border-color 0.2s;
}

:deep(.error-field .el-input__wrapper) {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 1px #f56c6c inset !important;
}

:deep(.error-field .el-input__wrapper:hover) {
  border-color: #f56c6c !important;
}

:deep(.error-field .el-input__wrapper.is-focus) {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 1px #f56c6c inset !important;
}

@media (max-width: 768px) {
  .form-headers,
  .account-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .header-item {
    display: none;
  }

  .field-wrapper::before {
    content: attr(data-label);
    display: block;
    font-weight: 600;
    margin-bottom: 5px;
    color: #303133;
  }
}
</style>

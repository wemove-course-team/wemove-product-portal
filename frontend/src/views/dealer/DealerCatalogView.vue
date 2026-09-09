<template>
  <div class="catalog-page">
    <header class="page-heading"><div><p class="eyebrow">{{ quickOrder ? 'QUICK ORDER' : 'AUTHORIZED CATALOG' }}</p><h1>{{ quickOrder ? '快捷下单' : '授权商品' }}</h1><p>{{ quickOrder ? '按最低起订量选择商品和数量，提交后由平台人工确认价格、库存与交期。' : '仅展示当前可采购商品、经销商价与最低起订量；商品资料由平台统一维护。' }}</p></div><el-button type="primary" :disabled="!selectedItems.length" @click="openOrder"><el-icon><ShoppingCart /></el-icon>快捷下单（{{ selectedItems.length }}）</el-button></header>

    <section class="filter-card">
      <el-input v-model="keyword" clearable placeholder="搜索商品名称或 SKU" @keyup.enter="search" @clear="search"><template #prefix><el-icon><Search /></el-icon></template></el-input>
      <el-button @click="search">查询</el-button><span>共 {{ total }} 件授权商品</span>
    </section>

    <AsyncState :loading="loading" loading-text="正在读取授权目录…" :error="error" :empty="!loading && !products.length" empty-text="没有符合条件的授权商品" @retry="load">
      <section class="product-grid">
        <article v-for="product in products" :key="product.id" class="product-card" :class="{ selected: selected[product.id] }">
          <div class="product-image"><img v-if="product.coverImage" :src="product.coverImage" :alt="product.name" /><el-icon v-else><Picture /></el-icon><span class="category-tag">{{ product.categoryName }}</span></div>
          <div class="product-body"><div class="sku">{{ product.sku }}</div><h2>{{ product.name }}</h2><p>{{ product.summary || '暂无商品摘要' }}</p><div class="product-meta"><span><small>经销商价</small><strong>{{ formatCurrency(product.dealerPrice) }}</strong></span><span><small>起订量</small><strong>{{ product.moq }} 件</strong></span></div></div>
          <div class="product-actions">
            <el-input-number v-if="selected[product.id]" v-model="selected[product.id]" :min="product.moq" :max="100000" :step="product.moq" controls-position="right" />
            <el-button v-if="selected[product.id]" type="danger" plain @click="removeProduct(product.id)">移除</el-button>
            <el-button v-else type="primary" plain @click="selectProduct(product)">加入采购清单</el-button>
          </div>
        </article>
      </section>
    </AsyncState>

    <el-pagination v-if="total > pageSize" v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" @current-change="load" />

    <transition name="selection"><div v-if="selectedItems.length" class="selection-bar"><div><strong>已选 {{ selectedItems.length }} 款</strong><span>共 {{ selectedQuantity }} 件 · 预估 {{ formatCurrency(selectedAmount) }}</span></div><div><el-button @click="quoteDialog = true">提交询价</el-button><el-button type="primary" @click="openOrder">创建订单</el-button></div></div></transition>

    <el-dialog v-model="quoteDialog" title="提交报价请求" width="560px" append-to-body>
      <el-alert title="平台回复后形成报价版本；过期报价不能转为订单。" type="info" :closable="false" show-icon />
      <el-form ref="quoteFormRef" :model="quoteForm" :rules="quoteRules" label-position="top" class="dialog-form">
        <el-form-item label="期望交期" prop="requestedDeliveryDate"><el-date-picker v-model="quoteForm.requestedDeliveryDate" type="date" value-format="YYYY-MM-DD" :disabled-date="disablePast" placeholder="选择期望到货日期" /></el-form-item>
        <el-form-item label="询价备注"><el-input v-model="quoteForm.notes" type="textarea" :rows="4" maxlength="1000" show-word-limit placeholder="补充包装、交付或项目要求" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="quoteDialog = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitQuote">确认提交</el-button></template>
    </el-dialog>

    <el-dialog v-model="orderDialog" title="创建 B2B 采购订单" width="620px" append-to-body>
      <el-form ref="orderFormRef" :model="orderForm" :rules="orderRules" label-position="top" class="dialog-form">
        <el-form-item label="收货地址" prop="addressId"><el-select v-model="orderForm.addressId" placeholder="请选择企业地址" style="width:100%"><el-option v-for="address in addresses" :key="address.id" :label="`${address.label} · ${address.recipientName} · ${address.detailAddress}`" :value="Number(address.id)" /></el-select><router-link v-if="!addresses.length" to="/dealer/company" class="field-link">尚无地址，先前往企业资料添加</router-link></el-form-item>
        <div class="form-row"><el-form-item label="结算方式" prop="paymentMethod"><el-select v-model="orderForm.paymentMethod"><el-option label="银行转账" value="BANK_TRANSFER" /><el-option label="采购订单（PO）" value="PURCHASE_ORDER" /></el-select></el-form-item><el-form-item v-if="orderForm.paymentMethod === 'PURCHASE_ORDER'" label="PO Number" prop="poNumber"><el-input v-model="orderForm.poNumber" maxlength="64" placeholder="例如 PO-2026-001" /></el-form-item></div>
        <el-form-item label="期望交期" prop="requestedDeliveryDate"><el-date-picker v-model="orderForm.requestedDeliveryDate" type="date" value-format="YYYY-MM-DD" :disabled-date="disablePast" /></el-form-item>
        <el-form-item label="采购备注"><el-input v-model="orderForm.notes" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
        <div class="order-total"><span>订单预估金额</span><strong>{{ formatCurrency(selectedAmount) }}</strong><small>提交后进入平台人工确认，最终以确认单为准。</small></div>
      </el-form>
      <template #footer><el-button @click="orderDialog = false">取消</el-button><el-button type="primary" :loading="submitting" :disabled="!addresses.length" @click="submitOrder">提交订单</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AsyncState from '../../components/AsyncState.vue'
import { dealerApi } from '../../services/dealer'
import { formatCurrency } from '../../utils/dealer'

/** 授权目录把浏览、询价和快捷采购合并为真实业务入口，数量始终受 MOQ 约束。 */
defineProps({ quickOrder: { type: Boolean, default: false } })
const products = ref([]); const total = ref(0); const page = ref(1); const pageSize = 12
const keyword = ref(''); const loading = ref(false); const error = ref(null); const submitting = ref(false)
const selected = ref({}); const quoteDialog = ref(false); const orderDialog = ref(false); const addresses = ref([])
const quoteFormRef = ref(null); const orderFormRef = ref(null)
const quoteForm = reactive({ requestedDeliveryDate: '', notes: '' })
const orderForm = reactive({ addressId: null, paymentMethod: 'BANK_TRANSFER', poNumber: '', requestedDeliveryDate: '', notes: '' })
const quoteRules = { requestedDeliveryDate: [{ required: true, message: '请选择期望交期', trigger: 'change' }] }
const orderRules = {
  addressId: [{ required: true, message: '请选择收货地址', trigger: 'change' }],
  paymentMethod: [{ required: true, message: '请选择结算方式', trigger: 'change' }],
  poNumber: [{ validator: (_rule, value, done) => orderForm.paymentMethod !== 'PURCHASE_ORDER' || String(value || '').trim() ? done() : done(new Error('使用采购订单结算时必须填写 PO Number')), trigger: 'blur' }],
  requestedDeliveryDate: [{ required: true, message: '请选择期望交期', trigger: 'change' }]
}

const selectedItems = computed(() => products.value.filter((p) => selected.value[p.id]).map((p) => ({ ...p, quantity: Number(selected.value[p.id]) })))
const selectedQuantity = computed(() => selectedItems.value.reduce((sum, item) => sum + item.quantity, 0))
const selectedAmount = computed(() => selectedItems.value.reduce((sum, item) => sum + item.dealerPrice * item.quantity, 0))

async function load() { loading.value = true; error.value = null; try { const data = (await dealerApi.catalog({ keyword: keyword.value.trim() || undefined, page: page.value, pageSize })).data; products.value = data.items || []; total.value = data.total || 0 } catch (reason) { error.value = reason } finally { loading.value = false } }
function search() { page.value = 1; load() }
function selectProduct(product) { selected.value = { ...selected.value, [product.id]: product.moq } }
function removeProduct(id) { const next = { ...selected.value }; delete next[id]; selected.value = next }
function payloadItems() { return selectedItems.value.map((item) => ({ productId: Number(item.id), quantity: item.quantity })) }
function disablePast(date) { return date.getTime() < new Date().setHours(0, 0, 0, 0) }

async function submitQuote() {
  if (!(await quoteFormRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try { const data = (await dealerApi.createQuote({ items: payloadItems(), ...quoteForm })).data; ElMessage.success(`报价请求 ${data.quoteNo} 已提交`); quoteDialog.value = false; selected.value = {} }
  catch (reason) { ElMessage.error(reason.message || '询价提交失败') } finally { submitting.value = false }
}

async function openOrder() {
  if (!selectedItems.value.length) return
  try { const data = (await dealerApi.company()).data; addresses.value = data.addresses || []; orderForm.addressId = Number(addresses.value.find((item) => item.isDefault)?.id || addresses.value[0]?.id || 0) || null; orderDialog.value = true }
  catch (reason) { ElMessage.error(reason.message || '企业地址加载失败') }
}

async function submitOrder() {
  if (!(await orderFormRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try { const data = (await dealerApi.createOrder({ items: payloadItems(), ...orderForm })).data; ElMessage.success(`订单 ${data.orderNo} 已提交平台确认`); orderDialog.value = false; selected.value = {} }
  catch (reason) { ElMessage.error(reason.message || '订单提交失败') } finally { submitting.value = false }
}

onMounted(load)
</script>

<style scoped>
.catalog-page { padding-bottom: 86px; }.page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:20px; }.eyebrow { margin:0 0 5px; color:var(--accent-color); font-size:10px; font-weight:800; letter-spacing:.15em; }.page-heading h1 { margin:0; font-size:25px; }.page-heading p:last-child { margin:5px 0 0; color:var(--text-muted); font-size:13px; }.filter-card { display:grid; grid-template-columns:minmax(240px,440px) auto 1fr; align-items:center; gap:10px; margin-bottom:18px; padding:14px; background:#fff; border:1px solid var(--border-color); border-radius:13px; }.filter-card span { justify-self:end; color:var(--text-light); font-size:11px; }
.product-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }.product-card { min-width:0; overflow:hidden; background:#fff; border:1px solid var(--border-color); border-radius:15px; box-shadow:var(--shadow-sm); transition:.2s ease; }.product-card:hover,.product-card.selected { border-color:var(--primary-color); box-shadow:var(--shadow-md); }.product-image { position:relative; height:180px; display:grid; place-items:center; overflow:hidden; color:var(--text-light); background:var(--bg-light); }.product-image img { width:100%; height:100%; object-fit:cover; }.product-image > .el-icon { font-size:42px; }.category-tag { position:absolute; left:12px; top:12px; padding:4px 9px; color:var(--text-muted); background:rgba(255,255,255,.9); border-radius:999px; font-size:10px; }.product-body { padding:17px 17px 13px; }.sku { color:var(--text-light); font-size:10px; letter-spacing:.08em; }.product-body h2 { height:46px; margin:5px 0; overflow:hidden; font-size:16px; line-height:1.45; }.product-body > p { height:40px; margin:0 0 14px; overflow:hidden; color:var(--text-muted); font-size:11px; line-height:1.75; }.product-meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding-top:12px; border-top:1px solid var(--border-color); }.product-meta span { display:grid; }.product-meta small { color:var(--text-light); font-size:10px; }.product-meta strong { margin-top:2px; color:var(--accent-color); font-size:14px; }.product-meta span:last-child strong { color:var(--text-color); }.product-actions { display:flex; gap:8px; padding:0 17px 17px; }.product-actions .el-input-number { min-width:0; flex:1; }.product-actions .el-button { margin-left:0; }
.el-pagination { justify-content:center; margin-top:22px; }.selection-bar { position:fixed; left:calc(244px + 50%); bottom:20px; z-index:45; transform:translateX(-50%); width:min(760px,calc(100vw - 300px)); display:flex; align-items:center; justify-content:space-between; gap:18px; padding:13px 16px 13px 20px; color:#fff; background:#252b2c; border-radius:15px; box-shadow:0 14px 38px rgba(31,41,55,.3); }.selection-bar > div:first-child { display:grid; }.selection-bar strong { font-size:13px; }.selection-bar span { color:rgba(255,255,255,.58); font-size:10px; }.selection-enter-active,.selection-leave-active { transition:.2s ease; }.selection-enter-from,.selection-leave-to { transform:translate(-50%,16px); opacity:0; }
.dialog-form { margin-top:18px; }.form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }.field-link { display:block; margin-top:5px; color:var(--accent-color); font-size:11px; }.order-total { display:grid; gap:3px; padding:15px; background:var(--bg-light); border-radius:11px; }.order-total span,.order-total small { color:var(--text-muted); font-size:11px; }.order-total strong { color:var(--accent-color); font-size:20px; }
@media (max-width:1180px) { .product-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:900px) { .selection-bar { left:50%; width:calc(100vw - 32px); }.page-heading { align-items:flex-start; flex-direction:column; } }
@media (max-width:620px) { .product-grid,.form-row { grid-template-columns:1fr; }.filter-card { grid-template-columns:1fr auto; }.filter-card span { grid-column:1/-1; justify-self:start; }.selection-bar { align-items:flex-start; flex-direction:column; }.selection-bar > div:last-child { display:flex; width:100%; }.selection-bar .el-button { flex:1; }.product-image { height:210px; } }
</style>

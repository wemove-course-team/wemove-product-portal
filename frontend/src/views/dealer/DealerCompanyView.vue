<template>
  <div class="company-page">
    <header class="page-heading"><div><p class="eyebrow">COMPANY & ACCESS</p><h1>企业、成员与地址</h1><p>企业是价格、订单、报价和单据的数据边界；只有企业管理员可以修改资料。</p></div><el-button :loading="loading" @click="load"><el-icon><Refresh /></el-icon>刷新</el-button></header>
    <AsyncState :loading="loading" :error="error" @retry="load">
      <el-tabs v-model="activeTab" class="company-card">
        <el-tab-pane label="企业资料" name="company">
          <div class="permission-banner"><el-icon><Lock /></el-icon><span><strong>{{ isOwner ? '企业管理员权限' : '只读成员权限' }}</strong><small>{{ isOwner ? '可维护联系人和业务类型；企业名称、税号、等级与区域由平台管理员维护。' : '如需变更企业资料，请联系本企业管理员。' }}</small></span></div>
          <el-form ref="companyFormRef" :model="companyForm" :rules="companyRules" label-position="top" class="company-form">
            <div class="form-grid readonly-grid"><el-form-item label="企业名称"><el-input :model-value="data?.company?.companyName" disabled /></el-form-item><el-form-item label="统一社会信用代码"><el-input :model-value="data?.company?.taxId" disabled /></el-form-item><el-form-item label="授权区域"><el-input :model-value="data?.company?.region" disabled /></el-form-item><el-form-item label="经销商等级"><el-input :model-value="data?.company?.tierName" disabled /></el-form-item></div>
            <div class="section-title"><div><h2>可维护信息</h2><p>修改后立即用于订单联系人和企业展示。</p></div></div>
            <div class="form-grid"><el-form-item label="业务类型" prop="businessType"><el-input v-model="companyForm.businessType" maxlength="64" :disabled="!isOwner" /></el-form-item><el-form-item label="联系人" prop="contactName"><el-input v-model="companyForm.contactName" maxlength="64" :disabled="!isOwner" /></el-form-item><el-form-item label="联系电话" prop="contactPhone"><el-input v-model="companyForm.contactPhone" maxlength="32" :disabled="!isOwner" /></el-form-item><el-form-item label="联系邮箱" prop="contactEmail"><el-input v-model="companyForm.contactEmail" maxlength="128" :disabled="!isOwner" /></el-form-item></div>
            <div v-if="isOwner" class="form-actions"><el-button :disabled="saving" @click="resetCompany">重置</el-button><el-button type="primary" :loading="saving" @click="saveCompany">保存企业资料</el-button></div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane :label="`成员（${data?.members?.length || 0}）`" name="members">
          <el-alert title="成员停用和邀请需要一次性邀请链接与邮件通知；当前版本先展示真实企业成员，避免提供无法完成的假按钮。" type="info" :closable="false" show-icon />
          <el-table :data="data?.members || []" stripe class="data-table"><el-table-column prop="username" label="用户名" min-width="140" /><el-table-column prop="realName" label="姓名" min-width="110"><template #default="{row}">{{row.realName||'-'}}</template></el-table-column><el-table-column prop="email" label="邮箱" min-width="210" /><el-table-column label="企业角色" width="130"><template #default="{row}"><el-tag effect="plain" :type="row.memberRole==='OWNER'?'warning':'info'">{{row.memberRole==='OWNER'?'企业管理员':'采购成员'}}</el-tag></template></el-table-column><el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="row.status===1?'success':'danger'">{{row.status===1?'已启用':'已停用'}}</el-tag></template></el-table-column><el-table-column label="加入时间" width="150"><template #default="{row}">{{formatBusinessDate(row.createdAt)}}</template></el-table-column></el-table>
        </el-tab-pane>

        <el-tab-pane :label="`企业地址（${data?.addresses?.length || 0}）`" name="addresses">
          <div class="tab-toolbar"><p>订单只能选择本企业地址簿中的收货地址。</p><el-button v-if="isOwner" type="primary" @click="addressDialog=true"><el-icon><Plus /></el-icon>新增地址</el-button></div>
          <div v-if="data?.addresses?.length" class="address-grid"><article v-for="address in data.addresses" :key="address.id" class="address-card"><div class="address-head"><h3>{{address.label}}</h3><div><el-tag size="small" effect="plain">{{addressTypeText(address.addressType)}}</el-tag><el-tag v-if="address.isDefault" size="small" type="success">默认</el-tag></div></div><p>{{address.province}}{{address.city}}{{address.district}}{{address.detailAddress}}</p><span>{{address.recipientName}} · {{address.phone}}</span></article></div>
          <el-empty v-else description="尚未维护企业地址" />
        </el-tab-pane>
      </el-tabs>
    </AsyncState>

    <el-dialog v-model="addressDialog" title="新增企业地址" width="600px" append-to-body>
      <el-form ref="addressFormRef" :model="addressForm" :rules="addressRules" label-position="top"><div class="form-grid"><el-form-item label="地址标签" prop="label"><el-input v-model="addressForm.label" maxlength="64" placeholder="例如：上海仓库" /></el-form-item><el-form-item label="地址类型" prop="addressType"><el-select v-model="addressForm.addressType"><el-option label="收货地址" value="SHIPPING" /><el-option label="账单地址" value="BILLING" /><el-option label="企业总部" value="HEADQUARTERS" /></el-select></el-form-item><el-form-item label="收件人" prop="recipientName"><el-input v-model="addressForm.recipientName" maxlength="64" /></el-form-item><el-form-item label="联系电话" prop="phone"><el-input v-model="addressForm.phone" maxlength="32" /></el-form-item><el-form-item label="省/直辖市" prop="province"><el-input v-model="addressForm.province" maxlength="64" /></el-form-item><el-form-item label="城市" prop="city"><el-input v-model="addressForm.city" maxlength="64" /></el-form-item><el-form-item label="区县" prop="district"><el-input v-model="addressForm.district" maxlength="64" /></el-form-item><el-form-item label="详细地址" prop="detailAddress"><el-input v-model="addressForm.detailAddress" maxlength="255" /></el-form-item></div><el-form-item><el-checkbox v-model="addressForm.isDefault">设为该类型的默认地址</el-checkbox></el-form-item></el-form>
      <template #footer><el-button @click="addressDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveAddress">保存地址</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AsyncState from '../../components/AsyncState.vue'
import { dealerApi } from '../../services/dealer'
import { formatBusinessDate } from '../../utils/dealer'

/** 企业资料编辑严格服从 OWNER/MEMBER 企业内角色，不以前端隐藏代替后端鉴权。 */
const activeTab=ref('company');const loading=ref(false);const saving=ref(false);const error=ref(null);const data=ref(null);const addressDialog=ref(false);const companyFormRef=ref(null);const addressFormRef=ref(null)
const companyForm=reactive({businessType:'',contactName:'',contactPhone:'',contactEmail:''});let companySnapshot={}
const addressForm=reactive({label:'',recipientName:'',phone:'',province:'',city:'',district:'',detailAddress:'',addressType:'SHIPPING',isDefault:false})
const isOwner=computed(()=>data.value?.memberRole==='OWNER')
const required=(message)=>[{required:true,message,trigger:'blur'}]
const companyRules={businessType:required('请填写业务类型'),contactName:required('请填写联系人'),contactPhone:[...required('请填写联系电话'),{pattern:/^[0-9+\-()\s]{6,32}$/,message:'联系电话格式不正确',trigger:'blur'}],contactEmail:[...required('请填写联系邮箱'),{type:'email',message:'邮箱格式不正确',trigger:'blur'}]}
const addressRules={label:required('请填写地址标签'),recipientName:required('请填写收件人'),phone:[...required('请填写联系电话'),{pattern:/^[0-9+\-()\s]{6,32}$/,message:'联系电话格式不正确',trigger:'blur'}],province:required('请填写省/直辖市'),city:required('请填写城市'),district:required('请填写区县'),detailAddress:required('请填写详细地址'),addressType:required('请选择地址类型')}
async function load(){loading.value=true;error.value=null;try{data.value=(await dealerApi.company()).data;resetCompany()}catch(reason){error.value=reason}finally{loading.value=false}}
function resetCompany(){const c=data.value?.company||{};companySnapshot={businessType:c.businessType||'',contactName:c.contactName||'',contactPhone:c.contactPhone||'',contactEmail:c.contactEmail||''};Object.assign(companyForm,companySnapshot)}
async function saveCompany(){if(!(await companyFormRef.value?.validate().catch(()=>false)))return;saving.value=true;try{data.value=(await dealerApi.updateCompany({...companyForm})).data;resetCompany();ElMessage.success('企业资料已保存')}catch(reason){ElMessage.error(reason.message||'企业资料保存失败')}finally{saving.value=false}}
async function saveAddress(){if(!(await addressFormRef.value?.validate().catch(()=>false)))return;saving.value=true;try{await dealerApi.createAddress({...addressForm});ElMessage.success('企业地址已新增');addressDialog.value=false;Object.assign(addressForm,{label:'',recipientName:'',phone:'',province:'',city:'',district:'',detailAddress:'',addressType:'SHIPPING',isDefault:false});await load()}catch(reason){ElMessage.error(reason.message||'地址保存失败')}finally{saving.value=false}}
function addressTypeText(value){return {SHIPPING:'收货',BILLING:'账单',HEADQUARTERS:'总部'}[value]||value}
onMounted(load)
</script>

<style scoped>
.company-page{min-width:0}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:20px}.eyebrow{margin:0 0 5px;color:var(--accent-color);font-size:10px;font-weight:800;letter-spacing:.15em}.page-heading h1{margin:0;font-size:25px}.page-heading p:last-child{margin:5px 0 0;color:var(--text-muted);font-size:13px}.company-card{padding:0 22px 22px;background:#fff;border:1px solid var(--border-color);border-radius:15px;box-shadow:var(--shadow-sm)}.permission-banner{display:flex;align-items:center;gap:13px;margin:8px 0 20px;padding:14px;color:var(--text-muted);background:var(--bg-light);border-radius:11px}.permission-banner>.el-icon{font-size:22px;color:var(--primary-hover)}.permission-banner span{display:grid}.permission-banner strong{font-size:12px}.permission-banner small{font-size:10px;color:var(--text-light)}.company-form{max-width:920px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.readonly-grid{padding:17px 17px 0;background:var(--bg-light);border-radius:12px}.section-title{margin:22px 0 9px}.section-title h2{margin:0;font-size:16px}.section-title p,.tab-toolbar p{margin:3px 0 0;color:var(--text-light);font-size:11px}.form-actions{display:flex;justify-content:flex-end;gap:9px;padding-top:16px;border-top:1px solid var(--border-color)}.data-table{margin-top:17px}.tab-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:8px 0 16px}.address-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.address-card{padding:17px;border:1px solid var(--border-color);border-radius:12px}.address-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.address-head h3{margin:0;font-size:14px}.address-head>div{display:flex;gap:5px}.address-card p{margin:13px 0 6px;font-size:12px}.address-card>span{color:var(--text-muted);font-size:11px}
@media(max-width:680px){.page-heading{align-items:flex-start;flex-direction:column}.company-card{padding:0 13px 16px}.form-grid,.address-grid{grid-template-columns:1fr}.tab-toolbar{align-items:flex-start;flex-direction:column}}
</style>

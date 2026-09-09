<template>
  <div class="dealers-page">
    <header class="page-heading"><div><p class="eyebrow">CHANNEL OPERATIONS</p><h1>经销商管理</h1><p>审核企业申请、配置等级与折扣，并控制已入驻企业的访问状态。</p></div><el-button :loading="loading" @click="loadActive"><el-icon><Refresh /></el-icon>刷新</el-button></header>

    <el-tabs v-model="activeTab" class="page-card" @tab-change="loadActive">
      <el-tab-pane name="applications"><template #label>入驻申请 <el-badge v-if="pendingCount" :value="pendingCount" /></template>
        <div class="toolbar"><el-select v-model="applicationStatus" clearable placeholder="全部申请状态" @change="searchApplications"><el-option label="待审核" value="PENDING" /><el-option label="已通过" value="APPROVED" /><el-option label="已拒绝" value="REJECTED" /></el-select><span>只有待审核申请可以执行审核；已完成记录永久保留。</span></div>
        <el-alert v-if="error" :title="error.message || '申请列表加载失败'" type="error" show-icon :closable="false" class="error-alert" />
        <el-table v-loading="loading" :data="items" stripe empty-text="暂无符合条件的申请">
          <el-table-column prop="id" label="申请编号" min-width="190" show-overflow-tooltip />
          <el-table-column prop="companyName" label="企业名称" min-width="220" show-overflow-tooltip />
          <el-table-column label="联系人" min-width="150"><template #default="{row}"><div class="stack-cell"><strong>{{row.contactName}}</strong><span>{{row.phone}}</span></div></template></el-table-column>
          <el-table-column prop="region" label="目标区域" min-width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="110"><template #default="{row}"><el-tag :type="statusType(row.status)" effect="plain">{{statusText(row.status)}}</el-tag></template></el-table-column>
          <el-table-column label="提交时间" width="165"><template #default="{row}">{{formatBusinessDate(row.createdAt,true)}}</template></el-table-column>
          <el-table-column label="操作" width="100" fixed="right"><template #default="{row}"><el-button link type="primary" :disabled="row.status!=='PENDING'" @click="openReview(row)">{{row.status==='PENDING'?'审核':'已处理'}}</el-button></template></el-table-column>
        </el-table>
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="loadApplications" />
      </el-tab-pane>

      <el-tab-pane label="已入驻企业" name="companies">
        <div class="toolbar"><el-select v-model="companyStatus" clearable placeholder="全部企业状态" @change="loadCompanies"><el-option label="已启用" value="ACTIVE" /><el-option label="已停用" value="SUSPENDED" /></el-select><span>停用企业会立即阻断其全部成员访问经销商中心，但不会删除历史订单、报价和单据。</span></div>
        <el-alert v-if="error" :title="error.message || '企业列表加载失败'" type="error" show-icon :closable="false" class="error-alert" />
        <el-table v-loading="loading" :data="companies" stripe empty-text="暂无经销商企业">
          <el-table-column prop="companyName" label="企业名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="region" label="授权区域" min-width="190" show-overflow-tooltip />
          <el-table-column prop="tierName" label="等级" min-width="140" />
          <el-table-column label="折扣率" width="100"><template #default="{row}">{{formatDiscount(row.discountRate)}}</template></el-table-column>
          <el-table-column label="成员" width="90"><template #default="{row}">{{row.memberCount}} 人</template></el-table-column>
          <el-table-column label="联系人" min-width="170"><template #default="{row}"><div class="stack-cell"><strong>{{row.contactName}}</strong><span>{{row.contactPhone}}</span></div></template></el-table-column>
          <el-table-column label="企业状态" width="120" fixed="right"><template #default="{row}"><el-switch v-model="row.status" active-value="ACTIVE" inactive-value="SUSPENDED" inline-prompt active-text="启" inactive-text="停" :loading="updatingCompanyId===row.id" @change="changeCompanyStatus(row)" /></template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogVisible" title="审核经销商申请" width="640px" append-to-body>
      <el-descriptions v-if="selected" :column="2" border><el-descriptions-item label="申请编号" :span="2">{{selected.id}}</el-descriptions-item><el-descriptions-item label="企业名称" :span="2">{{selected.companyName}}</el-descriptions-item><el-descriptions-item label="统一社会信用代码">{{selected.taxId}}</el-descriptions-item><el-descriptions-item label="业务类型">{{selected.businessType}}</el-descriptions-item><el-descriptions-item label="联系人">{{selected.contactName}} / {{selected.phone}}</el-descriptions-item><el-descriptions-item label="联系邮箱">{{selected.email}}</el-descriptions-item><el-descriptions-item label="目标区域" :span="2">{{selected.region}}</el-descriptions-item><el-descriptions-item label="年度目标">{{selected.annualTarget}}</el-descriptions-item><el-descriptions-item label="销售渠道">{{selected.salesChannels||'-'}}</el-descriptions-item></el-descriptions>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="review-form">
        <el-form-item label="审核结果" prop="action"><el-segmented v-model="form.action" :options="reviewOptions" /></el-form-item>
        <div v-if="form.action==='APPROVED'" class="approve-grid"><el-form-item label="经销商等级" prop="tierName"><el-input v-model="form.tierName" maxlength="64" placeholder="例如：一级核心经销商" /></el-form-item><el-form-item label="结算折扣率" prop="discountRate"><el-input-number v-model="form.discountRate" :min="0.1" :max="1" :step="0.05" :precision="2" /><span class="field-hint">{{formatDiscount(form.discountRate)}}；审核后用户将获得经销商身份。</span></el-form-item></div>
        <el-form-item label="审核备注" prop="auditNote"><el-input v-model="form.auditNote" type="textarea" :rows="4" maxlength="255" show-word-limit :placeholder="form.action==='REJECTED'?'必须说明拒绝原因':'记录资质、区域和商业条款依据'" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button :type="form.action==='REJECTED'?'danger':'primary'" :loading="reviewing" @click="submitReview">确认{{form.action==='REJECTED'?'拒绝':'通过'}}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDealerStore } from '../../stores/dealer'
import { dealerApi } from '../../services/dealer'
import { formatBusinessDate } from '../../utils/dealer'

/** 管理端经销商审核与企业状态控制；危险动作都展示影响并二次确认。 */
const dealerStore=useDealerStore();const activeTab=ref('applications');const items=ref([]);const companies=ref([]);const total=ref(0);const pendingCount=ref(0);const page=ref(1);const pageSize=10;const applicationStatus=ref('');const companyStatus=ref('');const loading=ref(false);const reviewing=ref(false);const updatingCompanyId=ref(null);const error=ref(null);const dialogVisible=ref(false);const selected=ref(null);const formRef=ref(null)
const form=reactive({action:'APPROVED',tierName:'二级特约经销商',discountRate:0.75,auditNote:''});const reviewOptions=[{label:'审核通过',value:'APPROVED'},{label:'拒绝申请',value:'REJECTED'}]
const rules={action:[{required:true,message:'请选择审核结果',trigger:'change'}],tierName:[{validator:(_r,v,done)=>form.action!=='APPROVED'||String(v||'').trim()?done():done(new Error('审核通过时必须填写经销商等级')),trigger:'blur'}],discountRate:[{validator:(_r,v,done)=>form.action!=='APPROVED'||(Number(v)>=0.1&&Number(v)<=1)?done():done(new Error('折扣率必须在 0.10 到 1.00 之间')),trigger:'change'}],auditNote:[{required:true,message:'请填写审核备注',trigger:'blur'},{min:5,message:'审核备注至少 5 个字符',trigger:'blur'}]}
async function loadActive(){if(activeTab.value==='companies')return loadCompanies();return loadApplications()}
async function loadApplications(){loading.value=true;error.value=null;try{const data=await dealerStore.fetchAdminApplications({page:page.value,pageSize,status:applicationStatus.value||undefined});items.value=data.items||[];total.value=data.total||0;if(!applicationStatus.value){const pending=await dealerStore.fetchAdminApplications({page:1,pageSize:1,status:'PENDING'});pendingCount.value=pending.total||0}else if(applicationStatus.value==='PENDING')pendingCount.value=data.total||0}catch(reason){error.value=reason}finally{loading.value=false}}
function searchApplications(){page.value=1;loadApplications()}
async function loadCompanies(){loading.value=true;error.value=null;try{companies.value=(await dealerApi.adminCompanies({status:companyStatus.value||undefined})).data||[]}catch(reason){error.value=reason}finally{loading.value=false}}
function openReview(row){selected.value=row;Object.assign(form,{action:'APPROVED',tierName:row.tierName&&row.tierName!=='待定'?row.tierName:'二级特约经销商',discountRate:Number(row.discountRate)||.75,auditNote:''});dialogVisible.value=true}
async function submitReview(){if(!(await formRef.value?.validate().catch(()=>false)))return;const actionText=form.action==='APPROVED'?'通过申请并授予经销商身份':'拒绝申请';try{await ElMessageBox.confirm(`确定${actionText}“${selected.value.companyName}”吗？该审核记录保存后不可重复处理。`,'确认审核结果',{type:form.action==='REJECTED'?'warning':'info',confirmButtonText:'确认提交',cancelButtonText:'取消'});reviewing.value=true;await dealerStore.reviewApplication(selected.value.id,{...form,tierName:form.action==='APPROVED'?form.tierName.trim():undefined,discountRate:form.action==='APPROVED'?Number(form.discountRate):undefined,auditNote:form.auditNote.trim()});ElMessage.success('审核结果已保存');dialogVisible.value=false;await loadApplications()}catch(reason){if(reason!=='cancel'&&reason!=='close')ElMessage.error(reason.message||'审核失败')}finally{reviewing.value=false}}
async function changeCompanyStatus(row){const target=row.status;const previous=target==='ACTIVE'?'SUSPENDED':'ACTIVE';try{await ElMessageBox.confirm(target==='SUSPENDED'?`停用“${row.companyName}”后，其 ${row.memberCount} 名成员将立即无法访问经销商中心，历史业务数据会保留。`:`确定重新启用“${row.companyName}”及其成员的经销商中心访问吗？`,target==='SUSPENDED'?'停用经销商企业':'启用经销商企业',{type:'warning',confirmButtonText:target==='SUSPENDED'?'确认停用':'确认启用',cancelButtonText:'取消'});updatingCompanyId.value=row.id;const data=(await dealerApi.updateCompanyStatus(row.id,target)).data;row.status=data.status;ElMessage.success(target==='ACTIVE'?'企业已启用':'企业已停用')}catch(reason){row.status=previous;if(reason!=='cancel'&&reason!=='close')ElMessage.error(reason.message||'企业状态更新失败')}finally{updatingCompanyId.value=null}}
function statusText(status){return{PENDING:'待审核',APPROVED:'已通过',REJECTED:'已拒绝'}[status]||status}function statusType(status){return{PENDING:'warning',APPROVED:'success',REJECTED:'danger'}[status]||'info'}function formatDiscount(value){const n=Number(value);return Number.isFinite(n)?`${(n*10).toFixed(1).replace(/\.0$/,'')} 折`:'-'}
onMounted(loadApplications)
</script>

<style scoped>
.dealers-page{min-width:0}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px}.eyebrow{margin:0 0 5px;color:var(--accent-color);font-size:10px;font-weight:800;letter-spacing:.15em}.page-heading h1{margin:0;font-size:25px}.page-heading p:last-child{margin:5px 0 0;color:var(--text-muted);font-size:13px}.page-card{padding:0 20px 20px;background:#fff;border:1px solid var(--border-color);border-radius:14px;box-shadow:var(--shadow-sm)}.toolbar{display:flex;align-items:center;gap:14px;margin:8px 0 15px;padding:12px;background:var(--bg-light);border-radius:10px}.toolbar .el-select{width:180px}.toolbar span{color:var(--text-light);font-size:10px}.error-alert{margin-bottom:14px}.stack-cell{display:grid}.stack-cell strong{font-size:12px}.stack-cell span{color:var(--text-light);font-size:10px}.el-pagination{justify-content:flex-end;margin-top:17px}.review-form{margin-top:20px}.approve-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.field-hint{display:block;margin-top:5px;color:var(--text-light);font-size:10px}
@media(max-width:700px){.page-heading{align-items:flex-start;flex-direction:column}.page-card{padding:0 12px 15px}.toolbar{align-items:flex-start;flex-direction:column}.toolbar .el-select{width:100%}.approve-grid{grid-template-columns:1fr}.el-pagination{justify-content:flex-start;overflow-x:auto}}
</style>

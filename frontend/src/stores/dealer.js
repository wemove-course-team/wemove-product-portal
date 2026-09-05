import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDealerStore = defineStore('dealer', () => {
  const initialApplications = [
    {
      id: 'APP-2026-0891',
      companyName: '上海晨星益智玩具有限公司',
      contactName: '李经理',
      phone: '13812345678',
      email: 'dealer@starwood.com',
      businessType: '线下母婴及连锁玩具店',
      salesChannels: ['实体专卖店', '私域团购', '早教机构合作'],
      annualTarget: '50-100万',
      region: '华东大区 (上海/江苏/浙江)',
      taxId: '91310115MA1KXXXX01',
      status: 'APPROVED', // PENDING | APPROVED | REJECTED
      tierName: '一级核心经销商',
      discountRate: 0.65,
      submittedAt: '2026-09-02 14:30',
      approvedAt: '2026-09-03 09:15',
      note: '符合华东区核心代理标准，首单起订门槛100件'
    },
    {
      id: 'APP-2026-0902',
      companyName: '广州木语启智科教发展有限公司',
      contactName: '陈总监',
      phone: '13988776655',
      email: 'chen@muyu-edu.cn',
      businessType: 'STEM幼儿园与小学教具采购',
      salesChannels: ['公立/国际学校招标', '创客营地', '线上商城'],
      annualTarget: '100-300万',
      region: '华南大区 (广东/广西)',
      taxId: '91440101MA59XXXX88',
      status: 'PENDING',
      tierName: '二级特约经销商',
      discountRate: 0.75,
      submittedAt: '2026-09-04 11:20',
      approvedAt: null,
      note: '资质审核中，等待电话复核'
    }
  ]

  const savedApps = localStorage.getItem('wemove_dealer_apps')
  const applications = ref(savedApps ? JSON.parse(savedApps) : initialApplications)

  function save() {
    localStorage.setItem('wemove_dealer_apps', JSON.stringify(applications.value))
  }

  function submitApplication(formData) {
    const id = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const newApp = {
      ...formData,
      id,
      status: 'PENDING',
      submittedAt: new Date().toLocaleString(),
      approvedAt: null,
      tierName: '待定',
      discountRate: 0.75,
      note: '新提交申请，等待审核'
    }
    applications.value.unshift(newApp)
    save()
    return newApp
  }

  function approveApplication(id, tierName = '一级核心经销商', discountRate = 0.65) {
    const app = applications.value.find(a => a.id === id)
    if (app) {
      app.status = 'APPROVED'
      app.tierName = tierName
      app.discountRate = discountRate
      app.approvedAt = new Date().toLocaleString()
      app.note = `审核已通过，赋予 ${tierName} 资质，享 ${discountRate * 10} 折`
      save()
    }
  }

  function rejectApplication(id, reason = '资质暂不满足代理门槛') {
    const app = applications.value.find(a => a.id === id)
    if (app) {
      app.status = 'REJECTED'
      app.note = `已驳回：${reason}`
      save()
    }
  }

  return {
    applications,
    submitApplication,
    approveApplication,
    rejectApplication
  }
})


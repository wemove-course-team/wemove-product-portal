import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

export const useProductStore = defineStore('product', () => {
  const userStore = useUserStore()

  const categories = ref([
    { id: 1, name: '益智玩具', slug: 'workshop', desc: '动手创造，在木工中学习工程思维与创意设计' },
    { id: 2, name: '家具定制', slug: 'furniture', desc: '天然原木全屋定制，大师设计传承榫卯' },
    { id: 3, name: '中试打样', slug: 'woodlab', desc: '高校与机构研发打样，感受自然材料温度' },
    { id: 4, name: 'STEM教育', slug: 'stem', desc: '科学工程数学实践，玩中培养综合素养' },
    { id: 5, name: '创意套件', slug: 'kits', desc: '精选主题玩具套件，一站式亲子创造体验' }
  ])

  // Initial seed products (based on live data + WEMOVE SPORTS requirement products)
  const initialProducts = [
    {
      id: 101,
      sku: 'WM-BWL-01',
      name: '儿童实木保龄球套装 (Mini Bowling Set)',
      slug: 'kids-bowling-set',
      categoryId: 1,
      price: 198,
      dealerPrice: 118,
      moq: 10,
      ageRange: '3-10岁',
      material: '天然优质实木 / 水性环保漆',
      scene: '室内亲子 / 幼儿园活动 / 运动协调',
      summary: 'WEMOVE SPORTS 经典运动玩具，含10个木质球瓶与2个保龄球，锻炼儿童手眼协调与身体协调能力。',
      description: '采用高品质实木细致打磨，边缘光滑无毛刺，表面涂覆环保水性漆。配置收纳网袋，轻巧便携，适合家庭客厅、户外草坪及幼教机构活动开展。',
      images: ['/images/prod_20_1.jpg', '/images/prod_14_1.jpg'],
      specs: {
        dimensions: '球瓶 18cm x 5.5cm, 球体 直径 7.5cm',
        netWeight: '1.45 kg',
        packageDimensions: '32 x 20 x 15 cm',
        casePack: 12,
        includedItems: '10个实木球瓶, 2个保龄球, 1个便携帆布袋, 规则卡片'
      },
      published: true,
      featured: true,
      tag: '热销爆款'
    },
    {
      id: 102,
      sku: 'WM-BLC-02',
      name: '极简弧形摇摆平衡板 (Wobble Balance Board)',
      slug: 'wooden-balance-board',
      categoryId: 1,
      price: 268,
      dealerPrice: 160,
      moq: 6,
      ageRange: '3岁及以上 (承重120kg)',
      material: '高强度多层天然桦木',
      scene: '体能感统训练 / 瑜伽拉伸 / 创意开放式玩法',
      summary: '多功能开放式运动玩具，可作平衡板、摇摆椅、小滑梯或阅读拱桥，极大激发儿童想象力。',
      description: '严格按人体工学曲率一体热压成形，表面手工精细打磨，底部可贴防滑毛毡。承重达120kg，大人儿童皆可一同互动使用。',
      images: ['/images/prod_19_1.jpg', '/images/prod_19_2.jpg'],
      specs: {
        dimensions: '83cm x 30cm x 1.8cm',
        netWeight: '3.1 kg',
        packageDimensions: '86 x 32 x 20 cm',
        casePack: 6,
        includedItems: '实木平衡板本体, 防刮地垫, 使用指南'
      },
      published: true,
      featured: true,
      tag: '新品推荐'
    },
    {
      id: 20,
      sku: 'WM-BLK-50',
      name: '50块标准款实木积木套装',
      slug: '50-wooden-blocks',
      categoryId: 1,
      price: 198,
      dealerPrice: 128,
      moq: 12,
      ageRange: '3-8岁',
      material: '德国AA级天然榉木',
      scene: '空间建构 / 建筑启蒙 / 精细动作',
      summary: '德国AA级榉木精选，通过比较高标准安全认证，经典标准几何结构。',
      description: '50块标准款实木积木选用天然榉木精制，质感温润细腻，边缘经过严格圆角倒角处理。涵盖立方体、圆柱、三角等经典几何体，支持多维空间建构想象。',
      images: ['/images/prod_20_1.jpg'],
      specs: {
        dimensions: '基准模块 4cm x 4cm x 4cm',
        netWeight: '2.1 kg',
        packageDimensions: '28 x 20 x 12 cm',
        casePack: 8,
        includedItems: '50块原木积木, 收纳木盒, 造型玩法册'
      },
      published: true,
      featured: true,
      tag: '经典常青'
    },
    {
      id: 14,
      sku: 'WM-CUG-01',
      name: 'Cugolino Basic 滚珠轨道启智套件',
      slug: 'cugolino-basic',
      categoryId: 1,
      price: 328,
      dealerPrice: 210,
      moq: 8,
      ageRange: '4-10岁',
      material: '实木榉木 + 彩色环保漆',
      scene: '重力势能探索 / 轨道拼装',
      summary: '入门级滚珠轨道搭建系统，让孩子直观感受重力加速度与空间拓扑。',
      description: '精巧的凹槽与孔道设计，配合彩色积木块，支持成百上千种不同的滚珠跑道设计。寓教于乐，深受欧美家庭与蒙特梭利机构推崇。',
      images: ['/images/prod_14_1.jpg', '/images/prod_14_2.jpg'],
      specs: {
        dimensions: '标准轨道 5cm 基数',
        netWeight: '2.8 kg',
        packageDimensions: '35 x 25 x 14 cm',
        casePack: 6,
        includedItems: '37件木质轨道组件, 6颗木质滚珠, 玩法说明'
      },
      published: true,
      featured: true,
      tag: '高好评'
    },
    {
      id: 15,
      sku: 'WM-PND-01',
      name: '大摆锤重力动力套件',
      slug: 'pendulum-set',
      categoryId: 1,
      price: 288,
      dealerPrice: 185,
      moq: 10,
      ageRange: '5-12岁',
      material: '实木机械部件 + 黄铜轴承',
      scene: '物理机械实验 / 动量守恒',
      summary: '将物理机械传动融入木玩，展示钟摆摆动与动能传递的迷人规律。',
      description: '精密打磨的木制连杆配合高精度微型轴承，轻推即可产生长时间平稳摆动。不仅是益智玩具，也是极具观赏性的桌面机械艺术品。',
      images: ['/images/prod_15_1.jpg', '/images/prod_15_2.jpg'],
      specs: {
        dimensions: '26cm x 15cm x 32cm',
        netWeight: '1.6 kg',
        packageDimensions: '30 x 18 x 10 cm',
        casePack: 10,
        includedItems: '摆锤支架, 重锤组件, 铜轴承套件, 拼装图纸'
      },
      published: true,
      featured: false,
      tag: '进阶STEM'
    },
    {
      id: 16,
      sku: 'WM-TRN-01',
      name: '小转盘机械传动套',
      slug: 'turntable-set',
      categoryId: 1,
      price: 168,
      dealerPrice: 105,
      moq: 15,
      ageRange: '3-8岁',
      material: '纯天然榉木',
      scene: '齿轮啮合 / 旋转机械',
      summary: '适合低龄儿童的齿轮与转盘互动探索套件，手摇感受机械连动。',
      description: '大齿距实木齿轮，操作手感顺滑阻尼适中。引导孩子在手脑互动中建立齿轮传动与变速直观概念。',
      images: ['/images/prod_16_1.jpg', '/images/prod_16_2.jpg'],
      specs: {
        dimensions: '22cm x 22cm x 8cm',
        netWeight: '0.95 kg',
        packageDimensions: '24 x 24 x 10 cm',
        casePack: 16,
        includedItems: '转盘底座, 齿轮组, 摇柄, 说明手册'
      },
      published: true,
      featured: false,
      tag: '精细操作'
    },
    {
      id: 17,
      sku: 'WM-LIFT-01',
      name: '垂直升降梯木制模型',
      slug: 'elevator-model',
      categoryId: 1,
      price: 248,
      dealerPrice: 158,
      moq: 10,
      ageRange: '5-12岁',
      material: '实木 + 尼龙绳缆',
      scene: '滑轮组省力机械 / 建筑联动',
      summary: '经典滑轮升降机械结构，可与轨道套件无缝对接形成完整回环。',
      description: '通过手摇棘轮机构带动升降轿厢垂直运动，配有自动棘爪防滑落制动，生动还原现代工程电梯核心原理。',
      images: ['/images/prod_17_1.jpg', '/images/prod_17_2.jpg'],
      specs: {
        dimensions: '18cm x 14cm x 40cm',
        netWeight: '1.3 kg',
        packageDimensions: '42 x 16 x 12 cm',
        casePack: 8,
        includedItems: '升降导轨, 轿厢, 棘轮滑轮总成, 钢珠'
      },
      published: true,
      featured: false,
      tag: '场景拓展'
    },
    {
      id: 18,
      sku: 'WM-MAG-01',
      name: '磁吸弹射轨道套件',
      slug: 'magnetic-cannon',
      categoryId: 1,
      price: 268,
      dealerPrice: 172,
      moq: 10,
      ageRange: '6-14岁',
      material: '实木 + 强磁钕铁硼',
      scene: '高斯加速原理 / 磁力发射',
      summary: '结合强力磁铁与钢珠动量，展示令人惊叹的高斯磁力直线加速。',
      description: '当缓慢滚动的钢珠触碰磁铁后端时，前端钢珠以数倍速度瞬间弹射飞出！充满趣味与科学震撼力的经典物理木玩。',
      images: ['/images/prod_18_1.jpg', '/images/prod_18_2.jpg'],
      specs: {
        dimensions: '25cm x 6cm x 5cm',
        netWeight: '0.8 kg',
        packageDimensions: '28 x 8 x 6 cm',
        casePack: 20,
        includedItems: '木质加速槽, 强力磁体, 高精钢珠4颗, 靶标木块'
      },
      published: true,
      featured: false,
      tag: '高科技木玩'
    },
    {
      id: 19,
      sku: 'WM-SNK-01',
      name: '蛇形仿生波浪轨道套装',
      slug: 'snake-track-set',
      categoryId: 1,
      price: 358,
      dealerPrice: 228,
      moq: 6,
      ageRange: '4-12岁',
      material: '精制弹性实木曲条',
      scene: '正弦波曲面 / 重力滑行',
      summary: '优美起伏的连续正弦波木轨，提供极度治愈平稳的滚珠滑行视觉体验。',
      description: '采用高频弯曲成型工艺制作的波浪式轨道，滚珠滑行时产生富有节奏感的敲击木音，深受空间美学设计师与教育工作者喜爱。',
      images: ['/images/prod_19_1.jpg', '/images/prod_19_2.jpg'],
      specs: {
        dimensions: '68cm x 15cm x 18cm',
        netWeight: '2.2 kg',
        packageDimensions: '72 x 18 x 20 cm',
        casePack: 4,
        includedItems: '连续波浪曲轨, 起跑支架, 彩色滚珠8颗'
      },
      published: true,
      featured: false,
      tag: '艺术级美物'
    }
  ]

  const savedProducts = localStorage.getItem('wemove_products')
  const products = ref(savedProducts ? JSON.parse(savedProducts) : initialProducts)

  function saveProducts() {
    localStorage.setItem('wemove_products', JSON.stringify(products.value))
  }

  // Active user pricing helper: calculate real price based on role & dealer tier
  function getProductPrice(product) {
    if (userStore.isDealer) {
      // If dealer, apply wholesale price multiplied by custom tier discount if applicable
      const baseline = product.dealerPrice || Math.round(product.price * 0.65)
      const discounted = Math.round(baseline * (userStore.userInfo.discountRate / 0.65))
      return discounted
    }
    return product.price
  }

  // Product CRUD for Admin
  function addProduct(newProd) {
    const id = Date.now()
    const product = {
      ...newProd,
      id,
      sku: newProd.sku || `WM-${id.toString().slice(-4)}`,
      published: true,
      images: newProd.images?.length ? newProd.images : ['/images/prod_20_1.jpg']
    }
    products.value.unshift(product)
    saveProducts()
    return product
  }

  function updateProduct(id, updatedFields) {
    const idx = products.value.findIndex(p => p.id === Number(id))
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...updatedFields }
      saveProducts()
    }
  }

  function togglePublish(id) {
    const p = products.value.find(item => item.id === Number(id))
    if (p) {
      p.published = !p.published
      saveProducts()
    }
  }

  return {
    categories,
    products,
    getProductPrice,
    addProduct,
    updateProduct,
    togglePublish
  }
})


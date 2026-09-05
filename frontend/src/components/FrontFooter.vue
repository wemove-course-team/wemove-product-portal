<template>
  <footer class="site-footer">
    <div class="footer-content">
      <router-link to="/" class="footer-logo">
        WeMove 惟木匠心
      </router-link>

      <nav class="footer-nav">
        <router-link to="/">品牌首页</router-link>
        <router-link to="/workshop">益智玩具</router-link>
        <router-link to="/furniture">家具定制</router-link>
        <router-link to="/woodlab">中试打样</router-link>
        <router-link to="/stem">STEM课程</router-link>
        <router-link to="/dealers/apply">成为经销商</router-link>
        <router-link to="/electronic">电子说明书</router-link>
      </nav>

      <div class="footer-slogan">
        专注自然实木游戏玩具与全屋定制 · 传承榫卯智慧 · 激发运动与创造力
      </div>

      <p class="footer-copy">
        © 2026 WeMove Sports (www.wemovetoy.com). All Rights Reserved. 浙ICP备XXXXXXXX号
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer-logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: 1px;
}

.footer-slogan {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
</style>


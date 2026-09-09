import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { DataSource } from 'typeorm'
import { RequestUser } from '../../common/request-user'
import {
  AdminInvoiceStatusDto, AdminOrderStatusDto, AdminQuoteDecisionDto,
  CreateDealerAddressDto, CreateDealerOrderDto, CreateDealerQuoteDto,
  DealerWorkspaceQueryDto, UpdateDealerCompanyDto
} from './dealer-workspace.dto'

type DealerContext = { companyId: number; memberRole: 'OWNER' | 'MEMBER'; company: any; user: any }
type ProductRow = { id: number | string; sku: string; name: string; dealer_price: number | string; moq: number | string }

/**
 * 经销商工作台业务服务。
 * 所有查询都强制带 company_id，避免成员越权读取其他经销商的价格、订单和单据。
 */
@Injectable()
export class DealerWorkspaceService {
  constructor(private readonly dataSource: DataSource) {}

  async summary(user: RequestUser) {
    const context = await this.context(user)
    const [counts, recentOrders, recentQuotes] = await Promise.all([
      this.dataSource.query(
        `SELECT
           (SELECT COUNT(*) FROM product WHERE is_published = 1) AS authorized_products,
           (SELECT COUNT(*) FROM dealer_quote WHERE company_id = ? AND status IN ('SUBMITTED','QUOTED')) AS pending_quotes,
           (SELECT COUNT(*) FROM orders WHERE company_id = ? AND status IN ('PENDING_REVIEW','CONFIRMED','PAID','SHIPPED')) AS active_orders,
           (SELECT COUNT(*) FROM dealer_invoice WHERE company_id = ? AND status = 'ISSUED') AS payable_invoices`,
        [context.companyId, context.companyId, context.companyId]
      ),
      this.orderRows(context.companyId, {}, 1, 5),
      this.quoteRows(context.companyId, {}, 1, 5)
    ])
    const stats = counts[0] || {}
    const tasks: Array<{ type: string; title: string; count: number; to: string }> = []
    if (Number(stats.pending_quotes)) tasks.push({ type: 'QUOTE', title: '待处理报价', count: Number(stats.pending_quotes), to: '/dealer/quotes' })
    if (Number(stats.active_orders)) tasks.push({ type: 'ORDER', title: '进行中订单', count: Number(stats.active_orders), to: '/dealer/orders' })
    if (Number(stats.payable_invoices)) tasks.push({ type: 'INVOICE', title: '待处理发票', count: Number(stats.payable_invoices), to: '/dealer/invoices' })
    return {
      company: this.companyDto(context.company),
      memberRole: context.memberRole,
      stats: {
        authorizedProducts: Number(stats.authorized_products), pendingQuotes: Number(stats.pending_quotes),
        activeOrders: Number(stats.active_orders), payableInvoices: Number(stats.payable_invoices)
      },
      tasks,
      recentOrders: recentOrders.items,
      recentQuotes: recentQuotes.items
    }
  }

  async catalog(user: RequestUser, query: DealerWorkspaceQueryDto) {
    const context = await this.context(user)
    const page = query.page || 1
    const pageSize = query.pageSize || 12
    const keyword = String(query.keyword || '').trim()
    const where = keyword ? 'AND (p.name LIKE ? OR p.sku LIKE ?)' : ''
    const params: any[] = keyword ? [`%${keyword}%`, `%${keyword}%`] : []
    const countRows = await this.dataSource.query(`SELECT COUNT(*) AS total FROM product p WHERE p.is_published = 1 ${where}`, params)
    const rows = await this.dataSource.query(
      `SELECT p.id, p.sku, p.name, p.slug, p.dealer_price, p.moq, p.age_range, p.material,
              p.summary, p.images_json, c.name AS category_name
       FROM product p JOIN product_category c ON c.id = p.category_id
       WHERE p.is_published = 1 ${where}
       ORDER BY p.is_featured DESC, p.created_at DESC, p.id ASC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params
    )
    return {
      items: rows.map((row: any) => ({
        id: String(row.id), sku: row.sku, name: row.name, slug: row.slug,
        dealerPrice: Number(row.dealer_price), moq: Number(row.moq), ageRange: row.age_range,
        material: row.material, summary: row.summary, categoryName: row.category_name,
        coverImage: this.firstImage(row.images_json), tierName: context.company.tier_name
      })),
      total: Number(countRows[0]?.total || 0), page, pageSize
    }
  }

  async createQuote(user: RequestUser, input: CreateDealerQuoteDto) {
    const context = await this.context(user)
    this.assertNotPast(input.requestedDeliveryDate, '期望交期')
    const products = await this.productsForItems(input.items)
    const quoteNo = this.number('QUO')
    await this.dataSource.transaction(async (manager) => {
      const result: any = await manager.query(
        `INSERT INTO dealer_quote
         (quote_no, company_id, created_by, status, requested_delivery_date, notes)
         VALUES (?, ?, ?, 'SUBMITTED', ?, ?)`,
        [quoteNo, context.companyId, Number(user.id), input.requestedDeliveryDate || null, input.notes?.trim() || null]
      )
      const quoteId = this.insertIdOf(result)
      for (const item of input.items) {
        const product = products.get(item.productId)!
        await manager.query(
          `INSERT INTO dealer_quote_item
           (quote_id, product_id, sku_snapshot, product_name_snapshot, quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [quoteId, item.productId, product.sku, product.name, item.quantity]
        )
      }
    })
    return { quoteNo, status: 'SUBMITTED' }
  }

  async quotes(user: RequestUser, query: DealerWorkspaceQueryDto) {
    const context = await this.context(user)
    return this.quoteRows(context.companyId, query, query.page || 1, query.pageSize || 10)
  }

  async createOrder(user: RequestUser, input: CreateDealerOrderDto) {
    const context = await this.context(user)
    this.assertNotPast(input.requestedDeliveryDate, '期望交期')
    const products = await this.productsForItems(input.items)
    const addressRows = await this.dataSource.query('SELECT * FROM dealer_address WHERE id = ? AND company_id = ? LIMIT 1', [input.addressId, context.companyId])
    const address = addressRows[0]
    if (!address) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '收货地址不存在' })
    if (input.paymentMethod === 'PURCHASE_ORDER' && !input.poNumber?.trim()) {
      throw new ConflictException({ code: 'VALIDATION_400', message: '采购订单结算必须填写 PO Number' })
    }
    for (const item of input.items) {
      const product = products.get(item.productId)!
      if (item.quantity < Number(product.moq)) {
        throw new ConflictException({ code: 'VALIDATION_400', message: `${product.name} 的起订量为 ${product.moq}` })
      }
    }
    const orderNo = this.number('ORD')
    const total = input.items.reduce((sum, item) => sum + Number(products.get(item.productId)!.dealer_price) * item.quantity, 0)
    const fullAddress = `${address.province}${address.city}${address.district}${address.detail_address}`
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO orders
         (id, order_type, user_id, company_id, customer_name, customer_company, customer_phone,
          customer_address, total_amount, payment_method, po_number, requested_delivery_date, notes, status)
         VALUES (?, 'B2B', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')`,
        [orderNo, Number(user.id), context.companyId, context.user.real_name || user.username,
          context.company.company_name, address.phone, fullAddress, total, input.paymentMethod,
          input.poNumber?.trim() || null, input.requestedDeliveryDate || null, input.notes?.trim() || null]
      )
      for (const item of input.items) {
        const product = products.get(item.productId)!
        const unitPrice = Number(product.dealer_price)
        await manager.query(
          `INSERT INTO order_item (order_id, product_id, sku, product_name, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderNo, item.productId, product.sku, product.name, unitPrice, item.quantity, unitPrice * item.quantity]
        )
      }
    })
    return { orderNo, status: 'PENDING_REVIEW', totalAmount: total }
  }

  async orders(user: RequestUser, query: DealerWorkspaceQueryDto) {
    const context = await this.context(user)
    return this.orderRows(context.companyId, query, query.page || 1, query.pageSize || 10)
  }

  async invoices(user: RequestUser, query: DealerWorkspaceQueryDto) {
    const context = await this.context(user)
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const status = query.status ? 'AND i.status = ?' : ''
    const params = query.status ? [query.status] : []
    const [countRows, rows] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM dealer_invoice i WHERE i.company_id = ? ${status}`, [context.companyId, ...params]),
      this.dataSource.query(
        `SELECT i.invoice_no, i.order_id, i.status, i.amount, i.issued_at, i.due_at, i.file_url
         FROM dealer_invoice i WHERE i.company_id = ? ${status}
         ORDER BY i.issued_at DESC, i.id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        [context.companyId, ...params]
      )
    ])
    return { items: rows.map((row: any) => ({ invoiceNo: row.invoice_no, orderNo: row.order_id, status: row.status, amount: Number(row.amount), issuedAt: row.issued_at, dueAt: row.due_at, fileUrl: row.file_url })), total: Number(countRows[0]?.total || 0), page, pageSize }
  }

  async company(user: RequestUser) {
    const context = await this.context(user)
    const [members, addresses] = await Promise.all([
      this.dataSource.query('SELECT id, username, real_name, email, phone, dealer_member_role, status, created_at FROM sys_user WHERE company_id = ? AND role = \'DEALER\' ORDER BY created_at ASC', [context.companyId]),
      this.dataSource.query('SELECT * FROM dealer_address WHERE company_id = ? ORDER BY is_default DESC, id ASC', [context.companyId])
    ])
    return {
      company: this.companyDto(context.company), memberRole: context.memberRole,
      members: members.map((row: any) => ({ id: String(row.id), username: row.username, realName: row.real_name, email: row.email, phone: row.phone, memberRole: row.dealer_member_role || 'MEMBER', status: Number(row.status), createdAt: row.created_at })),
      addresses: addresses.map((row: any) => this.addressDto(row))
    }
  }

  async updateCompany(user: RequestUser, input: UpdateDealerCompanyDto) {
    const context = await this.context(user, true)
    await this.dataSource.query(
      `UPDATE dealer_company SET business_type = ?, contact_name = ?, contact_phone = ?, contact_email = ? WHERE id = ?`,
      [input.businessType.trim(), input.contactName.trim(), input.contactPhone.trim(), input.contactEmail.toLowerCase(), context.companyId]
    )
    return this.company(user)
  }

  async createAddress(user: RequestUser, input: CreateDealerAddressDto) {
    const context = await this.context(user, true)
    return this.dataSource.transaction(async (manager) => {
      if (input.isDefault) {
        await manager.query('UPDATE dealer_address SET is_default = 0 WHERE company_id = ? AND address_type = ?', [context.companyId, input.addressType])
      }
      const result: any = await manager.query(
        `INSERT INTO dealer_address
         (company_id, label, recipient_name, phone, province, city, district, detail_address, address_type, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [context.companyId, input.label.trim(), input.recipientName.trim(), input.phone.trim(), input.province.trim(), input.city.trim(), input.district.trim(), input.detailAddress.trim(), input.addressType, input.isDefault ? 1 : 0]
      )
      const rows = await manager.query('SELECT * FROM dealer_address WHERE id = ? LIMIT 1', [this.insertIdOf(result)])
      return this.addressDto(rows[0])
    })
  }

  async adminQuotes(query: DealerWorkspaceQueryDto) {
    const page = query.page || 1; const pageSize = query.pageSize || 20
    const status = query.status ? 'AND q.status = ?' : ''; const params = query.status ? [query.status] : []
    const [countRows, rows] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM dealer_quote q WHERE 1=1 ${status}`, params),
      this.dataSource.query(
        `SELECT q.quote_no, q.status, q.requested_delivery_date, q.valid_until, q.notes, q.platform_note,
                q.total_amount, q.created_at, c.company_name, COUNT(qi.id) AS item_count
         FROM dealer_quote q JOIN dealer_company c ON c.id = q.company_id
         LEFT JOIN dealer_quote_item qi ON qi.quote_id = q.id
         WHERE 1=1 ${status} GROUP BY q.id ORDER BY q.created_at DESC
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params
      )
    ])
    return { items: rows.map((row: any) => ({ quoteNo: row.quote_no, companyName: row.company_name, status: row.status, requestedDeliveryDate: row.requested_delivery_date, validUntil: row.valid_until, notes: row.notes, platformNote: row.platform_note, totalAmount: row.total_amount == null ? null : Number(row.total_amount), itemCount: Number(row.item_count), createdAt: row.created_at })), total: Number(countRows[0]?.total || 0), page, pageSize }
  }

  async decideQuote(quoteNo: string, input: AdminQuoteDecisionDto) {
    if (input.action === 'QUOTED') this.assertNotPast(input.validUntil, '报价有效期')
    return this.dataSource.transaction(async (manager) => {
      // SQLite 不支持 SELECT ... FOR UPDATE，只有 MySQL/PostgreSQL 需要显式行锁
      const lockClause = (this.dataSource?.options as any)?.type === 'sqlite' ? '' : ' FOR UPDATE'
      const rows = await manager.query(
        `SELECT id, status FROM dealer_quote WHERE quote_no = ?${lockClause}`,
        [quoteNo]
      )
      const quote = rows[0]
      if (!quote) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '报价单不存在' })
      if (quote.status !== 'SUBMITTED') throw new ConflictException({ code: 'CONFLICT_409', message: '只有已提交的报价请求可以回复' })
      const total = input.action === 'QUOTED' ? Number(input.totalAmountFen) / 100 : null
      await manager.query(
        `UPDATE dealer_quote SET status = ?, total_amount = ?, valid_until = ?, platform_note = ? WHERE id = ?`,
        [input.action, total, input.action === 'QUOTED' ? input.validUntil : null, input.platformNote.trim(), quote.id]
      )
      return { quoteNo, status: input.action, totalAmount: total, validUntil: input.validUntil || null, platformNote: input.platformNote.trim() }
    })
  }

  async adminOrders(query: DealerWorkspaceQueryDto) {
    const page = query.page || 1; const pageSize = query.pageSize || 20
    const status = query.status ? 'AND o.status = ?' : ''; const params = query.status ? [query.status] : []
    const [countRows, rows] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM orders o WHERE o.company_id IS NOT NULL ${status}`, params),
      this.dataSource.query(
        `SELECT o.id, o.po_number, o.total_amount, o.payment_method, o.status, o.tracking_no,
                o.requested_delivery_date, o.created_at, c.company_name, COUNT(oi.id) AS item_count
         FROM orders o JOIN dealer_company c ON c.id = o.company_id
         LEFT JOIN order_item oi ON oi.order_id = o.id
         WHERE o.company_id IS NOT NULL ${status} GROUP BY o.id ORDER BY o.created_at DESC
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params
      )
    ])
    return { items: rows.map((row: any) => ({ orderNo: row.id, companyName: row.company_name, poNumber: row.po_number, totalAmount: Number(row.total_amount), paymentMethod: row.payment_method, status: row.status, trackingNo: row.tracking_no, requestedDeliveryDate: row.requested_delivery_date, itemCount: Number(row.item_count), createdAt: row.created_at })), total: Number(countRows[0]?.total || 0), page, pageSize }
  }

  async updateOrderStatus(orderNo: string, input: AdminOrderStatusDto) {
    const rows = await this.dataSource.query('SELECT status FROM orders WHERE id = ? AND company_id IS NOT NULL LIMIT 1', [orderNo])
    const current = rows[0]?.status
    if (!current) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '经销商订单不存在' })
    const transitions: Record<string, string[]> = {
      PENDING_REVIEW: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['SHIPPED', 'CANCELLED'],
      PAID: ['CONFIRMED', 'CANCELLED'], SHIPPED: ['COMPLETED']
    }
    if (!transitions[current]?.includes(input.status)) {
      throw new ConflictException({ code: 'CONFLICT_409', message: `订单不能从 ${current} 变更为 ${input.status}` })
    }
    await this.dataSource.query('UPDATE orders SET status = ?, tracking_no = COALESCE(?, tracking_no) WHERE id = ?', [input.status, input.trackingNo?.trim() || null, orderNo])
    return { orderNo, status: input.status, trackingNo: input.trackingNo?.trim() || null }
  }

  async adminInvoices(query: DealerWorkspaceQueryDto) {
    const page = query.page || 1; const pageSize = query.pageSize || 20
    const status = query.status ? 'AND i.status = ?' : ''; const params = query.status ? [query.status] : []
    const [countRows, rows] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM dealer_invoice i WHERE 1=1 ${status}`, params),
      this.dataSource.query(
        `SELECT i.invoice_no, i.order_id, i.status, i.amount, i.issued_at, i.due_at, i.file_url, c.company_name
         FROM dealer_invoice i JOIN dealer_company c ON c.id = i.company_id
         WHERE 1=1 ${status} ORDER BY i.issued_at DESC, i.id DESC
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params
      )
    ])
    return { items: rows.map((row: any) => ({ invoiceNo: row.invoice_no, orderNo: row.order_id, companyName: row.company_name, status: row.status, amount: Number(row.amount), issuedAt: row.issued_at, dueAt: row.due_at, fileUrl: row.file_url })), total: Number(countRows[0]?.total || 0), page, pageSize }
  }

  async updateInvoiceStatus(invoiceNo: string, input: AdminInvoiceStatusDto) {
    const rows = await this.dataSource.query('SELECT status FROM dealer_invoice WHERE invoice_no = ? LIMIT 1', [invoiceNo])
    const current = rows[0]?.status
    if (!current) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '发票不存在' })
    if (current !== 'ISSUED') throw new ConflictException({ code: 'CONFLICT_409', message: '只有待处理发票可以更新状态' })
    await this.dataSource.query('UPDATE dealer_invoice SET status = ? WHERE invoice_no = ?', [input.status, invoiceNo])
    return { invoiceNo, status: input.status }
  }

  private async context(user: RequestUser, ownerOnly = false): Promise<DealerContext> {
    if (user.role !== 'DEALER' || !user.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '仅已启用的经销商账号可访问工作台' })
    }
    const rows = await this.dataSource.query(
      `SELECT u.real_name, u.phone, u.dealer_member_role,
              c.id, c.company_name, c.tax_id, c.business_type, c.region, c.tier_name,
              c.discount_rate, c.payment_terms, c.currency, c.account_manager,
              c.contact_name, c.contact_phone, c.contact_email, c.status
       FROM sys_user u JOIN dealer_company c ON c.id = u.company_id
       WHERE u.id = ? AND c.id = ? LIMIT 1`,
      [Number(user.id), Number(user.companyId)]
    )
    const row = rows[0]
    if (!row || row.status !== 'ACTIVE') {
      throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '经销商企业已停用，请联系平台管理员' })
    }
    const memberRole = (row.dealer_member_role || 'MEMBER') as 'OWNER' | 'MEMBER'
    if (ownerOnly && memberRole !== 'OWNER') {
      throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '只有经销商企业管理员可以修改企业资料' })
    }
    return { companyId: Number(row.id), memberRole, company: row, user: row }
  }

  private async productsForItems(items: Array<{ productId: number; quantity: number }>): Promise<Map<number, ProductRow>> {
    const ids = [...new Set(items.map((item) => Number(item.productId)))]
    if (ids.length !== items.length) throw new ConflictException({ code: 'VALIDATION_400', message: '同一商品不能重复提交' })
    const placeholders = ids.map(() => '?').join(',')
    const rows: ProductRow[] = await this.dataSource.query(
      `SELECT id, sku, name, dealer_price, moq FROM product WHERE is_published = 1 AND id IN (${placeholders})`, ids
    )
    if (rows.length !== ids.length) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '部分商品不存在或已下架，请刷新目录' })
    return new Map<number, ProductRow>(rows.map((row) => [Number(row.id), row]))
  }

  private async quoteRows(companyId: number, query: DealerWorkspaceQueryDto, page: number, pageSize: number) {
    const status = query.status ? 'AND q.status = ?' : ''
    const params = query.status ? [query.status] : []
    const [countRows, rows] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM dealer_quote q WHERE q.company_id = ? ${status}`, [companyId, ...params]),
      this.dataSource.query(
        `SELECT q.quote_no, q.status, q.requested_delivery_date, q.valid_until, q.notes, q.platform_note, q.total_amount,
                q.created_at, COUNT(qi.id) AS item_count
         FROM dealer_quote q LEFT JOIN dealer_quote_item qi ON qi.quote_id = q.id
         WHERE q.company_id = ? ${status}
         GROUP BY q.id ORDER BY q.created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        [companyId, ...params]
      )
    ])
    return { items: rows.map((row: any) => ({ quoteNo: row.quote_no, status: row.status, requestedDeliveryDate: row.requested_delivery_date, validUntil: row.valid_until, notes: row.notes, platformNote: row.platform_note, totalAmount: row.total_amount == null ? null : Number(row.total_amount), itemCount: Number(row.item_count), createdAt: row.created_at })), total: Number(countRows[0]?.total || 0), page, pageSize }
  }

  private async orderRows(companyId: number, query: DealerWorkspaceQueryDto, page: number, pageSize: number) {
    const status = query.status ? 'AND o.status = ?' : ''
    const params = query.status ? [query.status] : []
    const [countRows, rows] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM orders o WHERE o.company_id = ? ${status}`, [companyId, ...params]),
      this.dataSource.query(
        `SELECT o.id, o.po_number, o.total_amount, o.payment_method, o.status, o.tracking_no,
                o.requested_delivery_date, o.created_at, COUNT(oi.id) AS item_count
         FROM orders o LEFT JOIN order_item oi ON oi.order_id = o.id
         WHERE o.company_id = ? ${status}
         GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        [companyId, ...params]
      )
    ])
    return { items: rows.map((row: any) => ({ orderNo: row.id, poNumber: row.po_number, totalAmount: Number(row.total_amount), paymentMethod: row.payment_method, status: row.status, trackingNo: row.tracking_no, requestedDeliveryDate: row.requested_delivery_date, itemCount: Number(row.item_count), createdAt: row.created_at })), total: Number(countRows[0]?.total || 0), page, pageSize }
  }

  private companyDto(row: any) {
    return {
      id: String(row.id), companyName: row.company_name, taxId: row.tax_id,
      businessType: row.business_type, region: row.region, tierName: row.tier_name,
      discountRate: Number(row.discount_rate), paymentTerms: row.payment_terms,
      currency: row.currency, accountManager: row.account_manager,
      contactName: row.contact_name, contactPhone: row.contact_phone,
      contactEmail: row.contact_email, status: row.status
    }
  }

  private addressDto(row: any) {
    return { id: String(row.id), label: row.label, recipientName: row.recipient_name, phone: row.phone, province: row.province, city: row.city, district: row.district, detailAddress: row.detail_address, addressType: row.address_type, isDefault: Boolean(row.is_default) }
  }

  private firstImage(value: unknown) {
    try {
      const images = typeof value === 'string' ? JSON.parse(value) : value
      return Array.isArray(images) && images.length ? String(images[0]) : null
    } catch { return null }
  }

  private assertNotPast(value: string | undefined, label: string) {
    if (!value) return
    const today = new Date().toISOString().slice(0, 10)
    if (value < today) throw new BadRequestException({ code: 'VALIDATION_400', message: `${label}不能早于今天` })
  }

  /** MySQL 返回 insertId，SQLite 的 INSERT 直接返回 lastID 数字，统一取自增主键。 */
  private insertIdOf(result: any): number {
    if (typeof result === 'number') return result
    return Number(result?.insertId ?? result?.lastID ?? result?.lastId ?? 0)
  }

  private number(prefix: 'QUO' | 'ORD') {
    const now = new Date()
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    return `${prefix}-${date}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
  }
}

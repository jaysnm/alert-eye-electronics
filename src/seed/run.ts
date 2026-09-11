import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { placeholderPng } from './placeholder'

const lexical = (text: string): any => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
      },
    ],
  },
})

async function main() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[seed] ${m}`)

  // ---- Admin user ----
  const existingAdmins = await payload.count({ collection: 'users' })
  if (existingAdmins.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { name: 'Store Admin', email: 'admin@alerteye.co.ke', password: 'ChangeMe123!', role: 'admin' },
    })
    log('created admin@alerteye.co.ke / ChangeMe123!')
  }

  // ---- Skip if already seeded ----
  const productCount = await payload.count({ collection: 'products' })
  if (productCount.totalDocs > 0) {
    log('products already exist — skipping catalog seed')
    return
  }

  const mkMedia = async (label: string, seed: number) => {
    const doc = await payload.create({
      collection: 'media',
      data: { alt: label },
      file: { data: await placeholderPng(label, 800, 800, seed), name: `${label.toLowerCase().replace(/\W+/g, '-')}.png`, mimetype: 'image/png', size: 0 },
    })
    return doc.id
  }

  // ---- Categories ----
  const categoryData = [
    'CCTV Cameras',
    'DVR & NVR Kits',
    'Access Control',
    'Networking',
    'Alarms & Sensors',
    'Power & Backup',
    'Laptops & Computers',
    'Accessories',
  ]
  const categories: Record<string, number> = {}
  for (let i = 0; i < categoryData.length; i++) {
    const name = categoryData[i]
    const doc = await payload.create({
      collection: 'categories',
      data: { name, showInNav: i < 6, navOrder: i * 10, image: await mkMedia(name, i) },
    })
    categories[name] = doc.id
  }
  log(`created ${categoryData.length} categories`)

  // ---- Brands ----
  const brandNames = ['Hikvision', 'Dahua', 'TP-Link', 'Ubiquiti', 'APC', 'Ezviz']
  const brands: Record<string, number> = {}
  for (let i = 0; i < brandNames.length; i++) {
    const doc = await payload.create({ collection: 'brands', data: { name: brandNames[i], logo: await mkMedia(brandNames[i], i + 2) } })
    brands[brandNames[i]] = doc.id
  }

  // ---- Products ----
  const products: {
    title: string
    priceKES: number
    compareAtPriceKES?: number
    stockQty: number
    category: string
    brand: string
    featured?: boolean
    short: string
    warranty?: string
    specs: [string, string][]
  }[] = [
    { title: 'Hikvision 2MP Dome CCTV Camera (Indoor)', priceKES: 3500, compareAtPriceKES: 4200, stockQty: 40, category: 'CCTV Cameras', brand: 'Hikvision', featured: true, short: '1080p indoor dome camera with 20m IR night vision.', warranty: '2 year warranty', specs: [['Resolution', '2MP / 1080p'], ['Night vision', '20m IR'], ['Lens', '2.8mm fixed'], ['Audio', 'Built-in mic'] ] },
    { title: 'Hikvision 5MP Bullet CCTV Camera (Outdoor)', priceKES: 5200, stockQty: 25, category: 'CCTV Cameras', brand: 'Hikvision', featured: true, short: 'Weatherproof 5MP bullet camera, 40m night range.', warranty: '2 year warranty', specs: [['Resolution', '5MP'], ['Night vision', '40m IR'], ['Rating', 'IP67'], ['Lens', '3.6mm'] ] },
    { title: 'Dahua 4MP Colour Night Vision Camera', priceKES: 6800, stockQty: 3, category: 'CCTV Cameras', brand: 'Dahua', short: 'Full-colour 24/7 imaging with warm LED.', warranty: '2 year warranty', specs: [['Resolution', '4MP'], ['Full colour', 'Yes'], ['Mic', 'Built-in'] ] },
    { title: 'Hikvision 8-Channel DVR Kit + 4 Cameras', priceKES: 32000, compareAtPriceKES: 38000, stockQty: 12, category: 'DVR & NVR Kits', brand: 'Hikvision', featured: true, short: 'Complete 4-camera surveillance kit with 8CH DVR and 1TB HDD.', warranty: '2 year warranty', specs: [['Channels', '8'], ['Cameras', '4 × 2MP bullet'], ['Storage', '1TB HDD included'], ['Remote view', 'Hik-Connect app'] ] },
    { title: 'Dahua 16-Channel NVR (PoE)', priceKES: 24500, stockQty: 6, category: 'DVR & NVR Kits', brand: 'Dahua', short: '16-channel PoE NVR for IP camera systems.', warranty: '2 year warranty', specs: [['Channels', '16'], ['PoE ports', '16'], ['Max resolution', '8MP'] ] },
    { title: 'ZKTeco Fingerprint Door Access Kit', priceKES: 14500, stockQty: 9, category: 'Access Control', brand: 'Hikvision', short: 'Fingerprint + RFID access control with electric strike lock.', specs: [['Users', '3000 fingerprints'], ['Interface', 'RFID + PIN'], ['Lock', 'Electric strike included'] ] },
    { title: 'TP-Link Archer AX55 Wi-Fi 6 Router', priceKES: 11800, compareAtPriceKES: 13500, stockQty: 18, category: 'Networking', brand: 'TP-Link', featured: true, short: 'Dual-band AX3000 Wi-Fi 6 router for homes and small offices.', warranty: '3 year warranty', specs: [['Wi-Fi', 'AX3000 (Wi-Fi 6)'], ['Ports', '4 × Gigabit LAN'], ['Antennas', '4 external'] ] },
    { title: 'Ubiquiti UniFi 6 Lite Access Point', priceKES: 15500, stockQty: 14, category: 'Networking', brand: 'Ubiquiti', short: 'Wi-Fi 6 ceiling AP, PoE powered, managed via UniFi.', specs: [['Wi-Fi', 'Wi-Fi 6'], ['Throughput', '1.5 Gbps'], ['Power', 'PoE 802.3af'] ] },
    { title: 'TP-Link 8-Port Gigabit PoE Switch', priceKES: 9200, stockQty: 20, category: 'Networking', brand: 'TP-Link', short: '8-port unmanaged PoE+ switch, 61W budget.', specs: [['Ports', '8 × Gigabit'], ['PoE budget', '61W'], ['Standard', '802.3af/at'] ] },
    { title: 'Wireless PIR Motion Sensor', priceKES: 2200, stockQty: 50, category: 'Alarms & Sensors', brand: 'Ezviz', short: 'Battery PIR sensor, pairs with Ezviz alarm hubs.', specs: [['Range', '8m / 110°'], ['Battery', 'CR123A'], ['Wireless', '433MHz'] ] },
    { title: 'Ezviz Smart Alarm Kit', priceKES: 12900, stockQty: 7, category: 'Alarms & Sensors', brand: 'Ezviz', short: 'Hub, keypad, door contacts and PIR — app controlled.', specs: [['Zones', 'Up to 64'], ['Backup', 'Built-in battery'], ['App', 'Ezviz'] ] },
    { title: 'APC 650VA UPS Battery Backup', priceKES: 8900, compareAtPriceKES: 10500, stockQty: 15, category: 'Power & Backup', brand: 'APC', featured: true, short: 'Keeps routers, DVRs and modems running during outages.', warranty: '2 year warranty', specs: [['Capacity', '650VA / 325W'], ['Outlets', '4'], ['Runtime', '~30 min (modem+router)'] ] },
    { title: 'APC 1100VA Line-Interactive UPS', priceKES: 16500, stockQty: 8, category: 'Power & Backup', brand: 'APC', short: 'AVR line-interactive UPS for workstations and CCTV racks.', specs: [['Capacity', '1100VA / 660W'], ['AVR', 'Yes'], ['LCD', 'Yes'] ] },
    { title: 'HP 250 G9 Laptop (i5, 8GB, 512GB SSD)', priceKES: 62000, stockQty: 5, category: 'Laptops & Computers', brand: 'TP-Link', short: '15.6" business laptop — 12th Gen Core i5, Windows 11.', warranty: '1 year warranty', specs: [['CPU', 'Core i5-1235U'], ['RAM', '8GB DDR4'], ['Storage', '512GB NVMe SSD'], ['Display', '15.6" FHD'] ] },
    { title: '4TB Surveillance Hard Drive (WD Purple class)', priceKES: 13500, stockQty: 16, category: 'Accessories', brand: 'Hikvision', short: 'Purpose-built HDD for 24/7 DVR/NVR recording.', specs: [['Capacity', '4TB'], ['Use', '24/7 surveillance'], ['Interface', 'SATA 6Gb/s'] ] },
    { title: 'CCTV Cable RG59 + Power (100m Roll)', priceKES: 4800, stockQty: 30, category: 'Accessories', brand: 'Dahua', short: 'Pre-siamese coaxial + power cable for analog CCTV installs.', specs: [['Length', '100m'], ['Type', 'RG59 + 2C power'], ['Jacket', 'PVC'] ] },
  ]

  let n = 0
  for (const p of products) {
    await payload.create({
      collection: 'products',
      data: {
        title: p.title,
        priceKES: p.priceKES,
        compareAtPriceKES: p.compareAtPriceKES,
        stockQty: p.stockQty,
        sku: `AE-${1000 + n}`,
        shortDescription: p.short,
        description: lexical(`${p.short} Supplied by Alert Eye Electronics with nationwide delivery and professional installation available.`),
        warranty: p.warranty,
        status: 'active',
        featured: p.featured ?? false,
        category: [categories[p.category]],
        brand: brands[p.brand],
        images: [{ image: await mkMedia(p.title, n) }],
        specs: p.specs.map(([label, value]) => ({ label, value })),
      },
    })
    n++
  }
  log(`created ${products.length} products`)

  // ---- Service types ----
  const services = [
    { name: 'CCTV Camera Installation', from: 3500, summary: 'Supply and professional installation of CCTV systems for homes, shops and offices.', bullets: ['Free site survey within Nairobi', 'Neat cabling & configuration', 'Mobile app setup & training', '6-month workmanship warranty'] },
    { name: 'CCTV Repair & Maintenance', from: 2000, summary: 'Fault diagnosis, camera replacement, DVR recovery and system health checks.', bullets: ['Same-week response', 'Genuine replacement parts', 'Preventive maintenance contracts'] },
    { name: 'Electric Fence & Razor Wire', from: 15000, summary: 'Perimeter security installation with energizers, alarms and warning signage.', bullets: ['Wall-top & free-standing', 'Alarm integration', 'KPLC-compliant earthing'] },
    { name: 'Networking & Wi-Fi Setup', from: 5000, summary: 'Structured cabling, access points and internet load balancing for reliable coverage.', bullets: ['Site heat-mapping', 'Business-grade equipment', 'VLAN & guest network setup'] },
    { name: 'Access Control & Biometrics', from: 12000, summary: 'Fingerprint, RFID and keypad door control with time-attendance options.', bullets: ['Door strike & maglock fitting', 'Time & attendance software', 'Multi-door management'] },
    { name: 'Intercom & Video Doorbell', from: 8000, summary: 'Audio/video intercom systems for gates, apartments and reception desks.', bullets: ['Gate release integration', 'Multi-unit wiring', 'Smartphone answering'] },
  ]
  for (let i = 0; i < services.length; i++) {
    const s = services[i]
    await payload.create({
      collection: 'service-types',
      data: {
        name: s.name,
        summary: s.summary,
        description: lexical(s.summary),
        basePriceFromKES: s.from,
        image: await mkMedia(s.name, i + 1),
        bullets: s.bullets.map((text) => ({ text })),
        active: true,
        displayOrder: i * 10,
      },
    })
  }
  log(`created ${services.length} service types`)

  // ---- Globals ----
  const heroA = await mkMedia('Security you can see', 0)
  const heroB = await mkMedia('Installed by pros', 2)
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      slides: [
        { image: heroA, heading: 'CCTV & security systems, supplied and installed', subheading: 'Trusted brands, fair prices and a workmanship warranty — countrywide.', ctaLabel: 'Shop CCTV', ctaHref: '/shop/cctv-cameras' },
        { image: heroB, heading: 'Book a professional CCTV installation', subheading: 'Free site survey within Nairobi. Quote in 24 hours.', ctaLabel: 'Request installation', ctaHref: '/services/request' },
      ],
      featuredCategories: [categories['CCTV Cameras'], categories['DVR & NVR Kits'], categories['Networking'], categories['Access Control'], categories['Alarms & Sensors'], categories['Power & Backup']],
      promoStrip: { enabled: true, text: 'Professional CCTV installation — book a free site survey today.', ctaLabel: 'Request installation', ctaHref: '/services/request' },
      whyChooseUs: [
        { title: 'Genuine products', body: 'Authorised stock with valid manufacturer warranty.', icon: 'badge-check' },
        { title: 'Certified technicians', body: 'Trained installers for CCTV, networking and access control.', icon: 'wrench' },
        { title: 'Countrywide delivery', body: 'Fast dispatch to all major towns in Kenya.', icon: 'truck' },
        { title: 'After-sales support', body: 'Call, WhatsApp or visit — we keep your system running.', icon: 'headset' },
      ],
      testimonials: [
        { quote: 'Alert Eye installed 8 cameras at our shop in one day. Clean work and the app setup was smooth.', author: 'James M.', role: 'Retail owner, Nairobi' },
        { quote: 'Fair pricing and they actually picked up the phone when I had a question weeks later.', author: 'Wanjiku K.', role: 'Homeowner, Thika' },
        { quote: 'Our office Wi-Fi finally reaches every room. Highly recommend their networking team.', author: 'Peter O.', role: 'Office manager' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      announcement: 'Free CCTV site survey within Nairobi · Countrywide delivery',
      phone: '+254 711 222 333',
      whatsapp: '+254711222333',
      email: 'sales@alerteye.co.ke',
      addressLine: 'Luthuli Avenue, Nairobi CBD',
      hours: 'Mon–Sat 8:00am – 6:00pm',
      deliveryRates: [
        { label: 'Nairobi CBD pickup', feeKES: 0 },
        { label: 'Within Nairobi', feeKES: 300 },
        { label: 'Countrywide courier', feeKES: 650 },
      ],
      trustBadges: [
        { title: 'Countrywide delivery', subtitle: 'All major towns', icon: 'truck' },
        { title: 'Warranty backed', subtitle: 'Genuine products', icon: 'shield' },
        { title: 'Pro installation', subtitle: 'Certified techs', icon: 'wrench' },
        { title: 'Pay by M-Pesa', subtitle: 'or card / on delivery', icon: 'credit-card' },
      ],
    },
  })

  // ---- Content pages ----
  const pages = [
    { title: 'About Us', slug: 'about', intro: 'Alert Eye Electronics supplies and installs security and electronics across Kenya.', body: 'We are a Nairobi-based retailer and installer specialising in CCTV, access control, networking and power backup. Our team combines a well-stocked shop with a certified technical crew, so you can buy the right equipment and have it installed properly — with support that continues after the job is done.' },
    { title: 'Contact', slug: 'contact', intro: 'Talk to our sales and technical team.', body: 'Visit us on Luthuli Avenue, Nairobi CBD, call +254 711 222 333, or message us on WhatsApp. For installation enquiries, submit a service request and we will schedule a site survey.' },
    { title: 'Delivery & Returns', slug: 'delivery-returns', intro: 'How we get your order to you.', body: 'Orders within Nairobi are delivered same or next day. Countrywide orders ship via courier and typically arrive in 1–3 working days. Unopened items in original packaging can be returned within 7 days. Faulty items are covered by the manufacturer warranty stated on the product.' },
    { title: 'Warranty', slug: 'warranty', intro: 'What is covered.', body: 'Hardware carries the manufacturer warranty shown on each product page (typically 1–3 years). Installation workmanship is covered for 6 months. Warranty excludes damage from power surges where no surge protection was fitted, lightning, or tampering.' },
  ]
  for (const p of pages) {
    await payload.create({ collection: 'pages', data: { title: p.title, slug: p.slug, intro: p.intro, body: lexical(p.body) } })
  }
  log(`created ${pages.length} pages`)

  log('done ✔')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

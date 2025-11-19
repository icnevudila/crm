/**
 * VAPID Keys Generator
 * Web Push Notifications için VAPID key'leri oluşturur
 * 
 * Kullanım: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push')

console.log('🔑 VAPID Keys oluşturuluyor...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID Keys oluşturuldu!\n')
console.log('📋 .env.local dosyanıza şunları ekleyin:\n')
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('VAPID_SUBJECT=mailto:admin@yourdomain.com\n')
console.log('⚠️  ÖNEMLİ: VAPID_PRIVATE_KEY\'i asla public repository\'ye commit etmeyin!')
console.log('⚠️  Production\'da environment variable olarak ayarlayın.\n')


 * VAPID Keys Generator
 * Web Push Notifications için VAPID key'leri oluşturur
 * 
 * Kullanım: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push')

console.log('🔑 VAPID Keys oluşturuluyor...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID Keys oluşturuldu!\n')
console.log('📋 .env.local dosyanıza şunları ekleyin:\n')
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('VAPID_SUBJECT=mailto:admin@yourdomain.com\n')
console.log('⚠️  ÖNEMLİ: VAPID_PRIVATE_KEY\'i asla public repository\'ye commit etmeyin!')
console.log('⚠️  Production\'da environment variable olarak ayarlayın.\n')


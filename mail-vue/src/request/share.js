import http from '@/axios/index.js'

export function shareEmail(accountId, expiresIn = 86400000, password = '') {
    return http.post('/share/email', { accountId, expiresIn, password })
}

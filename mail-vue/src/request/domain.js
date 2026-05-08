import http from '@/axios/index.js'

export function domainPublicList() {
    return http.get('/domain/public')
}

export function domainMyList() {
    return http.get('/domain/my')
}

export function domainAvailableList() {
    return http.get('/domain/available')
}

export function domainAdd(params) {
    return http.post('/domain/add', params)
}

export function domainVerify(params) {
    return http.post('/domain/verify', params)
}

export function domainSetPublic(params) {
    return http.post('/domain/setPublic', params)
}

export function domainSetEnabled(params) {
    return http.post('/domain/setEnabled', params)
}

export function domainDelete(domainId) {
    return http.delete('/domain/delete', { params: { domainId } })
}

export function accountRandom(params = {}) {
    return http.get('/account/random', { params })
}

export function domainDetectProvider(params) {
    return http.post('/domain/detectProvider', params)
}

export function domainAutoConfigure(params) {
    return http.post('/domain/autoConfigure', params)
}

export function domainAdminList() {
    return http.get('/domain/admin')
}

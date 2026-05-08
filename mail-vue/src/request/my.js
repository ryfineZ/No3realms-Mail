import http from '@/axios/index.js';

export function loginUserInfo() {
    return http.get('/my/loginUserInfo')
}

export function resetPassword(password) {
    return http.put('/my/resetPassword', {password})
}

export function userDelete() {
    return http.delete('/my/delete')
}

export function apiKeyList() {
    return http.get('/apiKey/list')
}

export function apiKeyCreate(name) {
    return http.post('/apiKey/create', {name})
}

export function apiKeyDelete(apiKeyId) {
    return http.delete('/apiKey/delete', {params: {apiKeyId}})
}


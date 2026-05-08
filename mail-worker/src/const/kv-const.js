const KvConst = {
	AUTH_INFO: 'auth-uid:',
	SETTING: 'setting:',
	SEND_DAY_COUNT: 'send_day_count:',
	PUBLIC_KEY: "public_key:",
	DOMAIN_LIST: 'domain_list:',
	TEMP_EMAIL: 'temp:email:',   // temp:email:{addr} → { token, expiry }
	TEMP_SESSION: 'temp:sess:',  // temp:sess:{token} → { email, expiry }
	TEMP_INBOX: 'temp:inbox:',   // temp:inbox:{token} → [ ...emails ]
}

export default KvConst;
